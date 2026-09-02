import { memo } from 'react'
import {
	CartesianGrid,
	ComposedChart,
	Line,
	ResponsiveContainer,
	Scatter,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'
import { AXIS_STYLE, CHART } from '../chartTheme'
import type { GuinierResult, SaxsData } from '../types/saxs'
import { ChartFrame } from '../styles/shared.styles'
import { TooltipBox, TooltipRow } from './GuinierChart.styles'

interface Props {
	data: SaxsData
	result: GuinierResult
}

const Dot =
	(fill: string, r = 2) =>
	(props: Record<string, number>) => {
		const { cx, cy } = props
		if (cx == null || cy == null) return null
		return <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.85} />
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
			<TooltipRow $color={CHART.tickColor}>
				q² = {x.toExponential(3)} Å⁻²
			</TooltipRow>
			<TooltipRow $color={CHART.titleColor}>ln I = {y.toFixed(3)}</TooltipRow>
		</TooltipBox>
	)
}

export const GuinierChart = memo(function GuinierChart({
	data,
	result,
}: Props) {
	const all: { x: number; y: number }[] = []
	for (let i = 0; i < data.q.length; i++) {
		if (data.I[i] > 0) all.push({ x: data.q[i] ** 2, y: Math.log(data.I[i]) })
	}
	const region = result.xs.map((x, i) => ({ x, y: result.ys[i] }))
	const fitLine = result.xs.map((x) => ({
		x,
		y: result.fit.slope * x + result.fit.intercept,
	}))

	/**
	 * A Guinier plot is a low-q plot. Showing the whole measured q² range puts
	 * the fitted region in the leftmost 2% of the axis - the panel ends up not
	 * showing the thing it is named after. So the view follows the fit: the
	 * selected range plus roughly half again of context on either side, so you
	 * can see where the linear region stops being linear and judge the edges.
	 */
	const fitLoX = result.xs.length > 0 ? Math.min(...result.xs) : 0
	const fitHiX = result.xs.length > 0 ? Math.max(...result.xs) : 0
	const span = Math.max(fitHiX - fitLoX, Number.EPSILON)
	const dataMaxX = Math.max(...all.map((p) => p.x))

	const xMin = Math.max(0, fitLoX - span * 0.35)
	const xMax = Math.min(dataMaxX, fitHiX + span * 0.9)

	/**
	 * Scale y to what is in view - but robustly. Buffer subtraction can leave a
	 * few points at near-zero intensity, and ln of those is hugely negative; a
	 * plain min/max lets one such point stretch the axis until the fit is a
	 * flat line at the top. Clip to the 2nd/98th percentile of what is in view,
	 * then make sure the fitted region is inside the window regardless.
	 */
	const inView = all.filter((p) => p.x >= xMin && p.x <= xMax)
	const ys = (inView.length > 4 ? inView : all).map((p) => p.y).sort((a, b) => a - b)
	const at = (f: number) => ys[Math.min(ys.length - 1, Math.floor(f * ys.length))]

	const fitYs = [...result.ys, ...fitLine.map((p) => p.y)]
	const yLo = Math.min(at(0.02), ...fitYs)
	const yHi = Math.max(at(0.98), ...fitYs)
	const pad = Math.max((yHi - yLo) * 0.12, 0.05)
	const yMin = yLo - pad
	const yMax = yHi + pad

	return (
		<ChartFrame $tall>
				<ResponsiveContainer width='100%' height='100%'>
					<ComposedChart
						data={fitLine}
						margin={{ top: 8, right: 20, bottom: 32, left: 20 }}
					>
						<CartesianGrid strokeDasharray='3 3' stroke={CHART.gridColor} />
						<XAxis
							dataKey='x'
							type='number'
							domain={[xMin, xMax]}
							allowDataOverflow
							tickFormatter={(v: number) => v.toExponential(1)}
							tick={AXIS_STYLE.tick}
							label={{
								value: 'q² (Å⁻²)',
								position: 'insideBottom',
								offset: -18,
								...AXIS_STYLE.label,
							}}
						/>
						<YAxis
							dataKey='y'
							type='number'
							domain={[yMin, yMax]}
							allowDataOverflow
							tickFormatter={(v: number) => v.toFixed(1)}
							tick={AXIS_STYLE.tick}
							width={64}
							label={{
								value: 'ln I(q)',
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
						{/* All background scatter points */}
						<Scatter
							data={all}
							isAnimationActive={false}
							shape={Dot(CHART.markOut) as any}
						/>
						{/* Guinier region highlighted */}
						<Scatter
							data={region}
							isAnimationActive={false}
							shape={Dot(CHART.markIn, 3) as any}
						/>
						{/* Fit line uses chart-level data={fitLine} */}
						<Line
							dataKey='y'
							type='linear'
							stroke={CHART.fitLine}
							strokeWidth={2}
							strokeDasharray='6 4'
							dot={false}
							isAnimationActive={false}
						/>
					</ComposedChart>
				</ResponsiveContainer>
		</ChartFrame>
	)
})
