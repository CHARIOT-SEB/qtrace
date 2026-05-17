import { memo } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, Elevation, Tag } from '@blueprintjs/core';
import { AXIS_STYLE, CHART } from '../chartTheme';
import type { GuinierResult, SaxsData } from '../types/saxs';

interface Props {
  data: SaxsData;
  result: GuinierResult;
}

const Dot = (fill: string, r = 2) => (props: Record<string, number>) => {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.85} />;
};

const TIP = ({ active, payload }: { active?: boolean; payload?: { payload: { x: number; y: number } }[] }) => {
  if (!active || !payload?.length) return null;
  const { x, y } = payload[0].payload;
  return (
    <div style={{ background: CHART.tooltipBg, border: `1px solid ${CHART.tooltipBorder}`, padding: '6px 10px', fontSize: 12, borderRadius: 4 }}>
      <div style={{ color: CHART.tickColor }}>q² = {x.toExponential(3)} Å⁻²</div>
      <div style={{ color: '#e5e8eb' }}>ln I = {y.toFixed(3)}</div>
    </div>
  );
};

export const GuinierChart = memo(function GuinierChart({ data, result }: Props) {
  const all: { x: number; y: number }[] = [];
  for (let i = 0; i < data.q.length; i++) {
    if (data.I[i] > 0) all.push({ x: data.q[i] ** 2, y: Math.log(data.I[i]) });
  }
  const region = result.xs.map((x, i) => ({ x, y: result.ys[i] }));
  const fitLine = result.xs.map((x) => ({ x, y: result.fit.slope * x + result.fit.intercept }));

  const xMin = Math.min(...all.map(p => p.x));
  const xMax = Math.max(...all.map(p => p.x));
  const yMin = Math.min(...all.map(p => p.y));
  const yMax = Math.max(...all.map(p => p.y));

  return (
    <Card elevation={Elevation.ONE} className="chart-card">
      <div className="chart-card-title">
        <span>Guinier plot — ln I(q) vs q²</span>
        <Tag minimal>pts {result.iMin + 1}–{result.iMax + 1} / {data.q.length}</Tag>
      </div>
      <ResponsiveContainer width="100%" height={460}>
        <ComposedChart data={fitLine} margin={{ top: 8, right: 20, bottom: 32, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridColor} />
          <XAxis
            dataKey="x"
            type="number"
            domain={[xMin * 0.98, xMax * 1.02]}
            tickFormatter={(v: number) => v.toExponential(1)}
            tick={AXIS_STYLE.tick}
            label={{ value: 'q² (Å⁻²)', position: 'insideBottom', offset: -18, ...AXIS_STYLE.label }}
          />
          <YAxis
            dataKey="y"
            type="number"
            domain={[yMin - 0.5, yMax + 0.5]}
            tickFormatter={(v: number) => v.toFixed(1)}
            tick={AXIS_STYLE.tick}
            width={64}
            label={{ value: 'ln I(q)', angle: -90, position: 'insideLeft', offset: 12, ...AXIS_STYLE.label }}
          />
          <Tooltip content={TIP as React.FC} cursor={{ strokeDasharray: '3 3', stroke: CHART.gridColor }} />
          {/* All background scatter points */}
          <Scatter data={all} isAnimationActive={false} shape={Dot(CHART.dataGray) as any} />
          {/* Guinier region highlighted */}
          <Scatter data={region} isAnimationActive={false} shape={Dot(CHART.dataGreen, 3) as any} />
          {/* Fit line uses chart-level data={fitLine} */}
          <Line
            dataKey="y"
            type="linear"
            stroke={CHART.dataOrange}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
})
