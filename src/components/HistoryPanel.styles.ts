import styled from 'styled-components'
import { palette } from '../theme'

export const Panel = styled.div`
  width: 256px;
  flex-shrink: 0;
  background: #fff;
  border-left: 1px solid ${palette.c4};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

export const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 10px 8px 12px;
  border-bottom: 1px solid ${palette.c4};
  flex-shrink: 0;
`

export const PanelTitle = styled.span`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${palette.c2};
`

export const PanelHeaderActions = styled.div`
  display: flex;
  gap: 2px;
`

export const PanelEntries = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 6px;
`

export const EmptyNotice = styled.p`
  font-size: 12px;
  color: ${palette.c3};
  text-align: center;
  margin-top: 24px;
  padding: 0 12px;
`

interface EntryProps {
  $isActive: boolean
}

export const Entry = styled.div<EntryProps>`
  padding: 7px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 2px;
  border: 1px solid transparent;
  transition: background 0.1s;
  background: ${({ $isActive }) =>
    $isActive ? 'rgba(184, 219, 217, 0.2)' : 'transparent'};
  border-color: ${({ $isActive }) =>
    $isActive ? 'rgba(88, 111, 124, 0.35) !important' : 'transparent'};

  &:hover {
    background: ${palette.c5};
    border-color: ${palette.c4};
  }
`

export const EntryTop = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`

export const EntryIcon = styled.span`
  color: ${palette.c3} !important;
  flex-shrink: 0;
`

interface EntryLabelProps {
  $isActive: boolean
}

export const EntryLabel = styled.span<EntryLabelProps>`
  flex: 1;
  font-size: 12px;
  color: ${palette.c1};
  line-height: 1.3;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${({ $isActive }) => ($isActive ? 600 : 400)};
`

export const EntryTime = styled.div`
  font-size: 10px;
  color: ${palette.c3};
  margin-top: 2px;
  padding-left: 17px;
`
