export const palette = {
  c1: '#2f4550',
  c2: '#586f7c',
  c3: '#8aaab5',
  c4: '#b8dbd9',
  c5: '#f4f4f9',
} as const

export const breakpoints = {
  sm: '480px',
  md: '768px',
  lg: '1024px',
} as const

export const media = {
  sm: `@media (max-width: ${breakpoints.sm})`,
  md: `@media (max-width: ${breakpoints.md})`,
  lg: `@media (max-width: ${breakpoints.lg})`,
} as const
