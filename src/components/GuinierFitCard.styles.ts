import styled from 'styled-components'
import { Button, Card, Divider } from '@blueprintjs/core'
import { palette } from '../theme'

export const GuinierCard = styled(Card)`
  flex: 1;
  margin-top: 16px;
  overflow: visible !important;

  .bp6-slider {
    margin: 28px 8px 8px;
  }
`

export const RangeReadout = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 12px 16px;
  background: ${palette.c5};
  border-radius: 6px;
  border: 1px solid ${palette.c4};
`

export const RangeQ = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
`

export const RangeLabel = styled.span`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${palette.c3};
  margin-bottom: 3px;
`

export const RangeVal = styled.span`
  font-size: 17px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${palette.c1};
`

export const RangeUnit = styled.span`
  font-size: 11px;
  font-weight: 400;
  color: ${palette.c3};
`

export const RangeArrow = styled.div`
  color: ${palette.c3};
  font-size: 18px;
`

export const RangePts = styled.div`
  font-size: 12px;
  color: ${palette.c3};
  white-space: nowrap;
  border-left: 1px solid ${palette.c4};
  padding-left: 12px;
  font-variant-numeric: tabular-nums;
`

export const AutoFindButton = styled(Button)`
  margin-top: 16px;
`

export const GuidanceDivider = styled(Divider)`
  margin: 20px 0 16px;
`

export const GuidanceTitle = styled.p`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${palette.c3};
  margin: 0 0 8px;
`

export const GuidanceText = styled.p`
  font-size: 12px;
  line-height: 1.7;
  color: ${palette.c3};
  margin: 0;
`
