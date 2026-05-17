import styled from 'styled-components'
import { Dialog } from '@blueprintjs/core'
import { palette } from '../theme'

export const SnapDialog = styled(Dialog)`
  &.bp6-dialog {
    width: 400px;
  }
`

export const SnapBody = styled.div`
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

export const SnapHint = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${palette.c2};
  line-height: 1.5;
`

export const SnapActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`
