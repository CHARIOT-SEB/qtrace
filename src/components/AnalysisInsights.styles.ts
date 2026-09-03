import styled from 'styled-components'
import { color } from '../theme'

export const InsightsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`

export const InsightsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 9px;
`

export const InsightsBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

type Severity = 'error' | 'warning' | 'info'

const TONE: Record<Severity, [string, string, string]> = {
  error: [color.badInk, color.badBg, color.badBorder],
  warning: [color.warnInk, color.warnBg, color.warnBorder],
  info: [color.accent, color.accentSoft, color.accentBorder],
}

export const InsightsBadge = styled.span<{ $variant: 'error' | 'warning' }>`
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 10px;
  white-space: nowrap;
  color: ${({ $variant }) => TONE[$variant][0]};
  background: ${({ $variant }) => TONE[$variant][1]};
  border: 1px solid ${({ $variant }) => TONE[$variant][2]};
`

export const InsightBox = styled.div<{ $severity: Severity }>`
  border: 1px solid ${({ $severity }) => TONE[$severity][2]};
  background: ${({ $severity }) => TONE[$severity][1]};
  border-radius: 7px;
  padding: 10px 11px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
`

export const InsightHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
`

export const InsightIcon = styled.span<{ $severity: Severity }>`
  display: flex;
  flex-shrink: 0;
  margin-top: 1px;
  color: ${({ $severity }) => TONE[$severity][0]};
`

export const InsightMessage = styled.span`
  flex-grow: 1;
  min-width: 0;
  font-size: 12.5px;
  line-height: 1.45;
  color: ${color.ink900};
  text-wrap: pretty;
`

export const InsightWhyBtn = styled.button<{ $severity: Severity }>`
  appearance: none;
  align-self: flex-start;
  margin-left: 24px;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  color: ${({ $severity }) => TONE[$severity][0]};

  @media (pointer: coarse) {
    min-height: 40px;
    padding-right: 12px;
  }

  &:focus-visible {
    outline: 2px solid ${color.accent};
    outline-offset: 2px;
    border-radius: 2px;
  }
`

export const InsightExplanation = styled.p<{ $severity: Severity }>`
  margin: 0 0 0 24px;
  padding-left: 9px;
  border-left: 2px solid ${({ $severity }) => TONE[$severity][2]};
  font-size: 11.5px;
  line-height: 1.6;
  color: ${color.ink500};
  text-wrap: pretty;
`
