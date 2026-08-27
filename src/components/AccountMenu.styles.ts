import styled from 'styled-components'
import { Button } from '@blueprintjs/core'
import { palette, media } from '../theme'

export const AccountButton = styled(Button)`
  color: ${palette.c5} !important;
  margin-left: 4px;

  ${media.sm} {
    /* hide text on tiny screens; keep the icon */
    .bp6-button-text {
      display: none;
    }
  }
`

export const AccountEmail = styled.span`
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${media.md} {
    max-width: 120px;
  }
`
