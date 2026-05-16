// Grayscale base for the app shell; accent colors on highlighted data only.
//   Grayscale palette: #595959 · #7f7f7f · #a5a5a5 · #cccccc · #f2f2f2
//   Accent highlights: blue / green / orange / violet for key data points & fits

export const CHART = {
  // Axes / grid — stay grayscale
  tickColor:  '#7f7f7f',
  gridColor:  'rgba(165, 165, 165, 0.3)',
  titleColor: '#595959',

  // Background / inactive scatter points — grayscale
  dataGray: 'rgba(165, 165, 165, 0.5)',

  // Highlighted / focal data — accent colors
  dataBlue:       '#4C90F0',              // primary highlighted data (Kratky)
  dataGreen:      '#72CA9B',              // Guinier region — valid fit points
  dataOrange:     '#FBB360',              // fit lines
  dataOrangeWarn: 'rgba(251,179,96,0.7)', // Guinier warning zone (1.3 < qRg ≤ 1.5)
  dataRedInvalid: 'rgba(240,100,100,0.6)',// Guinier invalid zone (qRg > 1.5)
  dataViolet:     '#C5A4FF',              // residuals

  // SEC chromatogram: signal gets accent, buffer/other stay grayscale
  barSignal: 'rgba(76,  144, 240, 0.85)', // signal — blue accent
  barBuffer: 'rgba(165, 165, 165, 0.70)', // buffer — medium gray
  barOther:  'rgba(204, 204, 204, 0.65)', // inactive — lightest gray

  // Tooltip chrome — light, clean
  tooltipBg:     '#ffffff',
  tooltipBorder: '#cccccc',
} as const;

export const AXIS_STYLE = {
  tick:  { fill: CHART.tickColor,  fontSize: 11 } as const,
  label: { fill: CHART.titleColor, fontSize: 11 } as const,
};
