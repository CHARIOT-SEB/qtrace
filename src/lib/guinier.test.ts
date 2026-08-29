import { describe, expect, it } from 'vitest'
import { autoFindGuinierRegion, computeGuinier, linearFit } from './guinier'
import {
	makeBeamlineGridCurve,
	makeGuinierCurve,
	makeSphereCurve,
	sphereRg,
	withAggregation,
} from '../test/fixtures'
import type { SaxsData } from '../types/saxs'

describe('linearFit', () => {
	it('recovers an exact line', () => {
		const xs = [0, 1, 2, 3, 4]
		const fit = linearFit(xs, xs.map((x) => 3 * x + 7))!
		expect(fit.slope).toBeCloseTo(3, 12)
		expect(fit.intercept).toBeCloseTo(7, 12)
		expect(fit.r2).toBeCloseTo(1, 12)
	})

	it('returns null below three points', () => {
		expect(linearFit([0, 1], [0, 1])).toBeNull()
	})

	it('returns null when the x-values are degenerate', () => {
		expect(linearFit([2, 2, 2], [1, 2, 3])).toBeNull()
	})

	it('reports r2 = 0 for a flat y with no variance', () => {
		expect(linearFit([0, 1, 2], [5, 5, 5])!.r2).toBe(0)
	})
})

describe('computeGuinier', () => {
	it('recovers Rg and I(0) from a noiseless Guinier curve', () => {
		const Rg = 25
		const I0 = 100
		const data = makeGuinierCurve(Rg, { I0 })
		const r = computeGuinier(data, 0, 40)!

		expect(r.Rg).toBeCloseTo(Rg, 8)
		expect(r.I0).toBeCloseTo(I0, 6)
		expect(r.fit.r2).toBeCloseTo(1, 10)
	})

	it('recovers the same Rg regardless of which sub-range is fitted', () => {
		const data = makeGuinierCurve(25)
		const a = computeGuinier(data, 0, 20)!
		const b = computeGuinier(data, 10, 45)!
		expect(a.Rg).toBeCloseTo(b.Rg, 8)
		expect(a.I0).toBeCloseTo(b.I0, 6)
	})

	it('reduces to ordinary least squares when weights are uniform', () => {
		const noisy = makeGuinierCurve(25, { noise: 0.02, seed: 11 })
		// err strictly proportional to the reported I makes every (I/err)^2
		// identical, which is exactly the condition for WLS to collapse to OLS.
		const data: SaxsData = { ...noisy, err: noisy.I.map((v) => v * 0.02) }

		const r = computeGuinier(data, 0, 30)!
		const ols = linearFit(r.xs, r.ys)!
		expect(r.fit.slope).toBeCloseTo(ols.slope, 10)
		expect(r.fit.intercept).toBeCloseTo(ols.intercept, 10)
	})

	it('down-weights a point carrying a large error bar', () => {
		const data = makeGuinierCurve(25, { I0: 100 })
		// Corrupt one point badly, but declare an error bar to match.
		const corrupted: SaxsData = {
			...data,
			I: [...data.I],
			err: [...data.err],
		}
		corrupted.I[10] *= 3
		corrupted.err[10] = corrupted.I[10] * 10

		const weighted = computeGuinier(corrupted, 0, 40)!
		const ols = linearFit(weighted.xs, weighted.ys)!
		const olsRg = Math.sqrt(-3 * ols.slope)

		expect(Math.abs(weighted.Rg - 25)).toBeLessThan(Math.abs(olsRg - 25))
		expect(weighted.Rg).toBeCloseTo(25, 1)
	})

	it('falls back to uniform weights when every error is zero', () => {
		const data = makeGuinierCurve(25)
		const zeroed: SaxsData = { ...data, err: data.err.map(() => 0) }
		const r = computeGuinier(zeroed, 0, 40)!
		expect(r.Rg).toBeCloseTo(25, 8)
	})

	it('propagates uncertainty that grows with the noise level', () => {
		const quiet = computeGuinier(
			makeGuinierCurve(25, { noise: 0.005, seed: 7 }),
			0,
			40,
		)!
		const noisy = computeGuinier(
			makeGuinierCurve(25, { noise: 0.05, seed: 7 }),
			0,
			40,
		)!
		expect(quiet.dRg).toBeGreaterThan(0)
		expect(noisy.dRg).toBeGreaterThan(quiet.dRg)
		expect(noisy.dI0).toBeGreaterThan(quiet.dI0)
	})

	it('reports NaN Rg for a physically impossible positive slope', () => {
		const rising: SaxsData = {
			q: [0.01, 0.02, 0.03, 0.04, 0.05],
			I: [10, 20, 30, 40, 50],
			err: [1, 1, 1, 1, 1],
		}
		const r = computeGuinier(rising, 0, 4)!
		expect(r.fit.slope).toBeGreaterThan(0)
		expect(r.Rg).toBeNaN()
		expect(r.dRg).toBeNaN()
	})

	it('ignores non-positive intensities and returns null when too few remain', () => {
		const data: SaxsData = {
			q: [0.01, 0.02, 0.03, 0.04],
			I: [100, -1, 0, 80],
			err: [1, 1, 1, 1],
		}
		expect(computeGuinier(data, 0, 3)).toBeNull()
	})

	it('computes qRgMax from the upper bound of the fit window', () => {
		const data = makeGuinierCurve(25)
		const r = computeGuinier(data, 0, 30)!
		expect(r.qRgMax).toBeCloseTo(data.q[30] * r.Rg, 10)
		expect(r.iMin).toBe(0)
		expect(r.iMax).toBe(30)
	})

	it('recovers a sphere Rg to within 2% inside the qRg < 1.3 limit', () => {
		// The Guinier law approximates the sphere form factor, so this is a
		// realism check rather than an exactness one.
		const R = 50
		const data = makeSphereCurve(R)
		const truth = sphereRg(R)
		const iMax = data.q.findIndex((q) => q * truth > 1.3) - 1

		const r = computeGuinier(data, 0, iMax)!
		expect(Math.abs(r.Rg - truth) / truth).toBeLessThan(0.02)
		expect(r.fit.r2).toBeGreaterThan(0.999)
	})

	it('overestimates Rg progressively as the fit pushes past the qRg limit', () => {
		// ln I of a sphere curves down faster than the Guinier parabola, so a
		// wider window steepens the slope and inflates Rg. This is the systematic
		// that the q*Rg warnings in analysisHeuristics.ts exist to flag, so it is
		// worth pinning down rather than merely tolerating.
		const R = 50
		const data = makeSphereCurve(R)
		const truth = sphereRg(R)

		const bias = [0.8, 1.0, 1.3, 1.5].map((limit) => {
			const iMax = data.q.findIndex((q) => q * truth > limit) - 1
			return (computeGuinier(data, 0, iMax)!.Rg - truth) / truth
		})

		// Always an overestimate, never an underestimate.
		expect(bias.every((b) => b > 0)).toBe(true)
		// Monotonically worse as the window widens.
		expect(bias).toEqual([...bias].sort((a, b) => a - b))
		// Roughly 1% at the conservative limit, still under 3% at qRg = 1.5.
		expect(bias[1]).toBeLessThan(0.011)
		expect(bias[3]).toBeLessThan(0.03)
	})
})

