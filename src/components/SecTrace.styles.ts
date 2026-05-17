import styled from 'styled-components'
import { palette } from '../theme'
import { CHART } from '../chartTheme'

export const SecRanges = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid ${palette.c4};
`

export const SecRangeHeading = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${palette.c2};
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`

interface SwatchProps {
  $color: string
}

export const Swatch = styled.span<SwatchProps>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
  background: ${({ $color }) => $color};
`

export const SecSummary = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 16px;
  font-size: 12px;
  color: ${palette.c3};
`

export const ChartTitleControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

export const TooltipBox = styled.div`
  background: ${CHART.tooltipBg};
  border: 1px solid ${CHART.tooltipBorder};
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 4px;
`

interface TooltipRowProps {
  $color?: string
}

export const TooltipRow = styled.div<TooltipRowProps>`
  color: ${({ $color }) => $color ?? CHART.tickColor};
  margin-bottom: 2px;

  &:last-child {
    margin-bottom: 0;
  }
`
