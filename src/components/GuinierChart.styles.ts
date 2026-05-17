import styled from 'styled-components'
import { CHART } from '../chartTheme'

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
`