describe('autoFindGuinierRegion', () => {
	it('finds a window that respects the qRg < 1.3 validity limit', () => {
		const data = makeSphereCurve(50, { noise: 0.01, seed: 5 })
		const region = autoFindGuinierRegion(data)!
		expect(region.start).toBeLessThan(region.end)

		const r = computeGuinier(data, region.start, region.end)!
		expect(r.qRgMax).toBeLessThanOrEqual(1.3)
		expect(Math.abs(r.Rg - sphereRg(50)) / sphereRg(50)).toBeLessThan(0.03)
	})

	it('is not thrown off by the density of the q grid', () => {
		// The search used to express its window bounds in point counts, so the
		// same physical curve sampled finely gave a completely different answer
		// from the same curve sampled coarsely.
		const truth = sphereRg(50)
		const recovered = [250, 2551].map((n) => {
			const data = makeSphereCurve(50, { qMin: 0.0045, qMax: 0.34, n })
			const region = autoFindGuinierRegion(data)!
			return computeGuinier(data, region.start, region.end)!.Rg
		})

		// Absolute accuracy is bounded by the Guinier-vs-sphere bias pinned
		// above, not by the search. Agreement *between* the two grids is the
		// invariant that actually matters here.
		for (const Rg of recovered) {
			expect(Math.abs(Rg - truth) / truth).toBeLessThan(0.03)
		}
		expect(Math.abs(recovered[0] - recovered[1]) / truth).toBeLessThan(0.02)
	})

	it('uses the q*Rg range available to it on a beamline-density grid', () => {
		// A window capped at 60 points spans almost no q on a 2551-point file,
		// which used to leave the fit sitting at q*Rg well below 0.6.
		const data = makeBeamlineGridCurve(50)
		const region = autoFindGuinierRegion(data)!
		const r = computeGuinier(data, region.start, region.end)!

		expect(r.qRgMax).toBeGreaterThan(0.9)
		expect(r.qRgMax).toBeLessThanOrEqual(1.3)
		expect(r.xs.length).toBeGreaterThan(100)
		expect(Math.abs(r.Rg - sphereRg(50)) / sphereRg(50)).toBeLessThan(0.02)
	})

	it('steps past a low-q aggregation upturn instead of fitting it', () => {
		// The failure this search was rewritten for: on a fine grid the window
		// could not reach beyond the upturn, so it fitted the aggregate and
		// reported an Rg several times too large.
		const truth = sphereRg(50)
		const clean = makeBeamlineGridCurve(50)

		for (const fraction of [0.5, 1, 2]) {
			const data = withAggregation(clean, { Rg: 350, fraction })
			const region = autoFindGuinierRegion(data)!
			const r = computeGuinier(data, region.start, region.end)!

			expect(Math.abs(r.Rg - truth) / truth).toBeLessThan(0.03)
			// The stronger the upturn, the further in the fit must start.
			expect(data.q[region.start] * truth).toBeGreaterThan(0.2)
		}
	})

	it('starts further into the curve as the upturn strengthens', () => {
		const clean = makeBeamlineGridCurve(50)
		const starts = [0.25, 0.5, 1, 2].map(
			(fraction) =>
				autoFindGuinierRegion(withAggregation(clean, { Rg: 350, fraction }))!
					.start,
		)
		expect(starts).toEqual([...starts].sort((a, b) => a - b))
	})

	it('returns null when no window yields a physical Rg', () => {
		const rising: SaxsData = {
			q: Array.from({ length: 40 }, (_, i) => 0.01 + i * 0.005),
			I: Array.from({ length: 40 }, (_, i) => 10 + i),
			err: Array.from({ length: 40 }, () => 1),
		}
		expect(autoFindGuinierRegion(rising)).toBeNull()
	})
})
