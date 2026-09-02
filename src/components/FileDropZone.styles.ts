import styled from 'styled-components'
import { color, media } from '../theme'

interface DropCardProps {
  $isDragging: boolean
}

export const DropCard = styled.div<DropCardProps>`
  cursor: pointer;
  border: 2px dashed
    ${({ $isDragging }) => ($isDragging ? color.accent : color.lineStrong)};
  background: ${({ $isDragging }) =>
    $isDragging ? color.accentSoft : color.surface};
  border-radius: 12px;
  padding: 34px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 13px;
  text-align: center;
  transition:
    border-color 140ms ease,
    background 140ms ease;

  &:hover {
    border-color: ${color.accent};
  }
  &:focus-visible {
    outline: 2px solid ${color.accent};
    outline-offset: 2px;
  }

  ${media.sm} {
    padding: 26px 16px;
    gap: 11px;
  }
`

export const DropIconTile = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 13px;
  background: ${color.accentSoft};
  color: ${color.accent};
  flex-shrink: 0;
`

export const DropPrimary = styled.p`
  margin: 0;
  font-weight: 600;
  font-size: 14.5px;
  color: ${color.ink900};
`

export const DropSecondary = styled.p`
  margin: 3px 0 0;
  font-size: 12px;
  color: ${color.ink450};
  text-wrap: pretty;
`

export const DropBrowse = styled.span`
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  border: 1px solid ${color.line};
  background: ${color.surface};
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 500;
  color: ${color.ink700};
`

export const HiddenInput = styled.input`
  display: none;
`
