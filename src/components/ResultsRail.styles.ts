import styled from 'styled-components'
import { color, font, media } from '../theme'

export const FooterNote = styled.p`
  margin: 0;
  font-family: ${font.mono};
  font-size: 10px;
  line-height: 1.6;
  color: ${color.ink450};
  text-wrap: pretty;
`

/**
 * Phone presentation of the results rail.
 *
 * The desktop principle is that the verdict never scrolls away. Reproducing
 * that literally on a 390px screen means a screenful of stat tiles before the
 * first plot, so instead the rail collapses to a sticky one-line summary -
 * Rg and the qRg grade, the two numbers you actually glance at - and expands
 * to the full readout on tap.
 */
export const SummaryBar = styled.button`
  display: none;

  ${media.md} {
    appearance: none;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 52px;
    padding: 0 12px;
    border: none;
    border-bottom: 1px solid ${color.line};
    background: ${color.surface};
    font: inherit;
    text-align: left;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid ${color.accent};
      outline-offset: -2px;
    }
  }
`

export const SummaryLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: ${color.ink500};
`

export const SummaryValue = styled.span`
  font-family: ${font.mono};
  font-variant-numeric: tabular-nums;
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${color.accent};
`

export const SummaryUnit = styled.span`
  font-family: ${font.mono};
  font-size: 11px;
  color: ${color.ink450};
`

export const SummarySpacer = styled.span`
  flex-grow: 1;
`

export const SummaryChevron = styled.span<{ $open: boolean }>`
  display: flex;
  align-items: center;
  color: ${color.ink450};
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  transition: transform 160ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

/**
 * Wraps the rail's real content. Always visible above the phone breakpoint;
 * below it, only when the summary bar is expanded.
 */
export const RailBody = styled.div<{ $open: boolean }>`
  display: contents;

  ${media.md} {
    display: ${({ $open }) => ($open ? 'flex' : 'none')};
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    background: ${color.surface};
    border-bottom: 1px solid ${color.line};
    max-height: 60dvh;
    overflow-y: auto;
  }
`
