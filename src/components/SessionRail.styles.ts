import styled from 'styled-components'
import { color, font } from '../theme'

export const DatasetCard = styled.div`
  border: 1px solid ${color.line};
  border-radius: 7px;
  padding: 10px 11px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
`

export const DatasetTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`

export const DatasetTitleText = styled.span`
  font-family: ${font.mono};
  font-size: 12.5px;
  font-weight: 500;
  color: ${color.ink900};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const DatasetFacts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: 11px;
  color: ${color.ink500};

  & > span[aria-hidden] {
    color: ${color.line};
  }
`

export const LinkButton = styled.button`
  appearance: none;
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-size: 11.5px;
  font-weight: 500;
  color: ${color.accent};
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: ${color.ink900};
  }
  &:focus-visible {
    outline: 2px solid ${color.accent};
    outline-offset: 2px;
    border-radius: 2px;
  }
`

export const RegionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const RegionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border: 1px solid ${color.line};
  border-radius: 6px;
  min-width: 0;
`

export const RegionSwatch = styled.span<{ $color: string }>`
  width: 3px;
  height: 26px;
  border-radius: 2px;
  flex-shrink: 0;
  background: ${({ $color }) => $color};
`

export const RegionBody = styled.div`
  flex-grow: 1;
  min-width: 0;
`

export const RegionName = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${color.ink500};
`

export const RegionValue = styled.div`
  font-family: ${font.mono};
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 500;
  color: ${color.ink900};
  margin-top: 1px;
`

export const RegionCount = styled.span`
  font-family: ${font.mono};
  font-variant-numeric: tabular-nums;
  font-size: 10.5px;
  color: ${color.ink450};
  white-space: nowrap;
`

export const SnapshotGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

export const SnapshotGroupHead = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 0 5px 2px;
  font-size: 10.5px;
  font-weight: 500;
  color: ${color.ink500};
`

export const SnapshotRowEl = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 9px;
  border-radius: 6px;
  cursor: pointer;
  min-width: 0;
  background: ${({ $active }) => ($active ? color.accentSoft : 'transparent')};
  border: 1px solid
    ${({ $active }) => ($active ? color.accentBorder : 'transparent')};

  &:hover {
    background: ${({ $active }) =>
      $active ? color.accentSoft : color.canvas};
  }
  &:focus-visible {
    outline: 2px solid ${color.accent};
    outline-offset: 1px;
  }

  /* Row actions stay out of the way until the row is touched */
  &:hover > [data-row-actions],
  &:focus-within > [data-row-actions] {
    opacity: 1;
  }
`

export const SnapshotIcon = styled.span<{ $cloud?: boolean }>`
  display: flex;
  flex-shrink: 0;
  color: ${({ $cloud }) => ($cloud ? color.accent : color.ink450)};
`

export const SnapshotBody = styled.div`
  flex-grow: 1;
  min-width: 0;
`

export const SnapshotName = styled.div<{ $active?: boolean }>`
  font-size: 12.5px;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  color: ${color.ink900};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const SnapshotMeta = styled.div`
  font-family: ${font.mono};
  font-variant-numeric: tabular-nums;
  font-size: 10.5px;
  color: ${color.ink450};
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const SnapshotActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 120ms ease;

  @media (hover: none) {
    opacity: 1;
  }
`

export const SessionActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`

export const SignedOutNote = styled.p`
  margin: 0;
  font-size: 11px;
  line-height: 1.55;
  color: ${color.ink450};
  text-wrap: pretty;
`

export const DangerLink = styled(LinkButton)`
  color: ${color.ink450};
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 7px;

  &:hover {
    color: ${color.badInk};
  }
`

export const HiddenInput = styled.input`
  display: none;
`
