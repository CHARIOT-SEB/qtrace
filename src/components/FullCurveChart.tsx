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
import { Card, Elevation } from '@blueprintjs/core'
import { AXIS_STYLE, CHART } from '../chartTheme'
import type { GuinierResult, SaxsData } from '../types/saxs'

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
		<div
			style={{
				background: CHART.tooltipBg,
				border: `1px solid ${CHART.tooltipBorder}`,
				padding: '6px 10px',
				fontSize: 12,
				borderRadius: 4,
				lineHeight: 1.6,
			}}
		>
			<div style={{ color: CHART.tickColor }}>q = {x.toFixed(4)} Å⁻¹</div>
			<div style={{ color: CHART.tickColor }}>q² = {q2.toExponential(3)} Å⁻²</div>
			<div style={{ color: '#e5e8eb' }}>I = {y.toExponential(3)}</div>
			<div style={{ color: '#e5e8eb' }}>ln I = {lnI.toFixed(3)}</div>
			{inFit && qRg != null && (
				<div style={{ color: CHART.tickColor }}>q·Rg = {qRg.toFixed(3)}</div>
			)}
			{inFit && residual != null && (
				<div style={{ color: CHART.dataViolet }}>residual = {residual.toFixed(4)}</div>
			)}
			<div
				style={{
					marginTop: 3,
					color: inFit ? CHART.dataGreen : CHART.dataGray,
					fontWeight: 600,
					fontSize: 11,
				}}
			>
				{inFit ? 'IN FIT' : 'excluded'}
			</div>
		</div>
	)
}

export const FullCurveChart = memo(function FullCurveChart({ data, result, title, hoveredQ, onHoverQ }: Props) {
	const outside: ScatterPt[] = []
	const insideValid: ScatterPt[] = []
	const insideWarning: ScatterPt[] = []
	const insideInvalid: ScatterPt[] = []

	for (let i = 0; i < data.q.length; i++) {
		if (data.I[i] > 0) {
			const q = data.q[i]
			const I = data.I[i]
			const q2 = q * q
			const lnI = Math.log(I)
			const inFit = !!result && i >= result.iMin && i <= result.iMax

			if (inFit && result) {
				const qRg = q * result.Rg
				const residual = lnI - (result.fit.slope * q2 + result.fit.intercept)
				const pt: ScatterPt = { x: q, y: I, q2, lnI, inFit: true, qRg, residual }
				// qRg NaN (unphysical fit) falls through to insideInvalid — correct visual signal
				if (qRg <= 1.3) insideValid.push(pt)
				else if (qRg <= 1.5) insideWarning.push(pt)
				else insideInvalid.push(pt)
			} else {
				outside.push({ x: q, y: I, q2, lnI, inFit: false })
			}
		}
	}

	const allPts = [...outside, ...insideValid, ...insideWarning, ...insideInvalid]
	const yMin = Math.min(...allPts.map((p) => p.y))
	const yMax = Math.max(...allPts.map((p) => p.y))
	const xMin = Math.min(...allPts.map((p) => p.x))
	const xMax = Math.max(...allPts.map((p) => p.x))
	const ticks = logTicks(yMin, yMax)

	return (
		<Card elevation={Elevation.ONE} className='chart-card'>
			<div className='chart-card-title'>
				<span>{title ?? 'Scattering curve — log I(q) vs q'}</span>
			</div>
			<ResponsiveContainer width='100%' height={460}>
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
						width={56}
						label={{
							value: 'I(q)',
							angle: -90,
							position: 'insideLeft',
							offset: 12,
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
						shape={Dot(result ? CHART.dataGray : CHART.dataBlue) as any}
					/>
					{result && (
						<>
							<Scatter
								data={insideValid}
								isAnimationActive={false}
								shape={Dot(CHART.dataGreen, 3) as any}
							/>
							<Scatter
								data={insideWarning}
								isAnimationActive={false}
								shape={Dot(CHART.dataOrangeWarn, 3) as any}
							/>
							<Scatter
								data={insideInvalid}
								isAnimationActive={false}
								shape={Dot(CHART.dataRedInvalid, 3) as any}
							/>
						</>
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
		</Card>
	)
})
