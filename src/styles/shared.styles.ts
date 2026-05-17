import styled from 'styled-components'
import { Card } from '@blueprintjs/core'
import { palette, media } from '../theme'

export const ChartCard = styled(Card)`
  margin-bottom: 0;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
`

export const ChartCardTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${palette.c2};
  margin: 0 0 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

interface ChartFrameProps {
  $tall?: boolean
  $fill?: boolean
}

/**
 * Wrap ResponsiveContainer (with height="100%") in this to get
 * a chart height that scales down on small screens without rerendering.
 */
export const ChartFrame = styled.div<ChartFrameProps>`
  width: 100%;
  height: ${({ $tall, $fill }) => ($fill ? '100%' : $tall ? '460px' : '320px')};
  min-height: ${({ $fill }) => ($fill ? '200px' : 'auto')};

  ${media.lg} {
    height: ${({ $tall, $fill }) => ($fill ? '100%' : $tall ? '380px' : '280px')};
  }
  ${media.md} {
    height: ${({ $tall, $fill }) => ($fill ? '100%' : $tall ? '320px' : '240px')};
  }
  ${media.sm} {
    height: ${({ $tall, $fill }) => ($fill ? '100%' : $tall ? '260px' : '200px')};
  }
`
