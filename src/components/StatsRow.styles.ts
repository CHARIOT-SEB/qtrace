import styled from 'styled-components'
import { Card, Tag } from '@blueprintjs/core'
import { palette } from '../theme'

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-bottom: 16px;
`

export const StatCard = styled(Card)`
  text-align: center;
  padding: 10px 12px !important;
`

export const StatLabel = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${palette.c3};
  margin-bottom: 4px;
`

export const StatValue = styled.div`
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  color: ${palette.c1};
`

export const StatUnit = styled.span`
  font-size: 11px;
  color: ${palette.c3};
  margin-left: 3px;
`

export const StatUncertainty = styled.div`
  font-size: 10px;
  color: ${palette.c3};
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
`

export const QRgValueRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`

export const QRgTag = styled(Tag)`
  font-size: 9px !important;
`
