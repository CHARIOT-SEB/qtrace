import { memo, useState } from 'react'
import { Button, Callout, Card, Elevation, Intent } from '@blueprintjs/core'
import type { AnalysisInsight, InsightSeverity } from '../lib/analysisHeuristics'

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
      <Callout
        intent={toIntent(insight.severity)}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        icon={toIcon(insight.severity) as any}
        className='insight-callout'
      >
        <div className='insight-header'>
          <span className='insight-message'>{insight.message}</span>
          <Button
            minimal
            small
            className='insight-why-btn'
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Less' : 'Why?'}
          </Button>
        </div>
        {/* Plain conditional — no Collapse/useLayoutEffect layout reads */}
        {open && <p className='insight-explanation'>{insight.explanation}</p>}
      </Callout>
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
    <Card elevation={Elevation.ONE} className='insights-card'>
      <div className='insights-header'>
        <span className='chart-card-title' style={{ margin: 0 }}>
          Analysis Insights
        </span>
        {errorCount > 0 && (
          <span className='insights-badge insights-badge--error'>
            {errorCount} issue{errorCount > 1 ? 's' : ''}
          </span>
        )}
        {warnCount > 0 && (
          <span className='insights-badge insights-badge--warning'>
            {warnCount} warning{warnCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </Card>
  )
})
