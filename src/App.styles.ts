import styled from 'styled-components'
import { Callout } from '@blueprintjs/core'
import { color, font, layout, media } from './theme'

export const AppRoot = styled.div.attrs({ className: 'bp6-light' })`
  min-height: 100vh;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${color.canvas};
  color: ${color.ink700};
`

/**
 * The workspace shell.
 *
 * Grid areas rather than source order, so the rails can be re-placed per
 * breakpoint without rendering anything twice:
 *
 *   >= 1280   left | main | right      the full three-column workspace
 *   1024-1280 left | right             results move above the plots
 *             left | main
 *   < 1024    right                    session rail becomes a drawer
 *             main
 */
export const AppBody = styled.div`
  flex-grow: 1;
  min-height: 0;
  display: grid;
  grid-template-columns:
    ${layout.leftRail}px
    minmax(0, 1fr)
    ${layout.rightRail}px;
  grid-template-areas: 'left main right';
  overflow: hidden;

  ${media.xl} {
    grid-template-columns: ${layout.leftRail}px minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-areas:
      'left right'
      'left main';
  }

  ${media.lg} {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-areas:
      'right'
      'main';
  }
`

/**
 * One instance, two behaviours: a grid column at wide sizes, an off-canvas
 * drawer below the large breakpoint. Rendering it once rather than twice keeps
 * the file input, the snapshot list and their state single-sourced.
 */
export const SessionRailSlot = styled.div<{ $open: boolean }>`
  grid-area: left;
  min-height: 0;
  display: flex;

  & > * {
    width: ${layout.leftRail}px;
    max-width: 100%;
  }

  ${media.lg} {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 21;
    width: min(${layout.leftRail}px, 86vw);
    transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
    transition: transform 200ms ease;
    box-shadow: ${({ $open }) =>
      $open ? '0 0 40px rgba(22, 38, 46, 0.24)' : 'none'};
    visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};

    & > * {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

export const ResultsRailSlot = styled.div`
  grid-area: right;
  min-height: 0;
  display: flex;

  & > * {
    width: ${layout.rightRail}px;
  }

  /* Below xl the rail lies down: full width, a bottom rule instead of a side
     one, and its contents run horizontally so it stays a shallow band. */
  ${media.xl} {
    & > * {
      width: 100%;
      border-left: none;
      border-bottom: 1px solid ${color.line};
      flex-direction: row;
      align-items: flex-start;
      gap: 20px;
      padding: 14px 18px;
      overflow-y: visible;
    }
    & > * {
      flex-wrap: wrap;
    }
    /* Both halves need a floor, or the insights column collapses to one
       word per line while the results block takes everything. */
    & > * > section {
      flex: 1 1 340px;
      min-width: min(320px, 100%);
    }
    & > * > section:first-child {
      flex: 1 1 380px;
      min-width: min(340px, 100%);
    }
    /* The divider and the footnote are rail furniture - they make no sense
       once the rail is a horizontal band. */
    & > * > .rail-furniture {
      display: none;
    }
  }

  ${media.md} {
    & > * {
      flex-direction: column;
      gap: 14px;
    }
    & > * > section,
    & > * > section:first-child {
      flex: 1 1 auto;
      min-width: 0;
    }
  }
