import { describe, expect, it } from 'vitest'
import { computePorod } from './porod'
import { makeSphereCurve, sphereVolume } from '../test/fixtures'
import type { SaxsData } from '../types/saxs'

/** Sphere of this radius backs every volume assertion below. */
const R = 50
const TRUE_VOLUME = sphereVolume(R)

/** A realistic experimental window - the tail is nowhere near measured. */
function realisticCurve(): SaxsData {
	return makeSphereCurve(R, { qMin: 1e-4, qMax: 0.3, n: 20000 })
}

describe('computePorod', () => {
	it('integrates q^2 I(q) by the trapezoidal rule', () => {
		// For I(q) = 1 the invariant has the closed form (qMax^3 - qMin^3) / 3.
		const n = 5000
		const qMin = 0.01
		const qMax = 1
		const q = Array.from(
			{ length: n },
			(_, i) => qMin + (i * (qMax - qMin)) / (n - 1),
		)
		const data: SaxsData = { q, I: q.map(() => 1), err: q.map(() => 0.01) }

		const expected = (qMax ** 3 - qMin ** 3) / 3
		expect(computePorod(data, 1)!.porodInvariant).toBeCloseTo(expected, 6)
	})

	it('skips segments touching a non-positive intensity', () => {
		const data: SaxsData = {
			q: [0.1, 0.2, 0.3],
			I: [1, -1, 1],
			err: [0.1, 0.1, 0.1],
		}
		// Both segments touch the negative point, so nothing is integrated.
		expect(computePorod(data, 1)).toBeNull()
	})

	it('returns null for degenerate input', () => {
		const one: SaxsData = { q: [0.1], I: [1], err: [0.1] }
		expect(computePorod(one, 1)).toBeNull()

		const ok = realisticCurve()
		expect(computePorod(ok, 0)).toBeNull()
		expect(computePorod(ok, -5)).toBeNull()
		expect(computePorod(ok, NaN)).toBeNull()
	})

	it('converges on the true particle volume as the q range extends', () => {
		// Vp = 2*pi^2*I(0)/Q is exact only for Q integrated to infinity, so the
		// formula is validated by watching the error shrink as qMax grows.
		const ratios = [0.5, 1, 2, 5].map((qMax) => {
			const d = makeSphereCurve(R, { qMin: 1e-4, qMax, n: 20000 })
			return computePorod(d, 100)!.porodVolume / TRUE_VOLUME
		})

		expect(ratios).toEqual([...ratios].sort((a, b) => b - a))
		expect(ratios.at(-1)).toBeCloseTo(1, 2)
	})

	/**
	 * Current behaviour, pinned so a change in the integration is deliberate.
	 * `computePorod` integrates only the measured range - no q -> 0 term, no
	 * Porod q^-4 tail beyond qMax, no flat background subtraction - so the
	 * invariant is too small and the volume correspondingly too large.
	 *
	 * See ROADMAP.md item 2.
	 */
	it('currently overestimates the volume by ~7% over a realistic q range', () => {
		const vp = computePorod(realisticCurve(), 100)!.porodVolume
		expect(vp / TRUE_VOLUME).toBeGreaterThan(1.05)
		expect(vp / TRUE_VOLUME).toBeLessThan(1.09)
	})

	/**
	 * The target for ROADMAP.md item 2. Vitest reports a passing `.fails` test
	 * as a failure, so once extrapolation lands this turns red and forces the
	 * marker to be promoted to a normal `it`.
	 */
	it.fails(
		'should recover the true volume within 1% once extrapolation exists',
		() => {
			const vp = computePorod(realisticCurve(), 100)!.porodVolume
			expect(Math.abs(vp - TRUE_VOLUME) / TRUE_VOLUME).toBeLessThan(0.01)
		},
	)
})
