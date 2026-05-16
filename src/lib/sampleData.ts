import type { SaxsData } from '../types/saxs';

export function generateSampleSecFrames(): SaxsData[] {
  const N = 30;
  const Rg = 14.3;
  const I0 = 100;
  const center = 14;
  const sigma = 4.5;
  const frames: SaxsData[] = [];

  for (let f = 0; f < N; f++) {
    const elution = Math.exp(-0.5 * ((f - center) / sigma) ** 2);
    const q: number[] = [];
    const I: number[] = [];
    const err: number[] = [];

    for (let i = 0; i < 250; i++) {
      const qv = 0.005 + i * 0.0025;

      // Buffer: smooth decaying background (water + capillary scattering)
      const bufI = 2.5 * Math.exp(-qv * 1.5) + 0.15;

      // Protein scattering weighted by elution profile
      const guin = I0 * Math.exp(-(qv * qv * Rg * Rg) / 3);
      const tail =
        (I0 * 0.08 * Math.exp(-qv * qv * Rg * Rg * 0.15) * Math.cos(qv * Rg * 1.8)) /
        (1 + qv * Rg);
      const protI = Math.max(guin + tail, 0) * elution;

      const base = bufI + protI;
      const noise = (Math.random() - 0.5) * 0.04 * base;

      q.push(qv);
      I.push(Math.max(base + noise, 1e-6));
      err.push(0.02 * base + 0.01);
    }

    const num = String(f + 1).padStart(3, '0');
    frames.push({ q, I, err, filename: `frame_${num}.dat` });
  }

  return frames;
}

/**
 * Generate a synthetic globular-protein-like SAXS curve.
 *
 * Combines a Guinier core (Rg ≈ 14.3 Å — lysozyme-ish) with a decaying
 * oscillatory tail to give realistic-looking shape and noise.
 */
export function generateSampleData(): SaxsData {
  const q: number[] = [];
  const I: number[] = [];
  const err: number[] = [];

  const Rg = 14.3;
  const I0 = 100;

  for (let i = 0; i < 250; i++) {
    const qv = 0.005 + i * 0.0025;
    const guin = I0 * Math.exp(-(qv * qv * Rg * Rg) / 3);
    const tail =
      (I0 * 0.08 * Math.exp(-qv * qv * Rg * Rg * 0.15) * Math.cos(qv * Rg * 1.8)) /
      (1 + qv * Rg);
    const base = Math.max(guin + tail, 0.02);
    const noise = (Math.random() - 0.5) * 0.04 * base;
    q.push(qv);
    I.push(base + noise);
    err.push(0.02 * base + 0.01);
  }
  return { q, I, err, filename: 'sample (synthetic)' };
}
