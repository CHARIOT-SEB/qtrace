import styled from 'styled-components'
import { Callout, Card, Divider } from '@blueprintjs/core'
import { palette } from './theme'

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
`

export const AppContent = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 20px 28px 40px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`

export const TopRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin-bottom: 20px;
`

export const DropZoneWrap = styled.div`
  flex: 1;
  padding: 20px 150px 20px 150px;
`

export const ToolbarCard = styled(Card)`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  padding: 20px 150px 20px 150px;
`

export const AnalysisGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
`

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
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

export const ErrorCallout = styled(Callout)`
  margin-bottom: 16px;
`

export const SecDivider = styled(Divider)`
  margin: 20px 0;
`

export const NoFitCard = styled(Card)`
  flex: 1;
`
