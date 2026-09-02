/**
 * Core SAXS data shapes used across the app.
 */

export interface SaxsData {
  /** Momentum transfer q values, in Å⁻¹ */
  q: number[];
  /** Scattered intensity I(q) */
  I: number[];
  /** Error / standard deviation on I(q) */
  err: number[];
  /** Optional source filename for display */
  filename?: string;
}

export interface LinearFit {
  slope: number;
  intercept: number;
  /** Coefficient of determination */
  r2: number;
}

export interface PorodResult {
  /** Porod invariant Q = ∫ q²·I(q) dq, background-corrected and extrapolated */
  porodInvariant: number;
  /** Estimated hydrated particle volume Vp = 2π²·I(0) / Q, in ų */
  porodVolume: number;
  /** Flat background fitted in the Porod region and removed from Q. Diagnostic
   *  only - the measured intensities are left untouched everywhere else. */
  background: number;
  /** Porod constant K from I(q) = B + K/q⁴ */
  porodConstant: number;
  /** Contribution to Q from below the first measured q, via the Guinier model */
  qLow: number;
  /** Contribution to Q from the measured range, background-subtracted */
  qMeasured: number;
  /** Contribution to Q from the q⁻⁴ tail beyond the last measured q */
  qHigh: number;
  /** First q of the background fit window, NaN when no region was usable */
  backgroundFitQMin: number;
  /** Points in the background fit window, 0 when no region was usable */
  backgroundFitPoints: number;
}

export interface GuinierResult {
  /** x-values used for fit (q²) */
  xs: number[];
  /** y-values used for fit (ln I) */
  ys: number[];
  fit: LinearFit;
  /** Radius of gyration in Å */
  Rg: number;
  /** 1-σ uncertainty on Rg from WLS covariance (NaN if unavailable) */
  dRg: number;
  /** Forward scattering intensity */
  I0: number;
  /** 1-σ uncertainty on I(0) from WLS covariance (NaN if unavailable) */
  dI0: number;
  /** q · Rg at the upper end of the fit window (validity metric) */
  qRgMax: number;
  /** Inclusive index range in the parent dataset */
  iMin: number;
  iMax: number;
}
