import styled from 'styled-components'
import { Card } from '@blueprintjs/core'
import { palette } from '../theme'

export const ChartCard = styled(Card)`
  margin-bottom: 0;
`

export const ChartCardTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${palette.c2};
  margin: 0 0 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`
