import styled from 'styled-components'
import { Button, Navbar, Tag } from '@blueprintjs/core'
import { palette, media } from '../theme'

export const NavHeading = styled(Navbar.Heading)`
  display: flex;
  align-items: center;
  padding: 0;

  ${media.sm} {
    margin-right: 8px;
  }
`

export const NavLogo = styled.img`
  height: 28px;
  width: 28px;
  object-fit: contain;
  display: block;

  ${media.sm} {
    height: 24px;
    width: 24px;
  }
`

export const SubtitleSpan = styled.span`
  font-size: 13px;
  color: ${palette.c5};
  opacity: 0.75;

  ${media.md} {
    display: none;
  }
`

export const FramesTag = styled(Tag)`
  margin-right: 8px;

  ${media.sm} {
    display: none;
  }
`

export const HideOnMobile = styled.span`
  display: contents;

  ${media.md} {
    display: none;
  }
`

export const SnapshotsButton = styled(Button)`
  color: ${palette.c5} !important;

  ${media.sm} {
    /* hide text on tiny screens; keep the icon */
    .bp6-button-text {
      display: none;
    }
  }
`
