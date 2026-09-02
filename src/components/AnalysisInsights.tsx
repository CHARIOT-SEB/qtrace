import { memo, useState } from 'react'
import { Icon, type IconName } from '@blueprintjs/core'
import type {
	AnalysisInsight,
	InsightSeverity,
} from '../lib/analysisHeuristics'
import { RailLabel } from '../styles/rail.styles'
import {
	InsightsList,
	InsightsHeader,
	InsightsBadges,
	InsightsBadge,
	InsightBox,
	InsightHeader,
	InsightIcon,
	InsightMessage,
	InsightWhyBtn,
	InsightExplanation,
} from './AnalysisInsights.styles'

function toIcon(severity: InsightSeverity): IconName {
	if (severity === 'error') return 'error'
	if (severity === 'warning') return 'warning-sign'
	return 'info-sign'
}

// Memoised: only re-renders when the insight ID or primary message changes.
const InsightCard = memo(
	function InsightCard({ insight }: { insight: AnalysisInsight }) {
		const [open, setOpen] = useState(false)
		const severity = insight.severity

		return (
			<InsightBox $severity={severity}>
				<InsightHeader>
					<InsightIcon $severity={severity}>
						<Icon icon={toIcon(severity)} size={14} />
					</InsightIcon>
					<InsightMessage>{insight.message}</InsightMessage>
				</InsightHeader>
				{/* Plain conditional - no Collapse/useLayoutEffect layout reads */}
				{open ? (
					<InsightExplanation $severity={severity}>
						{insight.explanation}
					</InsightExplanation>
				) : null}
				<InsightWhyBtn
					type='button'
					$severity={severity}
					aria-expanded={open}
					onClick={() => setOpen((o) => !o)}
				>
					{open ? 'Less' : 'Why?'}
				</InsightWhyBtn>
			</InsightBox>
		)
	},
	(prev, next) =>
		prev.insight.id === next.insight.id &&
		prev.insight.message === next.insight.message,
)

interface Props {
	insights: AnalysisInsight[]
}

// Memoised so the deferred-value pattern in App can skip this component during
// the urgent chart-update render and defer it to a subsequent background pass.
export const AnalysisInsights = memo(function AnalysisInsights({
	insights,
}: Props) {
	if (insights.length === 0) return null

	const errorCount = insights.filter((i) => i.severity === 'error').length
	const warnCount = insights.filter((i) => i.severity === 'warning').length

	return (
		<>
			<InsightsHeader>
				<RailLabel>Analysis insights</RailLabel>
				<InsightsBadges>
					{errorCount > 0 && (
						<InsightsBadge $variant='error'>
							{errorCount} issue{errorCount > 1 ? 's' : ''}
						</InsightsBadge>
					)}
					{warnCount > 0 && (
						<InsightsBadge $variant='warning'>
							{warnCount} warning{warnCount > 1 ? 's' : ''}
						</InsightsBadge>
					)}
				</InsightsBadges>
			</InsightsHeader>
			<InsightsList>
				{insights.map((insight) => (
					<InsightCard key={insight.id} insight={insight} />
				))}
			</InsightsList>
		</>
	)
})
