import styled from 'styled-components'
import { Button, Navbar, Tag } from '@blueprintjs/core'
import { palette } from '../theme'

export const NavHeading = styled(Navbar.Heading)`
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.04em;

  sup {
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0;
    vertical-align: super;
  }
`

export const SubtitleSpan = styled.span`
  font-size: 13px;
  color: ${palette.c5};
  opacity: 0.75;
`

export const FramesTag = styled(Tag)`
  margin-right: 8px;
`

export const SnapshotsButton = styled(Button)`
  color: ${palette.c5} !important;
`
