import { memo } from 'react'
import {
	CartesianGrid,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'
import { Elevation } from '@blueprintjs/core'
import { AXIS_STYLE, CHART } from '../chartTheme'
import type { SaxsData } from '../types/saxs'
import { ChartCard, ChartCardTitle } from '../styles/shared.styles'
import { TooltipBox, TooltipRow } from './KratkyChart.styles'

interface Props {
	data: SaxsData
}

const Dot = (props: Record<string, number>) => {
	const { cx, cy } = props
	if (cx == null || cy == null) return null
	return (
		<circle cx={cx} cy={cy} r={2} fill={CHART.dataBlue} fillOpacity={0.85} />
	)
}

const TIP = ({
	active,
	payload,
}: {
	active?: boolean
	payload?: { payload: { x: number; y: number } }[]
}) => {
	if (!active || !payload?.length) return null
	const { x, y } = payload[0].payload
	return (
		<TooltipBox>
			<TooltipRow $color={CHART.tickColor}>q = {x.toFixed(4)} Å⁻¹</TooltipRow>
			<TooltipRow $color='#e5e8eb'>q²·I = {y.toExponential(3)}</TooltipRow>
		</TooltipBox>
	)
}

export const KratkyChart = memo(function KratkyChart({ data }: Props) {
	const pts = data.q
		.map((q, i) => ({ x: q, y: q * q * data.I[i] }))
		.filter((p) => isFinite(p.y))

	const xMin = Math.min(...pts.map((p) => p.x))
	const xMax = Math.max(...pts.map((p) => p.x))
	const yMin = Math.min(0, Math.min(...pts.map((p) => p.y)))
	const yMax = Math.max(...pts.map((p) => p.y))

	return (
		<ChartCard elevation={Elevation.ONE}>
			<ChartCardTitle>
				<span>Kratky plot — q²·I(q) vs q</span>
			</ChartCardTitle>
			<ResponsiveContainer width='100%' height={460}>
				<ScatterChart margin={{ top: 8, right: 20, bottom: 32, left: 20 }}>
					<CartesianGrid strokeDasharray='3 3' stroke={CHART.gridColor} />
					<XAxis
						dataKey='x'
						type='number'
						domain={[xMin * 0.98, xMax * 1.02]}
						tick={AXIS_STYLE.tick}
						label={{
							value: 'q (Å⁻¹)',
							position: 'insideBottom',
							offset: -18,
							...AXIS_STYLE.label,
						}}
					/>
					<YAxis
						dataKey='y'
						type='number'
						domain={[yMin, yMax * 1.1]}
						tickFormatter={(v: number) => v.toExponential(1)}
						tick={AXIS_STYLE.tick}
						width={56}
						label={{
							value: 'q²·I(q)',
							angle: -90,
							position: 'insideLeft',
							offset: 12,
							...AXIS_STYLE.label,
						}}
					/>
					<Tooltip
						content={TIP as React.FC}
						cursor={{ strokeDasharray: '3 3', stroke: CHART.gridColor }}
					/>
					<Scatter
						data={pts}
						isAnimationActive={false}
						shape={Dot as any}
					/>
				</ScatterChart>
			</ResponsiveContainer>
		</ChartCard>
	)
})
