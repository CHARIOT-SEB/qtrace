import styled from 'styled-components'
import { CHART } from '../chartTheme'

export const TooltipBox = styled.div`
  background: ${CHART.tooltipBg};
  border: 1px solid ${CHART.tooltipBorder};
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 4px;
  line-height: 1.6;
`

interface TooltipRowProps {
  $color?: string
}

export const TooltipRow = styled.div<TooltipRowProps>`
  color: ${({ $color }) => $color ?? CHART.tickColor};
`

interface InFitRowProps {
  $inFit: boolean
}

export const InFitRow = styled.div<InFitRowProps>`
  margin-top: 3px;
  color: ${({ $inFit }) => ($inFit ? CHART.dataGreen : CHART.dataGray)};
  font-weight: 600;
  font-size: 11px;
`
