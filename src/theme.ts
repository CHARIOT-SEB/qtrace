/**
 * Design tokens.
 *
 * `color` is the source of truth. The legacy `palette` (c1-c5) is derived from
 * it so the components that still import it keep compiling while they are
 * migrated onto the semantic names; it will go once nothing references it.
 *
 * The ink spine keeps the app's original charcoal-blue family. What changed in
 * the redesign, and why:
 *   - a darker heading ink, because #2f4550 alone gave no headline/body split
 *   - a desaturated hairline, because the old #b8dbd9 border was too saturated
 *     to recede and read as a tinted band rather than a rule
 *   - a genuinely saturated accent, because every previous token sat below the
 *     chroma floor and the palette as a whole read grey
 *   - a validated ordinal ramp for selection and a lightness-split status trio,
 *     so the two jobs chart colour was doing at once stop colliding
 */
export const color = {
  /* Ink */
  ink900: '#16262e', // headings, the fitted line
  ink700: '#2f4550', // body text (the original c1)
  ink500: '#55707c', // secondary text, axis names, small caps labels
  ink450: '#6c8792', // muted text that still has to be read
  ink400: '#7d949e', // decorative only - excluded marks, dividers

  /* Surface */
  line: '#dde6e8',
  lineStrong: '#c3d4d8',
  surface: '#ffffff',
  canvas: '#f1f4f5',

  /* Accent - primary action, active state, current selection */
  accent: '#0f5b68',
  accentSoft: '#e4eff1',
  accentBorder: '#c4dee2',

  /* Selection ramp for the chromatogram: excluded -> buffer -> signal.
     Monotone lightness, single hue, light end clears the surface at 2.15:1. */
  selOut: '#93b7bf',
  selBuffer: '#4a8f9d',
  selSignal: '#0f5b68',

  /* Status trio. Split by lightness as well as hue so red and green stay
     ~10.5 dE apart under deuteranopia. Never used without the word beside it. */
  good: '#4fb37e',
  goodInk: '#1d6b45',
  goodBg: '#eaf6f0',
  goodBorder: '#bfe3d0',
  warn: '#d08c00',
  warnInk: '#8a5a00',
  warnBg: '#fbf3e3',
  warnBorder: '#eddcb4',
  bad: '#9e2436',
  badInk: '#8a1f2f',
  badBg: '#fbecee',
  badBorder: '#eec6cb',

  /* Residual marks */
  violet: '#6b5ca8',
} as const

export const font = {
  sans: `'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`,
  mono: `'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace`,
} as const

/** Fixed chrome widths for the workspace shell. */
export const layout = {
  topbar: 56,
  leftRail: 264,
  rightRail: 316,
} as const

/** @deprecated Use `color`. Kept while components migrate off c1-c5. */
export const palette = {
  c1: color.ink700,
  c2: color.ink500,
  c3: color.ink450,
  c4: color.line,
  c5: color.canvas,
} as const

export const breakpoints = {
  sm: '480px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const

export const media = {
  sm: `@media (max-width: ${breakpoints.sm})`,
  md: `@media (max-width: ${breakpoints.md})`,
  lg: `@media (max-width: ${breakpoints.lg})`,
  xl: `@media (max-width: ${breakpoints.xl})`,
} as const
