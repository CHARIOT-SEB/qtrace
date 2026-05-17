// Palette: charcoal-blue #2f4550 · blue-slate #586f7c · mid #8aaab5 · light-blue #b8dbd9 · ghost-white #f4f4f9
// Accent highlights: green / orange / violet / red for key data points & fits

export const CHART = {
  // Axes / grid — palette tones
  tickColor:  '#586f7c',
  gridColor:  'rgba(184, 219, 217, 0.45)',
  titleColor: '#2f4550',

  // Background / inactive scatter points — muted blue-slate
  dataGray: 'rgba(88, 111, 124, 0.35)',

  // Highlighted / focal data — accent colors
  dataBlue:       '#2f4550',              // primary highlighted data (Kratky)
  dataGreen:      '#72CA9B',              // Guinier region — valid fit points
  dataOrange:     '#FBB360',              // fit lines
  dataOrangeWarn: 'rgba(251,179,96,0.7)', // Guinier warning zone (1.3 < qRg ≤ 1.5)
  dataRedInvalid: 'rgba(240,100,100,0.6)',// Guinier invalid zone (qRg > 1.5)
  dataViolet:     '#C5A4FF',              // residuals

  // SEC chromatogram: distinct hues so buffer/signal pop against inactive frames
  barSignal: '#2f4550',                   // signal — charcoal blue (primary)
  barBuffer: '#6FA8B1',                   // buffer — medium teal accent
  barOther:  'rgba(184, 219, 217, 0.70)', // inactive — light blue

  // Tooltip chrome
  tooltipBg:     '#ffffff',
  tooltipBorder: '#b8dbd9',
} as const;

export const AXIS_STYLE = {
  tick:  { fill: CHART.tickColor,  fontSize: 11 } as const,
  label: { fill: CHART.titleColor, fontSize: 11 } as const,
};
