import styled from 'styled-components'
import { ChartCard } from '../styles/shared.styles'
import { CHART } from '../chartTheme'
import { media } from '../theme'

export const ResidualsCard = styled(ChartCard)`
  flex: 1;
  display: flex;
  flex-direction: column;
`

export const ChartInner = styled.div`
  flex: 1;
  min-height: 0;

  ${media.lg} {
    min-height: 220px;
  }
  ${media.sm} {
    min-height: 180px;
  }
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
`
