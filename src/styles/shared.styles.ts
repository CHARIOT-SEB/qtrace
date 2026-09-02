import styled from 'styled-components'
import { color, media } from '../theme'

/**
 * Chart chrome.
 *
 * The charts no longer carry their own card - panels in App.styles.ts provide
 * the surface and the heading, so several plots can share one card where they
 * share an axis (the Guinier fit and its residuals) without nesting borders.
 */
export const ChartCard = styled.div`
  background: ${color.surface};
  border: 1px solid ${color.line};
  border-radius: 8px;
  padding: 14px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
`

export const ChartCardTitle = styled.div`
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: ${color.ink900};
  margin: 0 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

interface ChartFrameProps {
  $tall?: boolean
  $short?: boolean
  $fill?: boolean
}

/**
 * Wrap ResponsiveContainer (with height="100%") in this to get
 * a chart height that scales down on small screens without rerendering.
 */
export const ChartFrame = styled.div<ChartFrameProps>`
  width: 100%;
  height: ${({ $tall, $short, $fill }) =>
    $fill ? '100%' : $short ? '132px' : $tall ? '400px' : '260px'};
  min-height: ${({ $fill }) => ($fill ? '160px' : 'auto')};

  ${media.lg} {
    height: ${({ $tall, $short, $fill }) =>
      $fill ? '100%' : $short ? '124px' : $tall ? '340px' : '230px'};
  }
  ${media.md} {
    height: ${({ $tall, $short, $fill }) =>
      $fill ? '100%' : $short ? '116px' : $tall ? '300px' : '210px'};
  }
  ${media.sm} {
    height: ${({ $tall, $short, $fill }) =>
      $fill ? '100%' : $short ? '104px' : $tall ? '250px' : '186px'};
  }
`
