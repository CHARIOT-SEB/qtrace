import styled from 'styled-components'
import { color, font } from '../theme'

/** Small caps section label. Set on ink-500 rather than a lighter grey - at
 *  10px with this much tracking anything lighter drops below 4.5:1. */
export const RailLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: ${color.ink500};
`

export const RailAside = styled.aside<{ $side: 'left' | 'right' }>`
  flex-shrink: 0;
  background: ${color.surface};
  border-${({ $side }) => ($side === 'left' ? 'right' : 'left')}: 1px solid ${color.line};
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 14px;
  overflow-y: auto;
  overflow-x: hidden;
`

export const RailSection = styled.section`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

export const RailSectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 9px;
`

export const RailDivider = styled.div.attrs({ className: 'rail-furniture' })`
  height: 1px;
  background: ${color.line};
  flex-shrink: 0;
`

export const RailFooter = styled.div.attrs({ className: 'rail-furniture' })`
  border-top: 1px solid ${color.line};
  padding-top: 10px;
  flex-shrink: 0;
`

export const Mono = styled.span`
  font-family: ${font.mono};
  font-variant-numeric: tabular-nums;
`

export const EmptyNote = styled.p`
  margin: 0;
  border: 1px dashed ${color.lineStrong};
  border-radius: 7px;
  padding: 14px 12px;
  text-align: center;
  font-size: 11.5px;
  line-height: 1.55;
  color: ${color.ink450};
  text-wrap: pretty;
`

/** Compact bordered button used inside rail headers. */
export const RailButton = styled.button<{ $accent?: boolean }>`
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 27px;
  padding: 0 10px;
  border-radius: 5px;
  cursor: pointer;
  font: inherit;
  font-size: 11.5px;
  font-weight: 500;
  border: 1px solid
    ${({ $accent }) => ($accent ? color.accentBorder : color.line)};
  background: ${({ $accent }) => ($accent ? color.accentSoft : color.surface)};
  color: ${({ $accent }) => ($accent ? color.accent : color.ink500)};
  transition:
    background 120ms ease,
    border-color 120ms ease,
    color 120ms ease;

  &:hover:not(:disabled) {
    border-color: ${({ $accent }) =>
      $accent ? color.accent : color.lineStrong};
    color: ${({ $accent }) => ($accent ? color.accent : color.ink700)};
  }
  &:focus-visible {
    outline: 2px solid ${color.accent};
    outline-offset: 1px;
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* A 27px control is fine under a mouse and not under a thumb. */
  @media (pointer: coarse) {
    min-height: 44px;
    padding: 0 14px;
    font-size: 12.5px;
  }
`