`

/** The session rail as an off-canvas drawer, below the large breakpoint. */
export const DrawerBackdrop = styled.div<{ $open: boolean }>`
  display: none;

  ${media.lg} {
    display: ${({ $open }) => ($open ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    background: rgba(22, 38, 46, 0.42);
    backdrop-filter: blur(2px);
    z-index: 20;
  }
`

export const AppContent = styled.main`
  grid-area: main;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 18px 20px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  /* Panels keep their natural height and the column scrolls. Without this
     they shrink to fit the viewport and the plots collapse to a sliver. */
  & > * {
    max-width: 100%;
    min-width: 0;
    flex-shrink: 0;
  }

  ${media.lg} {
    padding: 14px 14px 24px;
  }
  ${media.sm} {
    padding: 12px 10px 20px;
    gap: 12px;
  }
`

/* ── Cards ─────────────────────────────────────────────────────────── */

export const Panel = styled.section`
  background: ${color.surface};
  border: 1px solid ${color.line};
  border-radius: 8px;
  padding: 14px;
  min-width: 0;

  ${media.sm} {
    padding: 11px;
  }
`

export const PanelHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
`

export const PanelTitle = styled.span`
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: ${color.ink900};
`

export const PanelHeadRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

export const PanelNote = styled.span`
  font-family: ${font.mono};
  font-variant-numeric: tabular-nums;
  font-size: 11px;
  color: ${color.ink500};
`

export const HeadDivider = styled.span`
  width: 1px;
  height: 14px;
  background: ${color.line};

  ${media.md} {
    display: none;
  }
`

export const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  flex-wrap: wrap;
`

export const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: ${color.ink500};
`

export const LegendSwatch = styled.span<{ $color: string; $dim?: boolean }>`
  width: 9px;
  height: 9px;
  border-radius: 2px;
  background: ${({ $color }) => $color};
  opacity: ${({ $dim }) => ($dim ? 0.5 : 1)};
`

/** Sub-heading inside a panel - used for the residuals strip under the fit. */
export const SubHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0 2px;
`

export const SubHeadRule = styled.span`
  flex-grow: 1;
  height: 1px;
  background: ${color.line};
`

export const PlotPairGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  ${media.md} {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
`

export const ErrorCallout = styled(Callout)`
  margin: 0;
`

/* ── Empty state ───────────────────────────────────────────────────── */

export const EmptyStage = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
`

export const EmptyInner = styled.div`
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 22px;
`

export const EmptyHeading = styled.h1`
  margin: 0 0 8px;
  font-size: 25px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: ${color.ink900};
  text-wrap: pretty;

  ${media.sm} {
    font-size: 21px;
  }
`

export const EmptyLead = styled.p`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.6;
  color: ${color.ink500};
  text-wrap: pretty;

  & code {
    font-family: ${font.mono};
    font-size: 12.5px;
  }
`

export const OrRule = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  & > span[aria-hidden] {
    flex-grow: 1;
    height: 1px;
    background: ${color.line};
  }
`

export const StartList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 9px;
`

export const StartCard = styled.button<{ $primary?: boolean }>`
  appearance: none;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  padding: 14px 15px;
  min-height: 64px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  border: 1px solid
    ${({ $primary }) => ($primary ? color.accentBorder : color.line)};
  background: ${({ $primary }) =>
    $primary ? color.accentSoft : color.surface};
  transition:
    border-color 120ms ease,
    background 120ms ease;

  &:hover:not(:disabled) {
    border-color: ${color.accent};
  }
  &:focus-visible {
    outline: 2px solid ${color.accent};
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const StartIcon = styled.span<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  flex-shrink: 0;
  background: ${({ $primary }) => ($primary ? color.accent : color.canvas)};
  color: ${({ $primary }) => ($primary ? '#fff' : color.ink500)};
`

export const StartBody = styled.span`
  flex-grow: 1;
  min-width: 0;
`

export const StartTitle = styled.span`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: ${color.ink900};
`

export const StartSub = styled.span`
  display: block;
  font-size: 11.5px;
  color: ${color.ink500};
  margin-top: 2px;
  text-wrap: pretty;
`

/* ── Fit range control, inline under the plot it drives ────────────── */

export const FitRangeBar = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
  padding: 10px 13px;
  background: ${color.canvas};
  border: 1px solid ${color.line};
  border-radius: 7px;
  flex-wrap: wrap;

  ${media.sm} {
    gap: 10px;
    padding: 10px;
  }
`

export const FitRangeSlider = styled.div`
  flex-grow: 1;
  min-width: 180px;

  /* The Blueprint RangeSlider needs headroom for its handle labels */
  .bp6-slider {
    margin: 22px 8px 4px;
  }
`

export const FitRangeReadout = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-family: ${font.mono};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

export const FitRangeValue = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${color.ink900};
`

export const FitRangeArrow = styled.span`
  color: ${color.ink450};
  font-size: 11px;
`

export const FitRangeUnit = styled.span`
  font-size: 10.5px;
  color: ${color.ink450};
`
