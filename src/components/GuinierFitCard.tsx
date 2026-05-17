import { Elevation } from '@blueprintjs/core'
import { RangeControls } from './RangeControls'
import type { SaxsData } from '../types/saxs'
import { ChartCardTitle } from '../styles/shared.styles'
import {
	GuinierCard,
	RangeReadout,
	RangeQ,
	RangeLabel,
	RangeVal,
	RangeUnit,
	RangeArrow,
	RangePts,
	AutoFindButton,
	GuidanceDivider,
	GuidanceTitle,
	GuidanceText,
} from './GuinierFitCard.styles'

interface GuinierFitCardProps {
	activeCurve: SaxsData
	iMin: number
	iMax: number
	lo: number
	hi: number
	onChange: (values: { iMin: number; iMax: number }) => void
	onAutoFind: () => void
}

export function GuinierFitCard({
	activeCurve,
	iMin,
	iMax,
	lo,
	hi,
	onChange,
	onAutoFind,
}: GuinierFitCardProps) {
	return (
		<GuinierCard elevation={Elevation.ONE}>
			<ChartCardTitle>Guinier Fit Range</ChartCardTitle>
			<RangeControls data={activeCurve} iMin={iMin} iMax={iMax} onChange={onChange} />
			<RangeReadout>
				<RangeQ>
					<RangeLabel>q min</RangeLabel>
					<RangeVal>
						{activeCurve.q[lo]?.toFixed(4)}
						<RangeUnit> Å⁻¹</RangeUnit>
					</RangeVal>
				</RangeQ>
				<RangeArrow>→</RangeArrow>
				<RangeQ>
					<RangeLabel>q max</RangeLabel>
					<RangeVal>
						{activeCurve.q[hi]?.toFixed(4)}
						<RangeUnit> Å⁻¹</RangeUnit>
					</RangeVal>
				</RangeQ>
				<RangePts>{hi - lo + 1} pts</RangePts>
			</RangeReadout>
			<AutoFindButton icon='locate' fill onClick={onAutoFind}>
				Auto-find Guinier region
			</AutoFindButton>
			<GuidanceDivider />
			<div>
				<GuidanceTitle>How to use</GuidanceTitle>
				<GuidanceText>
					Drag the handles to select the low-q linear region of the ln I(q) vs q² plot. The fit
					is valid while q·R<sub>g</sub> ≤ 1.3 — valid points are highlighted green in the
					Guinier plot.
				</GuidanceText>
			</div>
		</GuinierCard>
	)
}
