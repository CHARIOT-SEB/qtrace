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
  gap: 8px;
  justify-content: center;
  padding: 20px 150px 20px 150px;

  ${media.lg} {
    padding: 20px 60px;
  }
  ${media.md} {
    padding: 14px 16px;
  }
  ${media.sm} {
    padding: 12px 12px;
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
