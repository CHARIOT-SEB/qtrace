import styled, { keyframes } from 'styled-components'
import { Callout, Dialog } from '@blueprintjs/core'
import { palette, media } from '../theme'

export const popIn = keyframes`
  from { transform: scale(0.5); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
`

export const ProcessingDialog = styled(Dialog)`
  &.bp6-dialog {
    width: 360px;
    max-width: calc(100vw - 32px);
    padding: 0;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 8px 32px rgba(47, 69, 80, 0.2) !important;
  }
`

export const ModalBody = styled.div`
  padding: 32px 28px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;

  ${media.sm} {
    padding: 24px 20px 20px;
    gap: 16px;
  }
`

export const ModalIndicator = styled.div`
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const SuccessIconWrap = styled.div`
  animation: ${popIn} 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
`

export const ModalTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${palette.c1};
  text-align: center;
  line-height: 1.3;
`

export const ModalErrorDesc = styled.p`
  margin: -8px 0 0;
  font-size: 13px;
  color: #cd4246;
  text-align: center;
  line-height: 1.5;
`

export const StageList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
`

type StageVariant = 'done' | 'active' | 'pending'

interface StageItemProps {
  $stage: StageVariant
}

function stageColor(stage: StageVariant): string {
  if (stage === 'done') return palette.c3
  if (stage === 'active') return palette.c1
  return palette.c4
}

export const StageItem = styled.li<StageItemProps>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  font-size: 13px;
  transition: color 0.15s, opacity 0.15s;
  color: ${({ $stage }) => stageColor($stage)};
  font-weight: ${({ $stage }) => ($stage === 'active' ? 500 : 400)};
  opacity: ${({ $stage }) => ($stage === 'pending' ? 0.7 : 1)};
`

interface StageIconProps {
  $stage: StageVariant
}

export const StageIcon = styled.span<StageIconProps>`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ $stage }) =>
    $stage === 'done' ? '#238551' : $stage === 'active' ? palette.c2 : 'inherit'};
`

export const StageDot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${palette.c4};
  display: block;
`

export const StageLabel = styled.span`
  flex: 1;
`

export const StageCount = styled.span`
  font-size: 11px;
  color: ${palette.c3};
  font-variant-numeric: tabular-nums;
`

export const ModalActions = styled.div`
  width: 100%;
`

export const ModalErrorActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`

export const SampleCallout = styled(Callout)`
  margin-bottom: 16px;
  text-align: left;
`
