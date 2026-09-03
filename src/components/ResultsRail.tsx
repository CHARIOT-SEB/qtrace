import { useState } from 'react'
import { Icon } from '@blueprintjs/core'
import type { AnalysisInsight } from '../lib/analysisHeuristics'
import type {
	GuinierResult,
	MolecularWeightResult,
	PorodResult,
} from '../types/saxs'
import { color } from '../theme'
import { StatsRow } from './StatsRow'
import { AnalysisInsights } from './AnalysisInsights'
import {
	RailAside,
	RailSection,
	RailSectionHead,
	RailLabel,
	RailDivider,
	RailFooter,
	EmptyNote,
} from '../styles/rail.styles'
import {
	FooterNote,
	SummaryBar,
	SummaryLabel,
	SummaryValue,
	SummaryUnit,
	SummarySpacer,
	SummaryChevron,
	RailBody,
} from './ResultsRail.styles'
import { StatusTag } from './StatsRow.styles'

interface Props {
	result: GuinierResult | null
	pointsUsed: number
	totalPoints: number
	porodResult: PorodResult | null
	mwResult: MolecularWeightResult | null
	insights: AnalysisInsight[]
	className?: string
}

function gradeQRg(qRgMax: number): 'ok' | 'warn' | 'bad' {
	if (!Number.isFinite(qRgMax)) return 'bad'
	if (qRgMax <= 1.3) return 'ok'
	if (qRgMax <= 1.5) return 'warn'
	return 'bad'
}

export function ResultsRail({
	result,
	pointsUsed,
	totalPoints,
	porodResult,
	mwResult,
	insights,
	className,
}: Props) {
	// Phone only - above the breakpoint the body is always shown.
	const [isOpen, setIsOpen] = useState(false)

	const grade = result ? gradeQRg(result.qRgMax) : null
	const issueCount = insights.filter(
		(i) => i.severity === 'error' || i.severity === 'warning',
	).length

	/* Nothing to summarise before a fit exists, and nothing worth expanding
	   into either - so on a phone the whole rail stays out of the way. */
	const hasSomethingToShow = result !== null || insights.length > 0

	return (
		<RailAside $side='right' className={className}>
			{hasSomethingToShow && (
			<SummaryBar
				type='button'
				aria-expanded={isOpen}
				onClick={() => setIsOpen((v) => !v)}
			>
				{result ? (
					<>
						<SummaryLabel>Rg</SummaryLabel>
						<SummaryValue>{result.Rg.toFixed(2)}</SummaryValue>
						<SummaryUnit>Å</SummaryUnit>
						{grade && (
							<StatusTag $kind={grade}>
								{grade === 'ok' ? 'OK' : grade === 'warn' ? 'WARN' : 'BAD'}
							</StatusTag>
						)}
					</>
				) : (
					<SummaryLabel>No fit yet</SummaryLabel>
				)}
				<SummarySpacer />
				{issueCount > 0 && (
					<StatusTag $kind='warn'>
						{issueCount} to check
					</StatusTag>
				)}
				<SummaryChevron $open={isOpen}>
					<Icon icon='chevron-down' size={16} />
				</SummaryChevron>
			</SummaryBar>
			)}

			<RailBody $open={isOpen && hasSomethingToShow}>
				<RailSection>
					<RailSectionHead>
						<RailLabel>Result</RailLabel>
						{result && (
							<Icon icon='tick-circle' size={13} color={color.goodInk} />
						)}
					</RailSectionHead>
					{result ? (
						<StatsRow
							result={result}
							pointsUsed={pointsUsed}
							totalPoints={totalPoints}
							porodResult={porodResult ?? undefined}
							mwResult={mwResult ?? undefined}
						/>
					) : (
						<EmptyNote>
							Rg, I(0) and fit quality appear here once a Guinier range is set.
						</EmptyNote>
					)}
				</RailSection>

				<RailDivider />

				<RailSection style={{ flexGrow: 1, minHeight: 0 }}>
					{insights.length > 0 ? (
						<AnalysisInsights insights={insights} />
					) : (
						<>
							<RailSectionHead>
								<RailLabel>Analysis insights</RailLabel>
							</RailSectionHead>
							<EmptyNote>
								{result
									? 'Nothing to flag — this fit looks clean.'
									: 'QTrace flags the reasons a fit may be wrong — aggregation, repulsion, too few points — and explains each one.'}
							</EmptyNote>
						</>
					)}
				</RailSection>

				{result && (
					<RailFooter>
						<FooterNote>
							Weighted least squares · uncertainties propagated from the fit
							covariance
						</FooterNote>
					</RailFooter>
				)}
			</RailBody>
		</RailAside>
	)
}
