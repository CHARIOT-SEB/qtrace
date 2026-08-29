import type { GuinierResult, LinearFit, SaxsData } from '../types/saxs'

/**
 * Ordinary least-squares linear fit.
 * Returns null if there are fewer than 3 points or the x-values are degenerate.
 */
export function linearFit(xs: number[], ys: number[]): LinearFit | null {
	const n = xs.length
	if (n < 3) return null

	let sx = 0,
		sy = 0,
		sxx = 0,
		sxy = 0
	for (let i = 0; i < n; i++) {
		sx += xs[i]
		sy += ys[i]
		sxx += xs[i] * xs[i]
		sxy += xs[i] * ys[i]
	}
	const denom = n * sxx - sx * sx
	if (denom === 0) return null

	const slope = (n * sxy - sx * sy) / denom
	const intercept = (sy - slope * sx) / n

	let ssRes = 0,
		ssTot = 0
	const ym = sy / n
	for (let i = 0; i < n; i++) {
		ssRes += (ys[i] - (slope * xs[i] + intercept)) ** 2
		ssTot += (ys[i] - ym) ** 2
	}
	return { slope, intercept, r2: ssTot > 0 ? 1 - ssRes / ssTot : 0 }
}

/**
 * Weighted least-squares linear fit.
 * Weights ws[i] = (I[i] / err[i])², the inverse-variance weights on ln I.
 * Returns slope/intercept/r² plus the diagonal variances of the covariance
 * matrix, which propagate to δRg and δI(0).
 * Falls back to OLS (uniform weights) when all errors are zero or invalid.
 */
function weightedLinearFit(
	xs: number[],
	ys: number[],
	ws: number[],
): (LinearFit & { varSlope: number; varIntercept: number }) | null {
	const n = xs.length
	if (n < 3) return null

	const allUniform = ws.every((w) => !Number.isFinite(w) || w === 0)
	const effectiveWs = allUniform
		? new Array(n).fill(1)
		: ws.map((w) => (Number.isFinite(w) && w > 0 ? w : 0))

	let S = 0,
		Sx = 0,
		Sy = 0,
		Sxx = 0,
		Sxy = 0
	for (let i = 0; i < n; i++) {
		S += effectiveWs[i]
		Sx += effectiveWs[i] * xs[i]
		Sy += effectiveWs[i] * ys[i]
		Sxx += effectiveWs[i] * xs[i] * xs[i]
		Sxy += effectiveWs[i] * xs[i] * ys[i]
	}
	const denom = S * Sxx - Sx * Sx
	if (denom === 0) return null

	const slope = (S * Sxy - Sx * Sy) / denom
	const intercept = (Sy - slope * Sx) / S

	let ssRes = 0,
		ssTot = 0
	const ym = Sy / S
	for (let i = 0; i < n; i++) {
		ssRes += effectiveWs[i] * (ys[i] - (slope * xs[i] + intercept)) ** 2
		ssTot += effectiveWs[i] * (ys[i] - ym) ** 2
	}

	return {
		slope,
		intercept,
		r2: ssTot > 0 ? 1 - ssRes / ssTot : 0,
		varSlope: S / denom,
		varIntercept: Sxx / denom,
	}
}

/**
 * Compute a Guinier fit over the inclusive index range [iMin, iMax].
 *
 * Maths:
 *   ln I(q) = ln I(0) − (Rg² / 3) · q²
 *   → fit ln I vs q² as a straight line
 *   → Rg = √(−3 · slope), I(0) = exp(intercept)
 *
 * Validity: the analysis assumes q · Rg ≲ 1.3 for globular particles.
 */
export function computeGuinier(
	data: SaxsData,
	iMin: number,
	iMax: number,
): GuinierResult | null {
	const xs: number[] = []
	const ys: number[] = []
	const ws: number[] = []
	for (let i = iMin; i <= iMax; i++) {
		if (data.I[i] > 0) {
			xs.push(data.q[i] * data.q[i])
			ys.push(Math.log(data.I[i]))
			// weight = (I / σ_I)² - inverse-variance on ln I (σ_{ln I} = σ_I / I)
			const w = data.err[i] > 0 ? (data.I[i] / data.err[i]) ** 2 : 0
			ws.push(w)
		}
	}
	const wfit = weightedLinearFit(xs, ys, ws)
	if (!wfit) return null

	const { varSlope, varIntercept, ...fit } = wfit
	const Rg = fit.slope < 0 ? Math.sqrt(-3 * fit.slope) : NaN
	const I0 = Math.exp(fit.intercept)
	const dRg =
		Number.isFinite(Rg) && Rg > 0 ? (3 / (2 * Rg)) * Math.sqrt(varSlope) : NaN
	const dI0 = I0 * Math.sqrt(varIntercept)
	const qRgMax = data.q[iMax] * Rg

	return { xs, ys, fit, Rg, dRg, I0, dI0, qRgMax, iMin, iMax }
}

