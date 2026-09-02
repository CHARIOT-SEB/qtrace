import { Icon } from '@blueprintjs/core'
import type { AnalysisInsight } from '../lib/analysisHeuristics'
import type { GuinierResult, PorodResult } from '../types/saxs'
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
import { FooterNote } from './ResultsRail.styles'

interface Props {
	result: GuinierResult | null
	pointsUsed: number
	totalPoints: number
	porodResult: PorodResult | null
	insights: AnalysisInsight[]
	className?: string
}

export function ResultsRail({
	result,
	pointsUsed,
	totalPoints,
	porodResult,
	insights,
	className,
}: Props) {
	return (
		<RailAside $side='right' className={className}>
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
		</RailAside>
	)
}
