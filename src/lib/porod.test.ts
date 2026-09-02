import { describe, expect, it } from 'vitest'
import { computePorod } from './porod'
import { computeGuinier } from './guinier'
import { makeSphereCurve, sphereRg, sphereVolume } from '../test/fixtures'
import type { GuinierResult, SaxsData } from '../types/saxs'

const R = 50
const TRUE_VOLUME = sphereVolume(R)

/** A sphere curve over a realistic experimental window. */
function sphere(qMax = 0.5, background = 0): SaxsData {
	const base = makeSphereCurve(R, { qMin: 0.0045, qMax, n: 2000 })
	return background === 0
		? base
		: { ...base, I: base.I.map((v) => v + background) }
}

/** Guinier fit over the valid range of a curve, for the I(0) and Rg Porod needs. */
function guinierOf(data: SaxsData): GuinierResult {
	const iMax = data.q.findIndex((q) => q * sphereRg(R) > 1.0) - 1
	return computeGuinier(data, 0, iMax)!
}

describe('computePorod', () => {
	it('recovers a flat background from the Porod region', () => {
		// Accuracy improves with the size of the background: one far below the
		// particle's own q^-4 tail is intrinsically hard to separate from it.
		// What matters downstream is that removing it makes the volume
		// background-independent, which the test below pins to three decimals.
		const errors = [0.001, 0.01, 0.1].map((B) => {
			const r = computePorod(sphere(0.5, B), guinierOf(sphere(0.5)))!
			return Math.abs(r.background - B) / B
		})

		for (const e of errors) expect(e).toBeLessThan(0.05)
		expect(errors).toEqual([...errors].sort((a, b) => b - a))
	})

	it('reports a background near zero when there is none', () => {
		const data = sphere(0.5)
		const r = computePorod(data, guinierOf(data))!
		// Relative to the intensity scale, not absolutely - I(0) is 100 here.
		expect(Math.abs(r.background)).toBeLessThan(1e-4)
	})

	it('gives the same volume whatever the background level', () => {
		// The whole point of fitting B: the invariant weights by q^2, so an
		// unremoved background contributes B*q^3/3 and grows with the range.
		const reference = guinierOf(sphere(0.5))
		const volumes = [0, 0.001, 0.01, 0.1].map(
			(B) => computePorod(sphere(0.5, B), reference)!.porodVolume,
		)
		for (const v of volumes) {
			expect(v / volumes[0]).toBeCloseTo(1, 3)
		}
	})

	it('recovers the true particle volume within 1%', () => {
		// Was an it.fails marker for ROADMAP item 3 - the old implementation
		// integrated only the measured range and came out ~7% high.
		const data = sphere(0.5)
		const r = computePorod(data, guinierOf(data))!
		expect(Math.abs(r.porodVolume - TRUE_VOLUME) / TRUE_VOLUME).toBeLessThan(
			0.01,
		)
	})

	it('survives a truncated q range', () => {
		const ratios = [0.3, 0.4, 0.5].map((qMax) => {
			const data = sphere(qMax)
			return computePorod(data, guinierOf(data))!.porodVolume / TRUE_VOLUME
		})
		// The old code drifted from 1.07 to 1.04 across this range.
		for (const ratio of ratios) expect(Math.abs(ratio - 1)).toBeLessThan(0.02)
	})

	it('splits the invariant into three contributions that sum to the whole', () => {
		const data = sphere(0.5)
		const r = computePorod(data, guinierOf(data))!

		expect(r.qLow + r.qMeasured + r.qHigh).toBeCloseTo(r.porodInvariant, 10)
		expect(r.qLow).toBeGreaterThanOrEqual(0)
		expect(r.qMeasured).toBeGreaterThan(0)
		// The measured range should dominate a well-collected curve.
		expect(r.qMeasured / r.porodInvariant).toBeGreaterThan(0.9)
	})

	it('adds the q^-4 tail in closed form as K / qMax', () => {
		const data = sphere(0.5)
		const r = computePorod(data, guinierOf(data))!
		expect(r.qHigh).toBeCloseTo(r.porodConstant / data.q[data.q.length - 1], 12)
		expect(r.porodConstant).toBeGreaterThan(0)
	})

	it('reports the background fit window it used', () => {
		const data = sphere(0.5)
		const r = computePorod(data, guinierOf(data))!
		expect(r.backgroundFitPoints).toBe(1000)
		expect(r.backgroundFitQMin).toBeCloseTo(data.q[1000], 10)
	})

	it('falls back to the raw measured integral without a usable Porod region', () => {
		const data = sphere(0.5)
		const short: SaxsData = {
			q: data.q.slice(0, 30),
			I: data.I.slice(0, 30),
			err: data.err.slice(0, 30),
		}
		const r = computePorod(short, guinierOf(data))!
		expect(r.backgroundFitPoints).toBe(0)
		expect(r.background).toBe(0)
		expect(r.qHigh).toBe(0)
		expect(Number.isNaN(r.backgroundFitQMin)).toBe(true)
		expect(r.porodInvariant).toBeGreaterThan(0)
	})

	it('returns null for degenerate input', () => {
		const data = sphere(0.5)
		const g = guinierOf(data)
		const one: SaxsData = { q: [0.1], I: [1], err: [0.1] }

		expect(computePorod(one, g)).toBeNull()
		expect(computePorod(data, { ...g, I0: 0 })).toBeNull()
		expect(computePorod(data, { ...g, I0: -5 })).toBeNull()
		expect(computePorod(data, { ...g, I0: NaN })).toBeNull()
	})

	it('still returns a volume when Rg is unusable', () => {
		// A NaN Rg only kills the low-q term, which is the smallest of the three.
		const data = sphere(0.5)
		const g = guinierOf(data)
		const r = computePorod(data, { ...g, Rg: NaN })!
		expect(r.qLow).toBe(0)
		expect(r.porodVolume).toBeGreaterThan(0)
	})
})
