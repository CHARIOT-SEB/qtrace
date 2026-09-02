import type { GuinierResult, MolecularWeightResult, SaxsData } from '../types/saxs'

/**
 * Molecular mass from the volume of correlation.
 *
 * Rambo, R. P. & Tainer, J. A. "Accurate assessment of mass, models and
 * resolution by small-angle scattering." Nature 496, 477-481 (2013).
 *
 *   Vc = I(0) / integral of q*I(q) dq        [A^2]
 *   QR = Vc^2 / Rg                           [A^3]
 *   MW = (QR / c)^k
 *
 * c and k are empirical and specific to the class of macromolecule. These are
 * the protein values; QTrace does not offer the RNA parameterisation, because
 * the only user it is built for works on proteins. Do not apply these numbers
 * to nucleic acids.
 *
 * Note the paper writes the power law as mass = (QR/c)^(1/k), so its k is the
 * reciprocal of the one used here. For proteins k = 1 and the two coincide.
 */
const PROTEIN_C = 0.1231
const PROTEIN_K = 1

/**
 * Fraction of the q*I integral contributed by the top decile of the q range.
 *
 * Vc converges faster than the Porod invariant - the integrand falls as q^-3
 * rather than q^-2 - but it still needs data to reasonably high q. A large
 * value here means the integral has not settled and the mass is unreliable.
 */
function tailFractionOf(contributions: number[], total: number): number {
	if (total <= 0) return NaN
	const from = Math.floor(contributions.length * 0.9)
	let tail = 0
	for (let i = from; i < contributions.length; i++) tail += contributions[i]
	return tail / total
}

/**
 * Compute the volume of correlation and the protein molecular mass it implies.
 *
 * The integral runs over the measured range only. No background is removed and
 * no extrapolation is added, which is what the published method and the common
 * implementations do - the aim is a number directly comparable with ATSAS and
 * RAW rather than one that is marginally more self-consistent. The Porod
 * background is reported separately for anyone who wants to judge that.
 */
export function computeMolecularWeight(
	data: SaxsData,
	guinier: GuinierResult,
): MolecularWeightResult | null {
	const { q, I } = data
	const n = q.length
	const { I0, Rg } = guinier

	if (n < 2) return null
	if (!Number.isFinite(I0) || I0 <= 0) return null
	if (!Number.isFinite(Rg) || Rg <= 0) return null

	// Trapezoidal integral of q*I(q), keeping each segment so the tail
	// contribution can be reported.
	const contributions: number[] = []
	let integral = 0
	for (let i = 0; i < n - 1; i++) {
		if (I[i] <= 0 || I[i + 1] <= 0) {
			contributions.push(0)
			continue
		}
		const segment =
			0.5 * (q[i] * I[i] + q[i + 1] * I[i + 1]) * (q[i + 1] - q[i])
		contributions.push(segment)
		integral += segment
	}

	if (!(integral > 0)) return null

	const volumeOfCorrelation = I0 / integral
	const qR = (volumeOfCorrelation * volumeOfCorrelation) / Rg

	return {
		volumeOfCorrelation,
		qR,
		molecularWeight: (qR / PROTEIN_C) ** PROTEIN_K,
		qIIntegral: integral,
		tailFraction: tailFractionOf(contributions, integral),
	}
}
