import { describe, expect, it } from 'vitest'
import { computeMolecularWeight } from './molecularWeight'
import { computeGuinier } from './guinier'
import { computePorod } from './porod'
import { makeSphereCurve, sphereRg } from '../test/fixtures'
import type { GuinierResult, SaxsData } from '../types/saxs'

const R = 50

function sphere(qMax = 0.34): SaxsData {
	return makeSphereCurve(R, { qMin: 0.0045, qMax, n: 2000 })
}

function guinierOf(data: SaxsData): GuinierResult {
	const iMax = data.q.findIndex((q) => q * sphereRg(R) > 1.0) - 1
	return computeGuinier(data, 0, iMax)!
}

describe('computeMolecularWeight', () => {
	it('follows the published definitions', () => {
		// Vc = I(0) / integral q*I(q) dq;  QR = Vc^2 / Rg;  MW = QR / 0.1231
		// Rambo & Tainer, Nature 496, 477-481 (2013), protein parameters.
		const data = sphere()
		const g = guinierOf(data)
		const r = computeMolecularWeight(data, g)!

		expect(r.volumeOfCorrelation).toBeCloseTo(g.I0 / r.qIIntegral, 8)
		expect(r.qR).toBeCloseTo(r.volumeOfCorrelation ** 2 / g.Rg, 8)
		expect(r.molecularWeight).toBeCloseTo(r.qR / 0.1231, 6)
	})

	it('is independent of concentration', () => {
		// The central claim of the method: Vc is a ratio of I(0) to an integral
		// of I, so a scale factor on the intensities cancels exactly.
		const data = sphere()
		const g = guinierOf(data)
		const base = computeMolecularWeight(data, g)!

		for (const scale of [0.1, 2, 37]) {
			const scaled: SaxsData = {
				...data,
				I: data.I.map((v) => v * scale),
				err: data.err.map((v) => v * scale),
			}
			const sg = guinierOf(scaled)
			const r = computeMolecularWeight(scaled, sg)!

			expect(r.volumeOfCorrelation / base.volumeOfCorrelation).toBeCloseTo(1, 6)
			expect(r.molecularWeight / base.molecularWeight).toBeCloseTo(1, 6)
		}
	})

	it('survives truncation better than the Porod volume', () => {
		// Vc integrates q*I, whose integrand falls as q^-3 rather than the
		// invariant's q^-2, so it settles sooner. This is the reason it is the
		// more trustworthy of the two on a short q range.
		const spread = (values: number[]) =>
			(Math.max(...values) - Math.min(...values)) / values[0]

		const qMaxes = [0.2, 0.25, 0.3, 0.34]
		const masses: number[] = []
		const volumes: number[] = []
		for (const qMax of qMaxes) {
			const data = sphere(qMax)
			const g = guinierOf(data)
			masses.push(computeMolecularWeight(data, g)!.molecularWeight)
			volumes.push(computePorod(data, g)!.porodVolume)
		}

		expect(spread(masses)).toBeLessThan(spread(volumes))
	})

	it('reports how much of the integral sits in the top decile of q', () => {
		const wide = computeMolecularWeight(sphere(0.34), guinierOf(sphere(0.34)))!
		const narrow = computeMolecularWeight(sphere(0.15), guinierOf(sphere(0.15)))!

		expect(wide.tailFraction).toBeGreaterThan(0)
		expect(wide.tailFraction).toBeLessThan(0.05)
		// A shorter range leaves proportionally more of the integral at the end,
		// which is the signal that it has not converged.
		expect(narrow.tailFraction).toBeGreaterThan(wide.tailFraction)
	})

	it('scales as expected with its inputs', () => {
		const data = sphere()
		const g = guinierOf(data)
		const base = computeMolecularWeight(data, g)!
		// QR = Vc^2 / Rg, so doubling Rg alone halves the mass.
		const doubled = computeMolecularWeight(data, { ...g, Rg: g.Rg * 2 })!
		expect(doubled.molecularWeight / base.molecularWeight).toBeCloseTo(0.5, 8)
	})

	it('returns null rather than a meaningless mass', () => {
		const data = sphere()
		const g = guinierOf(data)

		expect(computeMolecularWeight({ q: [0.1], I: [1], err: [0.1] }, g)).toBeNull()
		expect(computeMolecularWeight(data, { ...g, I0: 0 })).toBeNull()
		expect(computeMolecularWeight(data, { ...g, I0: NaN })).toBeNull()
		expect(computeMolecularWeight(data, { ...g, Rg: NaN })).toBeNull()
		expect(computeMolecularWeight(data, { ...g, Rg: -1 })).toBeNull()

		// Every intensity non-positive leaves nothing to integrate.
		const dead: SaxsData = { ...data, I: data.I.map(() => -1) }
		expect(computeMolecularWeight(dead, g)).toBeNull()
	})
})
