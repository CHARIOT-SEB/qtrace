import styled from 'styled-components'
import { color, font, media } from '../theme'

export const StatsBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`

/** Five secondary tiles below the hero. Two up in the rail; wider layouts
 *  (where the rail has collapsed into the main column) get more per row. */
export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`

export const StatCard = styled.div<{ $span?: boolean }>`
  background: ${color.surface};
  border: 1px solid ${color.line};
  border-radius: 8px;
  padding: 10px 11px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  ${({ $span }) => ($span ? 'grid-column: 1 / -1;' : '')}
`

export const HeroCard = styled(StatCard)`
  padding: 13px 14px 12px;
  gap: 3px;
`

export const StatLabel = styled.span`
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: ${color.ink500};
`

export const HeroLabel = styled(StatLabel)`
  font-size: 10px;
`

export const StatValueRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 5px;
  min-width: 0;
`

export const StatValue = styled.span`
  font-family: ${font.mono};
  font-variant-numeric: tabular-nums;
  font-size: 19px;
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.01em;
  color: ${color.ink900};
`

export const HeroValue = styled(StatValue)`
  font-size: 34px;
  letter-spacing: -0.02em;
  color: ${color.accent};

  ${media.sm} {
    font-size: 28px;
  }
`

export const StatUnit = styled.span`
  font-family: ${font.mono};
  font-size: 10.5px;
  color: ${color.ink450};
`

export const HeroUnit = styled(StatUnit)`
  font-size: 13px;
`

export const StatSub = styled.span`
  font-family: ${font.mono};
  font-variant-numeric: tabular-nums;
  font-size: 10px;
  color: ${color.ink500};
`

export const HeroSub = styled(StatSub)`
  font-size: 11.5px;
`

type Kind = 'ok' | 'warn' | 'bad'

const TAG: Record<Kind, [string, string, string]> = {
  ok: [color.goodInk, color.goodBg, color.goodBorder],
  warn: [color.warnInk, color.warnBg, color.warnBorder],
  bad: [color.badInk, color.badBg, color.badBorder],
}

/** Status is never colour alone - the word is part of the tag. */
export const StatusTag = styled.span<{ $kind: Kind }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  white-space: nowrap;
  color: ${({ $kind }) => TAG[$kind][0]};
  background: ${({ $kind }) => TAG[$kind][1]};
  border: 1px solid ${({ $kind }) => TAG[$kind][2]};
`
