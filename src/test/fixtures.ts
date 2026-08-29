/**
 * Deterministic test fixtures with closed-form ground truth.
 *
 * The app's own `sampleData.ts` uses bare `Math.random()` and adds an
 * oscillatory tail that perturbs the low-q region, so it cannot back a
 * regression test. Everything here is seeded and analytically exact.
 */

import type { SaxsData } from '../types/saxs'

/** Small, fast, seedable PRNG. Same seed always gives the same sequence. */
export function mulberry32(seed: number): () => number {
	let a = seed >>> 0
	return () => {
		a = (a + 0x6d2b79f5) >>> 0
		let t = Math.imul(a ^ (a >>> 15), 1 | a)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

/** Standard normal deviates from a seeded uniform source (Box-Muller). */
export function gaussian(rand: () => number): () => number {
	let spare: number | null = null
	return () => {
		if (spare !== null) {
			const v = spare
			spare = null
			return v
		}
		let u = 0
		let v = 0
		let s = 0
		do {
			u = rand() * 2 - 1
			v = rand() * 2 - 1
			s = u * u + v * v
		} while (s === 0 || s >= 1)
		const f = Math.sqrt((-2 * Math.log(s)) / s)
		spare = v * f
		return u * f
	}
}

interface CurveOptions {
	qMin?: number
	qMax?: number
	n?: number
	I0?: number
	/** Relative Gaussian noise on I, as a fraction of I. 0 gives an exact curve. */
	noise?: number
	seed?: number
	filename?: string
}

function qGrid(qMin: number, qMax: number, n: number): number[] {
	const step = (qMax - qMin) / (n - 1)
	return Array.from({ length: n }, (_, i) => qMin + i * step)
}

/**
 * A pure Guinier curve: I(q) = I0 * exp(-q^2 Rg^2 / 3), exact at every q.
 *
 * This is the precision fixture - a correct weighted fit over any sub-range
 * must recover `Rg` and `I0` to near machine precision when noise is 0.
 */
export function makeGuinierCurve(
	Rg: number,
	opts: CurveOptions = {},
): SaxsData {
	const {
		qMin = 0.005,
		qMax = 0.3,
		n = 250,
		I0 = 100,
		noise = 0,
		seed = 1,
		filename = `guinier-Rg${Rg}.dat`,
	} = opts

	const rand = gaussian(mulberry32(seed))
	const q = qGrid(qMin, qMax, n)
	const I: number[] = []
	const err: number[] = []

	for (const qv of q) {
		const exact = I0 * Math.exp((-qv * qv * Rg * Rg) / 3)
		const sigma = noise * exact
		I.push(noise > 0 ? exact + sigma * rand() : exact)
		// A real error bar even on the noiseless curve, so weighted fits have
		// something meaningful to weight by.
		err.push(Math.max(sigma, exact * 1e-3))
	}

	return { q, I, err, filename }
}

/** Rg of a homogeneous sphere of radius R: Rg = R * sqrt(3/5). */
export function sphereRg(R: number): number {
	return R * Math.sqrt(3 / 5)
}

/** Volume of a sphere of radius R, in the same length units cubed. */
export function sphereVolume(R: number): number {
	return (4 / 3) * Math.PI * R ** 3
}

/**
 * Scattering from a homogeneous sphere of radius R:
 *   I(q) = I0 * [3 (sin x - x cos x) / x^3]^2,  x = qR
 *
 * This is the realism fixture. Unlike a pure Guinier curve it has a genuine
 * q^-4 Porod tail, so it exercises both the approximation error in a Guinier
 * fit and the truncation behaviour of the Porod invariant - and both have
 * closed forms to check against (`sphereRg`, `sphereVolume`).
 */
export function makeSphereCurve(R: number, opts: CurveOptions = {}): SaxsData {
	const {
		qMin = 0.002,
		qMax = 0.5,
		n = 500,
		I0 = 100,
		noise = 0,
		seed = 2,
		filename = `sphere-R${R}.dat`,
	} = opts

	const rand = gaussian(mulberry32(seed))
	const q = qGrid(qMin, qMax, n)
	const I: number[] = []
	const err: number[] = []

	for (const qv of q) {
		const x = qv * R
		const form = (3 * (Math.sin(x) - x * Math.cos(x))) / x ** 3
		const exact = I0 * form * form
		const sigma = noise * exact
		I.push(noise > 0 ? exact + sigma * rand() : exact)
		err.push(Math.max(sigma, exact * 1e-3))
	}

	return { q, I, err, filename }
}

/**
 * A synthetic SEC-SAXS run: a Gaussian elution peak of `base` scattering on a
 * flat buffer background, deterministic given `seed`.
 */
export function makeSecRun(
	opts: {
		frames?: number
		center?: number
		sigma?: number
		buffer?: number
		base?: SaxsData
		noise?: number
		seed?: number
	} = {},
): SaxsData[] {
	const {
		frames = 30,
		center = 14,
		sigma = 4,
		buffer = 2,
		base = makeGuinierCurve(30),
		noise = 0,
		seed = 3,
	} = opts

	const rand = gaussian(mulberry32(seed))

	return Array.from({ length: frames }, (_, f) => {
		const elution = Math.exp(-0.5 * ((f - center) / sigma) ** 2)
		const I: number[] = []
		const err: number[] = []
		for (let i = 0; i < base.q.length; i++) {
			const exact = buffer + base.I[i] * elution
			const s = noise * exact
			I.push(noise > 0 ? exact + s * rand() : exact)
			err.push(Math.max(s, exact * 1e-3))
		}
		return {
			q: base.q,
			I,
			err,
			filename: `frame_${String(f + 1).padStart(3, '0')}.dat`,
		}
	})
}
