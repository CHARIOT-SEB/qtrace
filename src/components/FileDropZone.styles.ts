import styled from 'styled-components'
import { Card, Icon } from '@blueprintjs/core'
import { palette } from '../theme'

interface DropCardProps {
  $isDragging: boolean
}

export const DropCard = styled(Card)<DropCardProps>`
  cursor: pointer;
  border: 2px dashed ${palette.c4} !important;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: #fff !important;
  text-align: center;

  ${({ $isDragging }) =>
    $isDragging &&
    `
    border-color: ${palette.c2} !important;
    box-shadow: 0 0 0 1px rgba(47,69,80,0.15) !important;
  `}

  &:hover {
    border-color: ${palette.c2} !important;
    box-shadow: 0 0 0 1px rgba(47,69,80,0.15) !important;
  }
`

export const DropIcon = styled(Icon)`
  opacity: 0.3;
  margin-bottom: 8px;
  color: ${palette.c2};
`

export const DropPrimary = styled.p`
  margin: 4px 0 2px;
  font-weight: 500;
  font-size: 13px;
  color: ${palette.c2};
`

export const DropSecondary = styled.p`
  margin: 0;
  font-size: 12px;
  color: #5c7080;
`

export const HiddenInput = styled.input`
  display: none;
`
