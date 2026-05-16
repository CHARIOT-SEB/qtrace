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

export interface GuinierResult {
  /** x-values used for fit (q²) */
  xs: number[];
  /** y-values used for fit (ln I) */
  ys: number[];
  fit: LinearFit;
  /** Radius of gyration in Å */
  Rg: number;
  /** Forward scattering intensity */
  I0: number;
  /** q · Rg at the upper end of the fit window (validity metric) */
  qRgMax: number;
  /** Inclusive index range in the parent dataset */
  iMin: number;
  iMax: number;
}
