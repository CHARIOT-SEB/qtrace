import type { GuinierResult, LinearFit, SaxsData } from '../types/saxs';

/**
 * Ordinary least-squares linear fit.
 * Returns null if there are fewer than 3 points or the x-values are degenerate.
 */
export function linearFit(xs: number[], ys: number[]): LinearFit | null {
  const n = xs.length;
  if (n < 3) return null;

  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
    sxx += xs[i] * xs[i];
    sxy += xs[i] * ys[i];
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;

  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;

  let ssRes = 0;
  let ssTot = 0;
  const ym = sy / n;
  for (let i = 0; i < n; i++) {
    const yhat = slope * xs[i] + intercept;
    ssRes += (ys[i] - yhat) ** 2;
    ssTot += (ys[i] - ym) ** 2;
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, r2 };
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
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = iMin; i <= iMax; i++) {
    if (data.I[i] > 0) {
      xs.push(data.q[i] * data.q[i]);
      ys.push(Math.log(data.I[i]));
    }
  }
  const fit = linearFit(xs, ys);
  if (!fit) return null;

  const Rg = fit.slope < 0 ? Math.sqrt(-3 * fit.slope) : NaN;
  const I0 = Math.exp(fit.intercept);
  const qRgMax = data.q[iMax] * Rg;

  return { xs, ys, fit, Rg, I0, qRgMax, iMin, iMax };
}

/**
 * Search low-q windows for a sensible default Guinier region.
 *
 * Strategy: try every (start, end) window with start in the first ~15 points
 * and length 8–60, keeping only those where q·Rg ≤ 1.3, then pick the best
 * R² (lightly penalised by distance from q·Rg = 1.0).
 */
export function autoFindGuinierRegion(
  data: SaxsData,
): { start: number; end: number } | null {
  let best: { start: number; end: number; score: number } | null = null;

  const maxStart = Math.min(15, data.q.length);
  for (let start = 0; start < maxStart; start++) {
    const maxEnd = Math.min(start + 60, data.q.length);
    for (let end = start + 8; end < maxEnd; end++) {
      const r = computeGuinier(data, start, end);
      if (!r || !Number.isFinite(r.Rg) || r.qRgMax > 1.3) continue;
      const score = r.fit.r2 - Math.abs(1.0 - r.qRgMax) * 0.05;
      if (!best || score > best.score) best = { start, end, score };
    }
  }
  return best ? { start: best.start, end: best.end } : null;
}
