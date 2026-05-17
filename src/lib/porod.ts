import type { PorodResult, SaxsData } from '../types/saxs';

/**
 * Compute the Porod invariant and estimated hydrated particle volume.
 *
 * Q_porod = ∫ q²·I(q) dq  (trapezoidal integration over full q range)
 * Vp      = 2π²·I(0) / Q_porod
 */
export function computePorod(data: SaxsData, I0: number): PorodResult | null {
  const { q, I } = data;
  const n = q.length;
  if (n < 2 || !Number.isFinite(I0) || I0 <= 0) return null;

  let Q = 0;
  for (let i = 0; i < n - 1; i++) {
    if (I[i] <= 0 || I[i + 1] <= 0) continue;
    const f0 = q[i] * q[i] * I[i];
    const f1 = q[i + 1] * q[i + 1] * I[i + 1];
    Q += 0.5 * (f0 + f1) * (q[i + 1] - q[i]);
  }

  if (Q <= 0) return null;

  return {
    porodInvariant: Q,
    porodVolume: (2 * Math.PI * Math.PI * I0) / Q,
  };
}
