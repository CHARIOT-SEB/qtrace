import { memo } from 'react'
import {
	CartesianGrid,
	ReferenceLine,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'
import { AXIS_STYLE, CHART } from '../chartTheme'
import type { GuinierResult, SaxsData } from '../types/saxs'
import { ChartCard, ChartCardTitle, ChartFrame } from '../styles/shared.styles'
import { TooltipBox, TooltipRow, InFitRow } from './FullCurveChart.styles'

interface Props {
	data: SaxsData
	result?: GuinierResult
	title?: string
	hoveredQ: number | null
	onHoverQ: (q: number | null) => void
}

interface ScatterPt {
	x: number
	y: number
	q2: number
	lnI: number
	inFit: boolean
	qRg?: number
	residual?: number
}

const Dot =
	(fill: string, r = 2) =>
	(props: Record<string, number>) => {
		const { cx, cy } = props
		if (cx == null || cy == null) return null
		return <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.85} />
	}

function logTicks(min: number, max: number): number[] {
	const ticks: number[] = []
	let p = Math.floor(Math.log10(min))
	while (Math.pow(10, p) <= max * 1.1) {
		ticks.push(Math.pow(10, p))
		p++
	}
	return ticks
}

const TIP = ({
	active,
	payload,
}: {
	active?: boolean
	payload?: { payload: ScatterPt }[]
}) => {
	if (!active || !payload?.length) return null
	const { x, y, q2, lnI, inFit, qRg, residual } = payload[0].payload
	return (
		<TooltipBox>
			<TooltipRow $color={CHART.tickColor}>q = {x.toFixed(4)} Å⁻¹</TooltipRow>
			<TooltipRow $color={CHART.tickColor}>
				q² = {q2.toExponential(3)} Å⁻²
			</TooltipRow>
			<TooltipRow $color={CHART.titleColor}>I = {y.toExponential(3)}</TooltipRow>
			<TooltipRow $color={CHART.titleColor}>ln I = {lnI.toFixed(3)}</TooltipRow>
			{inFit && qRg != null && (
				<TooltipRow $color={CHART.tickColor}>
					q·Rg = {qRg.toFixed(3)}
				</TooltipRow>
			)}
			{inFit && residual != null && (
				<TooltipRow $color={CHART.residual}>
					residual = {residual.toFixed(4)}
				</TooltipRow>
			)}
			<InFitRow $inFit={inFit}>{inFit ? 'IN FIT' : 'excluded'}</InFitRow>
		</TooltipBox>
	)
}

export const FullCurveChart = memo(function FullCurveChart({
	data,
	result,
	title,
	hoveredQ,
	onHoverQ,
}: Props) {
	const outside: ScatterPt[] = []
	const inside: ScatterPt[] = []

	for (let i = 0; i < data.q.length; i++) {
		if (data.I[i] > 0) {
			const q = data.q[i]
			const I = data.I[i]
			const q2 = q * q
			const lnI = Math.log(I)
			const inFit = !!result && i >= result.iMin && i <= result.iMax

			if (inFit && result) {
				inside.push({
					x: q,
					y: I,
					q2,
					lnI,
					inFit: true,
					qRg: q * result.Rg,
					residual: lnI - (result.fit.slope * q2 + result.fit.intercept),
				})
			} else {
				outside.push({ x: q, y: I, q2, lnI, inFit: false })
			}
		}
	}

	/**
	 * Colour here answers only "is this point in the fit". Whether the fit has
	 * run past the Guinier regime is a different question, so it gets its own
	 * mark: a line at the q where qRg crosses 1.3, drawn only when the fit
	 * actually reaches it. Previously both questions shared one colour scale
	 * and a green point could not say which of the two it meant.
	 */
	const qRgLimitQ = result && result.Rg > 0 ? 1.3 / result.Rg : null
	const showQRgLimit =
		qRgLimitQ !== null &&
		Number.isFinite(qRgLimitQ) &&
		inside.some((p) => (p.qRg ?? 0) > 1.3)

	const allPts = [...outside, ...inside]
	const yMin = Math.min(...allPts.map((p) => p.y))
	const yMax = Math.max(...allPts.map((p) => p.y))
	const xMin = Math.min(...allPts.map((p) => p.x))
	const xMax = Math.max(...allPts.map((p) => p.x))
	const ticks = logTicks(yMin, yMax)

	return (
		<ChartCard>
			<ChartCardTitle>
				<span>{title ?? 'Scattering curve - log I(q) vs q'}</span>
			</ChartCardTitle>
			<ChartFrame $tall>
				<ResponsiveContainer width='100%' height='100%'>
					<ScatterChart
						margin={{ top: 8, right: 20, bottom: 32, left: 20 }}
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						onMouseMove={(state: any) => {
							const q = state?.activePayload?.[0]?.payload?.x
							if (typeof q === 'number') onHoverQ(q)
						}}
						onMouseLeave={() => onHoverQ(null)}
					>
						<CartesianGrid strokeDasharray='3 3' stroke={CHART.gridColor} />
						<XAxis
							dataKey='x'
							type='number'
							domain={[xMin * 0.98, xMax * 1.02]}
							tickFormatter={(v: number) => v.toFixed(2)}
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
							scale='log'
							domain={[yMin * 0.5, yMax * 2]}
							ticks={ticks}
							tickFormatter={(v: number) => v.toExponential(0)}
							tick={AXIS_STYLE.tick}
							width={64}
							label={{
								value: 'I(q)',
								angle: -90,
								position: 'insideLeft',
								offset: -2,
								...AXIS_STYLE.label,
							}}
						/>
						<Tooltip
							content={TIP as any}
							cursor={{ strokeDasharray: '3 3', stroke: CHART.gridColor }}
						/>
						<Scatter
							data={outside}
							isAnimationActive={false}
							shape={Dot(result ? CHART.markOut : CHART.markIn) as any}
						/>
						{result && (
							<Scatter
								data={inside}
								isAnimationActive={false}
								shape={Dot(CHART.markIn, 3) as any}
							/>
						)}
						{showQRgLimit && (
							<ReferenceLine
								x={qRgLimitQ as number}
								stroke={CHART.qrgWarn}
								strokeDasharray='4 3'
								label={{
									value: 'qRg 1.3',
									position: 'top',
									fill: CHART.qrgWarn,
									fontSize: 10,
								}}
							/>
						)}
						{hoveredQ !== null && (
							<ReferenceLine
								x={hoveredQ}
								stroke='rgba(165,165,165,0.5)'
								strokeDasharray='3 3'
							/>
						)}
					</ScatterChart>
				</ResponsiveContainer>
			</ChartFrame>
		</ChartCard>
	)
})
