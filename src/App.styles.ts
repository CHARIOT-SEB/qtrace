import styled from 'styled-components'
import { Callout, Card, Divider } from '@blueprintjs/core'
import { palette, media } from './theme'

export const AppRoot = styled.div.attrs({ className: 'bp6-light' })`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${palette.c5};
`

export const AppBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  min-height: 0;
  overflow: hidden;
  position: relative;
`

export const AppContent = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 20px 28px 40px;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  /* Hard-clamp any child that tries to overflow horizontally (e.g. wide chart
     legends or unbroken text). Prevents the whole page from shifting right. */
  & > * {
    max-width: 100%;
    min-width: 0;
  }

  ${media.lg} {
    padding: 16px 20px 32px;
  }
  ${media.md} {
    padding: 14px 14px 28px;
  }
  ${media.sm} {
    padding: 12px 10px 24px;
  }
`

export const TopRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin-bottom: 20px;

  ${media.md} {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }
`

export const DropZoneWrap = styled.div`
  flex: 1 1 0;
  min-width: 0;
  padding: 20px 150px 20px 150px;

  ${media.lg} {
    padding: 20px 60px;
  }
  ${media.md} {
    padding: 12px 0;
  }
  ${media.sm} {
    padding: 8px 0;
  }
`

export const ToolbarCard = styled(Card)`
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid rgba(47, 69, 80, 0.08);

  ${media.md} {
    padding: 14px 16px;
    gap: 10px;
  }
`

export const ToolbarHeader = styled.div`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${palette.c2};
  display: flex;
  align-items: center;
  gap: 10px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(
      to right,
      rgba(88, 111, 124, 0.18),
      transparent 75%
    );
  }
`

export const PrimaryAction = styled.button`
  appearance: none;
  border: none;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.005em;
  color: #fff;
  background: ${palette.c1};
  padding: 9px 14px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 1px 2px rgba(47, 69, 80, 0.14);
  transition:
    background 120ms ease,
    box-shadow 120ms ease,
    transform 80ms ease;

  & .bp6-icon {
    color: ${palette.c4};
    flex-shrink: 0;
  }

  & > .pa-label {
    flex: 1;
  }

  & > .pa-chevron {
    opacity: 0.55;
    transition: transform 160ms ease, opacity 160ms ease;
  }

  &:hover:not(:disabled) {
    background: #3a5562;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      0 2px 8px rgba(47, 69, 80, 0.18);
  }
  &:hover:not(:disabled) > .pa-chevron {
    transform: translateX(2px);
    opacity: 0.85;
  }
  &:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 1px 1px rgba(47, 69, 80, 0.10);
  }
  &:focus-visible {
    outline: 2px solid ${palette.c3};
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

export const SecondaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
`

type ToolbarIntent = 'export' | 'snapshot' | 'destructive'

const TOOLBAR_INTENT_ACCENT: Record<ToolbarIntent, string> = {
  export: '#1f8a52',
  snapshot: '#7c5cd6',
  destructive: '#c0392b',
}

export const SecondaryAction = styled.button<{ $intent: ToolbarIntent }>`
  appearance: none;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.005em;
  color: ${palette.c2};
  background: rgba(244, 244, 249, 0.55);
  border: 1px solid rgba(47, 69, 80, 0.10);
  padding: 7px 10px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  transition:
    color 120ms ease,
    background 120ms ease,
    border-color 120ms ease;

  & .bp6-icon {
    color: ${palette.c3};
    transition: color 120ms ease;
    flex-shrink: 0;
  }
  & > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover:not(:disabled) {
    color: ${({ $intent }) => TOOLBAR_INTENT_ACCENT[$intent]};
    border-color: ${({ $intent }) => TOOLBAR_INTENT_ACCENT[$intent]}40;
    background: ${({ $intent }) => TOOLBAR_INTENT_ACCENT[$intent]}10;
  }
  &:hover:not(:disabled) .bp6-icon {
    color: ${({ $intent }) => TOOLBAR_INTENT_ACCENT[$intent]};
  }
  &:active:not(:disabled) {
    background: ${({ $intent }) => TOOLBAR_INTENT_ACCENT[$intent]}1c;
  }
  &:focus-visible {
    outline: 2px solid ${({ $intent }) => TOOLBAR_INTENT_ACCENT[$intent]};
    outline-offset: 1px;
  }
  &:disabled {
    opacity: 0.42;
    cursor: not-allowed;
  }

  ${media.sm} {
    flex-direction: column;
    gap: 4px;
    padding: 10px 6px;
    min-height: 54px;
    & > span {
      font-size: 11px;
      line-height: 1.1;
    }
  }
`

export const AnalysisGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  ${media.lg} {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  min-width: 0;
`

export const ResidualsWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 200px;
`

export const EmptyStateWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const EmptyStateLogo = styled.img`
  width: 96px;
  height: 96px;
  object-fit: contain;
  opacity: 0.85;
`

export const ErrorCallout = styled(Callout)`
  margin-bottom: 16px;
`

export const SecDivider = styled(Divider)`
  margin: 20px 0;

  ${media.md} {
    margin: 14px 0;
  }
`

export const NoFitCard = styled(Card)`
  flex: 1;
`
