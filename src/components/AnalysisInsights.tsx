import { memo, useState } from 'react'
import { Elevation, Intent } from '@blueprintjs/core'
import type {
	AnalysisInsight,
	InsightSeverity,
} from '../lib/analysisHeuristics'
import {
	InsightsCard,
	InsightsHeader,
	InsightsTitle,
	InsightsBadge,
	InsightCallout,
	InsightHeader,
	InsightMessage,
	InsightWhyBtn,
	InsightExplanation,
} from './AnalysisInsights.styles'

function toIntent(severity: InsightSeverity): Intent {
	if (severity === 'error') return Intent.DANGER
	if (severity === 'warning') return Intent.WARNING
	return Intent.PRIMARY
}

function toIcon(severity: InsightSeverity): string {
	if (severity === 'error') return 'error'
	if (severity === 'warning') return 'warning-sign'
	return 'info-sign'
}

// Memoised: only re-renders when the insight ID or primary message changes.
const InsightCard = memo(
	function InsightCard({ insight }: { insight: AnalysisInsight }) {
		const [open, setOpen] = useState(false)

		return (
			<InsightCallout
				intent={toIntent(insight.severity)}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				icon={toIcon(insight.severity) as any}
			>
				<InsightHeader>
					<InsightMessage>{insight.message}</InsightMessage>
					<InsightWhyBtn minimal small onClick={() => setOpen((o) => !o)}>
						{open ? 'Less' : 'Why?'}
					</InsightWhyBtn>
				</InsightHeader>
				{/* Plain conditional - no Collapse/useLayoutEffect layout reads */}
				{open && <InsightExplanation>{insight.explanation}</InsightExplanation>}
			</InsightCallout>
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
		<InsightsCard elevation={Elevation.ONE}>
			<InsightsHeader>
				<InsightsTitle>Analysis Insights</InsightsTitle>
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
			</InsightsHeader>
			{insights.map((insight) => (
				<InsightCard key={insight.id} insight={insight} />
			))}
		</InsightsCard>
	)
})
