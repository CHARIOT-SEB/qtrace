import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button, ButtonGroup, Elevation, RangeSlider, Tag } from '@blueprintjs/core';
import { frameIntensity } from '../lib/secSaxs';
import { AXIS_STYLE, CHART } from '../chartTheme';
import type { SaxsData } from '../types/saxs';
import { ChartCard, ChartCardTitle } from '../styles/shared.styles';
import {
  SecRanges,
  SecRangeHeading,
  Swatch,
  SecSummary,
  ChartTitleControls,
  TooltipBox,
  TooltipRow,
} from './SecTrace.styles';

interface Props {
  frames: SaxsData[];
  bufferRange: [number, number];
  signalRange: [number, number];
  onBufferChange: (r: [number, number]) => void;
  onSignalChange: (r: [number, number]) => void;
}

const TIP = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <TooltipBox>
      <TooltipRow $color={CHART.tickColor}>{label}</TooltipRow>
      <TooltipRow $color='#e5e8eb'>mean I: {payload[0].value.toExponential(3)}</TooltipRow>
    </TooltipBox>
  );
};

export function SecTrace({ frames, bufferRange, signalRange, onBufferChange, onSignalChange }: Props) {
  const [viewMode, setViewMode] = useState<'bars' | 'dots'>('bars');

  // Local slider positions for instant visual feedback — parent is only notified on release.
  const [localBuffer, setLocalBuffer] = useState<[number, number]>(bufferRange);
  const [localSignal, setLocalSignal] = useState<[number, number]>(signalRange);

  // Keep local state in sync when the parent drives a programmatic change (e.g. auto-detect).
  useEffect(() => { setLocalBuffer(bufferRange); }, [bufferRange]);
  useEffect(() => { setLocalSignal(signalRange); }, [signalRange]);

  // Memoized so it only recomputes when frames are loaded/changed, not on every slider tick.
  const intensities = useMemo(() => frames.map(frameIntensity), [frames]);

  const last = frames.length - 1;
  const [bStart, bEnd] = localBuffer;
  const [sStart, sEnd] = localSignal;

  const barData = useMemo(() => intensities.map((value, i) => ({
    value,
    name: frames[i].filename ?? `Frame ${i + 1}`,
    color: i >= sStart && i <= sEnd
      ? CHART.barSignal
      : i >= bStart && i <= bEnd
      ? CHART.barBuffer
      : CHART.barOther,
  })), [intensities, frames, bStart, bEnd, sStart, sEnd]);

  const dotData = useMemo(() => intensities.map((value, i) => ({
    x: i,
    y: value,
    name: frames[i].filename ?? `Frame ${i + 1}`,
    color: i >= sStart && i <= sEnd
      ? CHART.barSignal
      : i >= bStart && i <= bEnd
      ? CHART.barBuffer
      : CHART.barOther,
  })), [intensities, frames, bStart, bEnd, sStart, sEnd]);

  const DotShape = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;
    return <circle cx={cx} cy={cy} r={4} fill={payload.color} fillOpacity={0.9} />;
  };

  const labelStep = Math.max(1, Math.floor(last / 10));

  return (
    <ChartCard elevation={Elevation.ONE}>
      <ChartCardTitle>
        <span>SEC Chromatogram</span>
        <ChartTitleControls>
          <ButtonGroup>
            <Button size="small" active={viewMode === 'bars'} onClick={() => setViewMode('bars')} icon="timeline-bar-chart">Bars</Button>
            <Button size="small" active={viewMode === 'dots'} onClick={() => setViewMode('dots')} icon="scatter-plot">Dots</Button>
          </ButtonGroup>
          <Tag minimal>{frames.length} frames</Tag>
        </ChartTitleControls>
      </ChartCardTitle>

      <ResponsiveContainer width="100%" height={320}>
        {viewMode === 'bars' ? (
          <BarChart data={barData} margin={{ top: 8, right: 20, bottom: 8, left: 20 }} barCategoryGap={1}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridColor} vertical={false} />
            <XAxis dataKey="name" tick={false} axisLine={{ stroke: CHART.gridColor }} />
            <YAxis
              dataKey="value"
              tickFormatter={(v: number) => v.toExponential(1)}
              tick={AXIS_STYLE.tick}
              width={56}
              label={{ value: 'mean I(q)', angle: -90, position: 'insideLeft', offset: 12, ...AXIS_STYLE.label }}
            />
            <Tooltip content={TIP as React.FC} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="value" isAnimationActive={false} radius={[2, 2, 0, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <ScatterChart margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.gridColor} vertical={false} />
            <XAxis dataKey="x" type="number" domain={[0, last]} tick={false} axisLine={{ stroke: CHART.gridColor }} />
            <YAxis
              dataKey="y"
              type="number"
              tickFormatter={(v: number) => v.toExponential(1)}
              tick={AXIS_STYLE.tick}
              width={56}
              label={{ value: 'mean I(q)', angle: -90, position: 'insideLeft', offset: 12, ...AXIS_STYLE.label }}
            />
            <Tooltip content={TIP as React.FC} cursor={{ strokeDasharray: '3 3', stroke: CHART.gridColor }} />
            <Scatter data={dotData} isAnimationActive={false} shape={DotShape as any} />
          </ScatterChart>
        )}
      </ResponsiveContainer>

      <SecRanges>
        <div>
          <SecRangeHeading>
            <Swatch $color={CHART.barBuffer} />
            Buffer region
          </SecRangeHeading>
          <RangeSlider
            min={0}
            max={last}
            stepSize={1}
            labelStepSize={labelStep}
            labelRenderer={(i) => `#${i + 1}`}
            value={localBuffer}
            onChange={setLocalBuffer}
            onRelease={onBufferChange}
          />
          <SecSummary>
            <span>Frames {bStart + 1}–{bEnd + 1}</span>
            <span>({bEnd - bStart + 1} frames averaged)</span>
          </SecSummary>
        </div>

        <div>
          <SecRangeHeading>
            <Swatch $color={CHART.barSignal} />
            Signal (protein)
          </SecRangeHeading>
          <RangeSlider
            min={0}
            max={last}
            stepSize={1}
            labelStepSize={labelStep}
            labelRenderer={(i) => `#${i + 1}`}
            value={localSignal}
            onChange={setLocalSignal}
            onRelease={onSignalChange}
          />
          <SecSummary>
            <span>Frames {sStart + 1}–{sEnd + 1}</span>
            <span>({sEnd - sStart + 1} frames averaged)</span>
          </SecSummary>
        </div>
      </SecRanges>
    </ChartCard>
  );
}
