import { color, font } from './theme'

/**
 * Chart theme.
 *
 * Chart colour here does two separate jobs, and they are kept on separate
 * scales so they stop competing:
 *
 *   SELECTION - which frames, which points - rides the ordinal teal ramp
 *   (`markOut` -> `markIn`, `barOther` -> `barBuffer` -> `barSignal`).
 *
 *   QUALITY - whether the fit can be trusted - rides the status trio, and is
 *   shown as a band beneath the q axis rather than by recolouring the points.
 *   Previously green meant both "inside the fit range" and "qRg is still in
 *   the Guinier regime", so a point could not say which it meant.
 */
export const CHART = {
  /* Axes and grid - recessive by design */
  tickColor: color.ink450,
  gridColor: '#e8eef0',
  axisColor: color.lineStrong,
  titleColor: color.ink900,

  /* Scatter marks */
  markIn: color.accent, // inside the fitted range
  markOut: color.ink400, // outside it
  markOutOpacity: 0.4,
  fitLine: color.ink900, // the fitted line reads as ink, not as a series

  /* Chromatogram selection ramp */
  barOther: color.selOut,
  barOtherOpacity: 0.5,
  barBuffer: color.selBuffer,
  barSignal: color.selSignal,

  /* qRg validity band */
  qrgOk: color.good,
  qrgWarn: color.warn,
  qrgBad: color.bad,

  /* Residuals */
  residual: color.violet,

  /* Tooltip chrome */
  tooltipBg: color.surface,
  tooltipBorder: color.line,
  tooltipShadow: '0 4px 14px rgba(22, 38, 46, 0.13)',
} as const

export const AXIS_STYLE = {
  tick: { fill: CHART.tickColor, fontSize: 10.5, fontFamily: font.mono } as const,
  label: { fill: color.ink500, fontSize: 11, fontFamily: font.sans } as const,
}

/** Shared Recharts tooltip chrome, so every chart's tooltip matches. */
export const TOOLTIP_STYLE = {
  contentStyle: {
    background: CHART.tooltipBg,
    border: `1px solid ${CHART.tooltipBorder}`,
    borderRadius: 6,
    boxShadow: CHART.tooltipShadow,
    fontSize: 12,
    fontFamily: font.sans,
    padding: '8px 10px',
  },
  labelStyle: { color: color.ink900, fontWeight: 600, marginBottom: 2 },
  itemStyle: { color: color.ink500, fontFamily: font.mono },
} as const
