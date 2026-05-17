import { memo } from 'react';
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Elevation } from '@blueprintjs/core';
import { AXIS_STYLE, CHART } from '../chartTheme';
import type { GuinierResult } from '../types/saxs';
import { ChartCardTitle } from '../styles/shared.styles';
import { ResidualsCard, ChartInner, TooltipBox, TooltipRow } from './ResidualsChart.styles';

interface Props { result: GuinierResult; }

const Dot = (props: Record<string, number>) => {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={3} fill={CHART.dataViolet} fillOpacity={0.85} />;
};

const TIP = ({ active, payload }: { active?: boolean; payload?: { payload: { x: number; y: number } }[] }) => {
  if (!active || !payload?.length) return null;
  const { x, y } = payload[0].payload;
  return (
    <TooltipBox>
      <TooltipRow $color={CHART.tickColor}>q² = {x.toExponential(3)}</TooltipRow>
      <TooltipRow $color={CHART.dataViolet}>residual = {y.toFixed(4)}</TooltipRow>
    </TooltipBox>
  );
};

export const ResidualsChart = memo(function ResidualsChart({ result }: Props) {
  const resid = result.xs.map((x, i) => ({
    x,
    y: result.ys[i] - (result.fit.slope * x + result.fit.intercept),
  }));

  const xMin = Math.min(...result.xs);
  const xMax = Math.max(...result.xs);
  const absMax = Math.max(...resid.map(p => Math.abs(p.y))) * 1.3;

  return (
    <ResidualsCard elevation={Elevation.ONE}>
      <ChartCardTitle>
        <span>Fit residuals</span>
      </ChartCardTitle>
      <ChartInner>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 20, bottom: 32, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridColor} />
            <XAxis
              dataKey="x"
              type="number"
              domain={[xMin * 0.95, xMax * 1.05]}
              tickFormatter={(v: number) => v.toExponential(1)}
              tick={AXIS_STYLE.tick}
              label={{ value: 'q²', position: 'insideBottom', offset: -18, ...AXIS_STYLE.label }}
            />
            <YAxis
              dataKey="y"
              type="number"
              domain={[-absMax, absMax]}
              tickFormatter={(v: number) => v.toExponential(1)}
              tick={AXIS_STYLE.tick}
              width={72}
              label={{ value: 'residual', angle: -90, position: 'insideLeft', offset: 12, ...AXIS_STYLE.label }}
            />
            <Tooltip content={TIP as React.FC} cursor={{ strokeDasharray: '3 3', stroke: CHART.gridColor }} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
            <Scatter data={resid} isAnimationActive={false} shape={Dot as any} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartInner>
    </ResidualsCard>
  );
})
