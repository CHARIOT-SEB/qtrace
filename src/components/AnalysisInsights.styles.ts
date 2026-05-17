import styled from 'styled-components'
import { Button, Callout, Card } from '@blueprintjs/core'
import { palette, media } from '../theme'

export const InsightsCard = styled(Card)`
  margin-top: 16px;
`

export const InsightsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
`

export const InsightsTitle = styled.span`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${palette.c2};
  margin: 0;
`

interface BadgeProps {
  $variant: 'error' | 'warning'
}

export const InsightsBadge = styled.span<BadgeProps>`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 10px;
  background: ${({ $variant }) =>
    $variant === 'error'
      ? 'rgba(205, 66, 70, 0.12)'
      : 'rgba(200, 118, 25, 0.1)'};
  color: ${({ $variant }) =>
    $variant === 'error' ? '#9d2c2f' : '#8a5100'};
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'error'
        ? 'rgba(205, 66, 70, 0.25)'
        : 'rgba(200, 118, 25, 0.25)'};
`

export const InsightCallout = styled(Callout)`
  margin-bottom: 8px !important;

  &:last-child {
    margin-bottom: 0 !important;
  }
`

export const InsightHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;

  ${media.sm} {
    gap: 6px;
  }
`

export const InsightMessage = styled.span`
  flex: 1;
  font-size: 13px;
  line-height: 1.45;
`

export const InsightWhyBtn = styled(Button)`
  flex-shrink: 0;
  font-size: 11px !important;
  margin-top: -1px;
  color: ${palette.c2} !important;
`

export const InsightExplanation = styled.p`
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: ${palette.c2};
`
