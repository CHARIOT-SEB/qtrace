import styled from 'styled-components'
import { color, font, layout, media } from '../theme'

export const Bar = styled.header`
  display: flex;
  align-items: center;
  gap: 16px;
  height: ${layout.topbar}px;
  padding: 0 18px;
  position: sticky;
  top: 0;
  z-index: 14;
  background: ${color.surface};
  border-bottom: 1px solid ${color.line};
  flex-shrink: 0;

  ${media.md} {
    gap: 10px;
    padding: 0 12px;
  }
`

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  flex-shrink: 0;
`

export const BrandLogo = styled.img`
  height: 26px;
  width: 26px;
  border-radius: 7px;
  object-fit: contain;
  display: block;
`

export const BrandName = styled.span`
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${color.ink900};

  ${media.sm} {
    display: none;
  }
`

export const BarDivider = styled.span`
  width: 1px;
  height: 22px;
  background: ${color.line};
  flex-shrink: 0;

  ${media.md} {
    display: none;
  }
`

export const DatasetChip = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 32px;
  min-width: 0;
  padding: 0 11px;
  background: ${color.canvas};
  border: 1px solid ${color.line};
  border-radius: 6px;

  ${media.md} {
    gap: 7px;
    padding: 0 8px;
  }
`

export const DatasetName = styled.span`
  font-family: ${font.mono};
  font-size: 12.5px;
  font-weight: 500;
  color: ${color.ink900};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;

  ${media.md} {
    max-width: 110px;
  }
`

export const DatasetMeta = styled.span`
  font-size: 11px;
  color: ${color.ink450};
  white-space: nowrap;

  ${media.lg} {
    display: none;
  }
`

export const EmptyDataset = styled.span`
  font-size: 12.5px;
  color: ${color.ink450};

  ${media.sm} {
    display: none;
  }
`

export const Spacer = styled.div`
  flex-grow: 1;
`

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  ${media.sm} {
    gap: 5px;
  }
`

/** The button's text label. Named so the phone rule can hide the label
 *  without also hiding Blueprint's icon, which is a <span> too. */
export const BtnLabel = styled.span`
  white-space: nowrap;
`

type Variant = 'primary' | 'secondary'

export const BarButton = styled.button<{ $variant: Variant }>`
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 ${({ $variant }) => ($variant === 'primary' ? 13 : 12)}px;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
  transition:
    background 120ms ease,
    border-color 120ms ease;

  ${({ $variant }) =>
    $variant === 'primary'
      ? `
    border: none;
    background: ${color.accent};
    color: #fff;
    box-shadow: 0 1px 2px rgba(22, 38, 46, 0.16);
    &:hover:not(:disabled) { background: #0c4b56; }
  `
      : `
    border: 1px solid ${color.line};
    background: ${color.surface};
    color: ${color.ink700};
    &:hover:not(:disabled) { background: ${color.canvas}; border-color: ${color.lineStrong}; }
  `}

  &:focus-visible {
    outline: 2px solid ${color.accent};
    outline-offset: 1px;
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  ${media.md} {
    /* Icon-only below the medium breakpoint - the label is the first thing to go */
    padding: 0 9px;
    ${BtnLabel} {
      display: none;
    }
  }

  @media (pointer: coarse) {
    min-height: 44px;
    min-width: 44px;
    justify-content: center;
  }
`

/** Only rendered below the large breakpoint, where the rails collapse. */
export const RailToggle = styled(BarButton)`
  display: none;

  ${media.lg} {
    display: inline-flex;
  }
`
