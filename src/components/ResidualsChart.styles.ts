import styled from 'styled-components'
import { CHART } from '../chartTheme'

export const TooltipBox = styled.div`
  background: ${CHART.tooltipBg};
  border: 1px solid ${CHART.tooltipBorder};
  box-shadow: ${CHART.tooltipShadow};
  padding: 7px 10px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
`

interface TooltipRowProps {
  $color?: string
}

export const TooltipRow = styled.div<TooltipRowProps>`
  color: ${({ $color }) => $color ?? CHART.tickColor};
`
