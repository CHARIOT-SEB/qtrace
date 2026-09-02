import { linearFit } from './guinier'
import type { GuinierResult, PorodResult, SaxsData } from '../types/saxs'

/**
 * Where the Porod region is taken to begin, as a fraction of the measured q
 * range. The upper half gives the background fit the most lever arm in q^4
 * while staying clear of the structural features at lower q.
 */
const POROD_REGION_START = 0.5

/** Too few points and the background fit is not worth trusting. */
const MIN_POROD_FIT_POINTS = 20

/** Trapezoid steps for the low-q Guinier extrapolation. */
const LOW_Q_STEPS = 200

/**
 * Fit the Porod law with a flat background over the high-q end.
 *
 * In the Porod region I(q) = B + K/q^4, so q^4*I(q) = B*q^4 + K is a straight
 * line: the slope is the background and the intercept the Porod constant.
 *
 * Note that r^2 is not a usable quality measure here - form-factor
 * oscillations dominate it even when B is recovered to four significant
 * figures - so the gate is the point count, not the fit quality.
 */
function fitPorodRegion(
	data: SaxsData,
): { background: number; porodConstant: number; fromIndex: number } | null {
	const n = data.q.length
	const from = Math.floor(n * POROD_REGION_START)
	if (n - from < MIN_POROD_FIT_POINTS) return null

	const xs: number[] = []
	const ys: number[] = []
	for (let i = from; i < n; i++) {
		const q4 = data.q[i] ** 4
		xs.push(q4)
		ys.push(q4 * data.I[i])
	}

	const fit = linearFit(xs, ys)
	if (!fit) return null
	return { background: fit.slope, porodConstant: fit.intercept, fromIndex: from }
}

/**
 * Integrate q^2 * I_guinier(q) from 0 up to the first measured point, using the
 * Guinier model as the extrapolation. Small - the q^2 weight suppresses it -
 * but it is the part of the invariant no measurement can supply.
 */
function lowQContribution(qMin: number, I0: number, Rg: number): number {
	if (!(qMin > 0) || !Number.isFinite(Rg)) return 0
	const f = (q: number) => q * q * I0 * Math.exp((-q * q * Rg * Rg) / 3)

	let sum = 0
	for (let i = 0; i < LOW_Q_STEPS; i++) {
		const a = (qMin * i) / LOW_Q_STEPS
		const b = (qMin * (i + 1)) / LOW_Q_STEPS
		sum += 0.5 * (f(a) + f(b)) * (b - a)
	}
	return sum
}

/**
 * Compute the Porod invariant and the hydrated particle volume it implies.
 *
 *   Q  = integral of q^2 * I(q) dq, from 0 to infinity
 *   Vp = 2*pi^2*I(0) / Q
 *
 * The Vp relation is exact only for Q integrated over all q, so the measured
 * range is corrected three ways: a flat background is fitted in the Porod
 * region and removed, the q^-4 tail beyond qMax is added in closed form as
 * K/qMax, and the Guinier model supplies the piece below qMin.
 *
 * The background is used only inside this calculation and reported as a
 * diagnostic. The scattering curve, the Guinier fit and every export keep the
 * intensities as measured.
 */
export function computePorod(
	data: SaxsData,
	guinier: GuinierResult,
): PorodResult | null {
	const { q, I } = data
	const n = q.length
	const { I0, Rg } = guinier
	if (n < 2 || !Number.isFinite(I0) || I0 <= 0) return null

	const porod = fitPorodRegion(data)
	// Without a usable Porod region there is no background and no tail: fall
	// back to the raw measured integral rather than refusing to answer.
	const background = porod ? porod.background : 0
	const porodConstant = porod ? porod.porodConstant : 0

	let qMeasured = 0
	for (let i = 0; i < n - 1; i++) {
		const a = I[i] - background
		const b = I[i + 1] - background
		if (a <= 0 || b <= 0) continue
		qMeasured += 0.5 * (q[i] * q[i] * a + q[i + 1] * q[i + 1] * b) * (q[i + 1] - q[i])
	}

	const qLow = lowQContribution(q[0], I0, Rg)
	const qHigh = porodConstant > 0 ? porodConstant / q[n - 1] : 0

	const porodInvariant = qLow + qMeasured + qHigh
	if (porodInvariant <= 0) return null

	return {
		porodInvariant,
		porodVolume: (2 * Math.PI * Math.PI * I0) / porodInvariant,
		background,
		porodConstant,
		qLow,
		qMeasured,
		qHigh,
		backgroundFitQMin: porod ? q[porod.fromIndex] : NaN,
		backgroundFitPoints: porod ? n - porod.fromIndex : 0,
	}
}