/** The Guinier approximation is taken to hold while q*Rg stays under this. */
const QRG_LIMIT = 1.3

/** Below this many points a Guinier fit is not worth trusting. */
const MIN_FIT_POINTS = 10

/**
 * Cap on coarse start candidates. Without it the sweep would scale with grid
 * density, which is the whole problem this search used to have.
 */
const MAX_START_CANDIDATES = 80

/** A candidate fit window and how well it scored. */
interface Candidate {
	start: number
	end: number
	score: number
}

/**
 * Mean residual over the low-q third of a fit.
 *
 * Aggregation lifts the lowest-q points above the fitted line, so a positive
 * value here is the signature of a window that has strayed into an upturn.
 */
function lowQResidualBias(r: GuinierResult): number {
	const n = r.xs.length
	if (n < 6) return 0
	const third = Math.max(2, Math.floor(n / 3))
	let sum = 0
	for (let i = 0; i < third; i++) {
		sum += r.ys[i] - (r.fit.slope * r.xs[i] + r.fit.intercept)
	}
	return sum / third
}

/**
 * Rank a candidate window.
 *
 * R2 alone prefers a short window on any locally straight stretch - and an
 * aggregation upturn is straighter than the real Guinier region, so R2 alone
 * walks straight into it. Reward coverage towards q*Rg = 1, and penalise the
 * low-q upturn signature.
 */
function scoreRegion(r: GuinierResult): number {
	const bias = lowQResidualBias(r)
	return r.fit.r2 - Math.abs(1.0 - r.qRgMax) * 0.05 - (bias > 0 ? bias * 2 : 0)
}

/**
 * Search for a sensible default Guinier region.
 *
 * The window bounds are expressed in q*Rg and in candidate *positions*, never
 * in fixed point counts. An earlier version searched starts within the first 15
 * points and windows of 8-60 points, which silently assumed a few-hundred-point
 * curve. On a 2551-point Diamond B21 file those windows span barely any q at
 * all - they sit inside the low-q upturn, where every candidate is rejected for
 * q*Rg or returns a wildly inflated Rg. Auto-find either did nothing or was
 * confidently wrong, depending on how strong the upturn was.
 *
 * Returns null when no window satisfies the validity limit.
 */
export function autoFindGuinierRegion(
	data: SaxsData,
): { start: number; end: number } | null {
	const n = data.q.length
	if (n < MIN_FIT_POINTS) return null

	/**
	 * Best window starting at `start`, growing until q*Rg leaves the valid
	 * range. Returns null when no window from here is valid.
	 */
	const sweepFrom = (start: number): Candidate | null => {
		let local: Candidate | null = null

		for (let end = start + MIN_FIT_POINTS - 1; end < n; end++) {
			const r = computeGuinier(data, start, end)
			if (!r) continue
			const width = end - start + 1

			if (!Number.isFinite(r.Rg)) {
				// A positive slope across a narrow window is usually just noise;
				// across a wide one it means there is no Guinier region from here.
				if (width >= 4 * MIN_FIT_POINTS) break
				continue
			}

			if (r.qRgMax > QRG_LIMIT) {
				// Widening only pushes q*Rg further out, so this start is spent -
				// but a narrow window may only have a noisy slope, so let it settle
				// before giving up on the start entirely.
				if (width >= 2 * MIN_FIT_POINTS) break
				continue
			}

			const score = scoreRegion(r)
			if (!local || score > local.score) local = { start, end, score }
		}

		return local
	}

	let best: Candidate | null = null
	const keep = (c: Candidate | null) => {
		if (c && (!best || c.score > best.score)) best = c
	}

	// Start candidates span the low half of the curve. Bounding this in q would
	// need an Rg we do not have yet, and a start beyond the Guinier region is
	// rejected by the q*Rg test anyway, so a generous range is safe: a bad start
	// costs a handful of fits over a short window.
	const maxStart = Math.floor(n / 2)
	const stride = Math.max(1, Math.ceil(maxStart / MAX_START_CANDIDATES))
	for (let start = 0; start <= maxStart; start += stride) keep(sweepFrom(start))

	if (best === null) return null

	// Refine the start at full resolution around the coarse winner.
	if (stride > 1) {
		const coarse: Candidate = best
		const lo = Math.max(0, coarse.start - stride)
		const hi = Math.min(maxStart, coarse.start + stride)
		for (let start = lo; start <= hi; start++) keep(sweepFrom(start))
	}

	const winner: Candidate = best
	return { start: winner.start, end: winner.end }
}
