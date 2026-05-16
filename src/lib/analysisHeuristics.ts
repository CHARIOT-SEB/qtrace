import type { GuinierResult, SaxsData } from '../types/saxs'

export type InsightSeverity = 'info' | 'warning' | 'error'

export interface AnalysisInsight {
  id: string
  severity: InsightSeverity
  message: string
  explanation: string
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function computeResiduals(result: GuinierResult): number[] {
  return result.xs.map(
    (x, i) => result.ys[i] - (result.fit.slope * x + result.fit.intercept),
  )
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

// ── Heuristic functions ───────────────────────────────────────────────────────

function checkQRgValidity(result: GuinierResult): AnalysisInsight[] {
  const { qRgMax } = result

  if (!Number.isFinite(qRgMax)) {
    return [
      {
        id: 'qrg-invalid',
        severity: 'error',
        message:
          'q·Rg could not be calculated — the Guinier slope may be positive, which is physically unrealistic.',
        explanation:
          'A valid Rg requires a negative slope in the Guinier plot (ln I vs q²). A positive slope typically means the selected fit range does not contain a genuine Guinier region. Try moving the range to lower q values where the scattering curve begins to plateau.',
      },
    ]
  }

  if (qRgMax > 1.5) {
    return [
      {
        id: 'qrg-high-error',
        severity: 'error',
        message: `Guinier fit extends well beyond the q·Rg < 1.3 validity limit (q·Rg max = ${qRgMax.toFixed(2)}) — Rg may be significantly overestimated.`,
        explanation:
          'The Guinier approximation (ln I ≈ ln I₀ − Rg²q²/3) holds only at low q where q·Rg ≲ 1.3 for compact, globular particles. At larger q·Rg, higher-order terms become important and cause systematic overestimation of Rg. Reducing the upper bound of the fit range is strongly recommended.',
      },
    ]
  }

  if (qRgMax > 1.3) {
    return [
      {
        id: 'qrg-high-warn',
        severity: 'warning',
        message: `Guinier region exceeds the ideal q·Rg limit (${qRgMax.toFixed(2)} > 1.3) — Rg may be slightly overestimated.`,
        explanation:
          'A q·Rg up to 1.3 is generally accepted for globular proteins, though some practitioners apply a stricter limit of 1.0. Slightly exceeding 1.3 introduces a modest systematic error. For elongated or flexible particles an even tighter upper limit may be more appropriate.',
      },
    ]
  }

  if (qRgMax < 0.5) {
    return [
      {
        id: 'qrg-low',
        severity: 'info',
        message: `Fit range covers a very narrow q·Rg window (max = ${qRgMax.toFixed(2)}) — extending the upper bound may improve the Rg estimate.`,
        explanation:
          'Using only the lowest q points (q·Rg < 0.5) limits the statistical robustness of the Rg estimate. Extending towards q·Rg ≈ 1.0–1.3 — provided the data remains linear — typically yields a more stable result with lower statistical uncertainty.',
      },
    ]
  }

  return []
}

function checkFitQuality(result: GuinierResult): AnalysisInsight[] {
  const insights: AnalysisInsight[] = []
  const { r2 } = result.fit
  const n = result.xs.length

  if (n < 5) {
    insights.push({
      id: 'points-critical',
      severity: 'error',
      message: `Only ${n} point${n !== 1 ? 's' : ''} contributed to the Guinier fit — reliability is very low.`,
      explanation:
        'Fewer than 5 valid data points make the fit highly sensitive to individual measurements and noise. At least 8–10 points spanning the Guinier region are generally recommended for a statistically meaningful result. Expand the range or verify that intensities in the selected region are positive.',
    })
  } else if (n < 10) {
    insights.push({
      id: 'points-low',
      severity: 'warning',
      message: `${n} points used — a wider fit range may produce a more robust Rg estimate.`,
      explanation:
        'Using at least 10–20 data points generally provides more stable and reproducible Rg values, as the linear regression becomes less sensitive to individual noisy measurements. Consider widening the fit window if the data remains linear in that region.',
    })
  }

  if (r2 < 0.9) {
    insights.push({
      id: 'r2-poor',
      severity: 'error',
      message: `Poor Guinier fit quality (R² = ${r2.toFixed(4)}) — data may not follow ideal Guinier behaviour in this range.`,
      explanation:
        'A low R² indicates significant scatter around the fitted line. Possible causes include: the range extending beyond the valid Guinier region, aggregation causing an upturn at low q, poor buffer subtraction, or genuine non-Guinier scattering from polydisperse or flexible samples. Examining the residuals plot may help identify the source.',
    })
  } else if (r2 < 0.97) {
    insights.push({
      id: 'r2-moderate',
      severity: 'warning',
      message: `Moderate Guinier fit quality (R² = ${r2.toFixed(4)}) — results should be interpreted with caution.`,
      explanation:
        'An R² below 0.97 may indicate mild systematic deviations from linearity. This can arise from subtly incorrect fit boundaries, mild aggregation, or elevated noise. Examining the residuals plot for curvature or systematic trends may help narrow down the cause.',
    })
  }

  return insights
}

function checkResidualPatterns(result: GuinierResult): AnalysisInsight[] {
  const insights: AnalysisInsight[] = []
  const resid = computeResiduals(result)
  const n = resid.length
  if (n < 4) return insights

  const third = Math.max(1, Math.floor(n / 3))
  const firstMean = mean(resid.slice(0, third))
  const midMean = mean(resid.slice(third, 2 * third))
  const lastMean = mean(resid.slice(2 * third))

  // Positive low-q residuals suggest aggregation (upturn above the fitted line)
  if (firstMean > 0.025 && firstMean > midMean + 0.015) {
    insights.push({
      id: 'residual-aggregation',
      severity: 'warning',
      message:
        'Residual curvature may indicate aggregation — low-q intensities appear elevated above the fitted line.',
      explanation:
        'Aggregation typically produces an upward curvature in the Guinier plot: the lowest-q points sit above the linear model (positive residuals), leading to an overestimated Rg. Moving the lower fit boundary to exclude the very lowest q points may help. Sample concentration, preparation method, and storage conditions are common contributing factors.',
    })
  }

  // Negative high-q residuals suggest the fit extends beyond the Guinier region
  if (lastMean < -0.025 && lastMean < midMean - 0.015) {
    insights.push({
      id: 'residual-high-q',
      severity: 'warning',
      message:
        'Residuals suggest the fit range may extend beyond the ideal Guinier region — high-q intensities appear below the fitted line.',
      explanation:
        'When the fit range extends too far, the data falls off faster than the Guinier approximation predicts, producing negative residuals at the high-q end. Reducing the upper fit boundary towards q·Rg ≈ 1.0–1.3 typically corrects this systematic deviation.',
    })
  }

  // Symmetric curvature (U-shape or inverted-U in residuals)
  const curvature = midMean - (firstMean + lastMean) / 2
  const meanAbs = mean(resid.map(Math.abs))
  if (Math.abs(curvature) > 0.035 && meanAbs > 0.02) {
    insights.push({
      id: 'residual-curvature',
      severity: 'warning',
      message:
        'Residuals show possible systematic curvature — this may suggest non-ideal Guinier behaviour in the selected range.',
      explanation:
        'A curved pattern in the residuals (rather than random scatter around zero) suggests the scattering does not follow the expected linear Guinier law in this region. This can arise from polydispersity, a mixture of species, partial unfolding, or an incorrectly positioned fit range. The Kratky plot below may provide additional context about the structural character of the sample.',
    })
  }

  return insights
}

function checkLowQInstability(data: SaxsData, iMin: number): AnalysisInsight[] {
  const insights: AnalysisInsight[] = []
  const checkEnd = Math.min(iMin, 6, data.q.length)
  if (checkEnd === 0) return insights

  let negCount = 0
  let highNoiseCount = 0
  for (let i = 0; i < checkEnd; i++) {
    if (data.I[i] <= 0) {
      negCount++
    } else if (data.err[i] > 0 && data.err[i] / data.I[i] > 0.3) {
      highNoiseCount++
    }
  }

  if (negCount > 0) {
    insights.push({
      id: 'lowq-negative',
      severity: 'warning',
      message:
        'Low-q region may contain beamstop artefacts — negative or zero intensities detected near q = 0.',
      explanation:
        'Negative intensities at very low q often arise from beamstop shadow contamination, over-subtraction of the buffer, or detector artefacts near the direct beam. These points are correctly excluded from the Guinier fit but may signal broader data quality issues worth reviewing in the raw and subtracted curves.',
    })
  } else if (highNoiseCount >= 2) {
    insights.push({
      id: 'lowq-noisy',
      severity: 'info',
      message:
        'Low-q region appears noisy before the fit start — relative errors are elevated near q = 0.',
      explanation:
        'A high relative error (err/I > 30%) at very low q is common near the beamstop and does not necessarily invalidate the analysis, provided the fit range starts where the signal-to-noise ratio improves sufficiently.',
    })
  }

  return insights
}

function checkDataQualityInFitRange(
  data: SaxsData,
  iMin: number,
  iMax: number,
): AnalysisInsight[] {
  const insights: AnalysisInsight[] = []
  let negCount = 0
  let highNoiseCount = 0
  let total = 0

  for (let i = iMin; i <= iMax && i < data.q.length; i++) {
    total++
    if (data.I[i] <= 0) {
      negCount++
    } else if (data.err[i] > 0 && data.err[i] / data.I[i] > 0.2) {
      highNoiseCount++
    }
  }

  if (negCount > 0) {
    insights.push({
      id: 'fit-range-negative',
      severity: 'error',
      message: `${negCount} point${negCount > 1 ? 's' : ''} within the Guinier fit range ${negCount > 1 ? 'have' : 'has'} non-positive intensity and ${negCount > 1 ? 'were' : 'was'} excluded from the fit.`,
      explanation:
        'The Guinier analysis requires computing ln I(q), which is undefined for I(q) ≤ 0. Negative or zero intensities within the fit range — often caused by over-subtraction of the buffer — reduce the effective number of points and can bias the result. Adjusting the buffer selection or shifting the fit range may help.',
    })
  } else if (total > 0 && highNoiseCount > total / 2) {
    insights.push({
      id: 'fit-range-noisy',
      severity: 'warning',
      message:
        'Most points in the Guinier fit range appear to have high relative error — signal quality may be limiting.',
      explanation:
        'A high relative error (err/I > 20%) across the majority of the fit range indicates a low signal-to-noise ratio. This is more common for dilute samples, short exposure times, or after aggressive background subtraction. Additional frame averaging or longer data collection may improve data quality.',
    })
  }

  return insights
}

function checkKratkyShape(data: SaxsData): AnalysisInsight[] {
  const insights: AnalysisInsight[] = []
  const pts = data.q
    .map((q, i) => q * q * data.I[i])
    .filter(Number.isFinite)

  if (pts.length < 10) return insights

  const peakIdx = pts.reduce((best, v, i) => (v > pts[best] ? i : best), 0)
  const peakFrac = peakIdx / pts.length
  const peakVal = pts[peakIdx]

  const tailStart = Math.floor(pts.length * 0.75)
  const tailMean = mean(pts.slice(tailStart))

  if (tailMean > peakVal * 0.8) {
    insights.push({
      id: 'kratky-elevated-tail',
      severity: 'info',
      message:
        'Kratky plot tail appears elevated — this may suggest partial unfolding or intrinsic disorder.',
      explanation:
        'A well-folded globular protein typically shows a bell-shaped Kratky profile: q²·I rises to a clear peak then decreases. A flat or rising tail at high q may suggest conformational flexibility, partial unfolding, or a mixture of folded and disordered species. This is a qualitative observation and should be considered alongside the Guinier results and sample preparation history.',
    })
  }

  if (peakFrac > 0.65 && peakVal > 0) {
    insights.push({
      id: 'kratky-late-peak',
      severity: 'info',
      message:
        'Kratky peak appears at relatively high q — the data range may not fully capture the Guinier region.',
      explanation:
        'For typical globular proteins the Kratky peak occurs in the low-to-mid q range. A peak appearing in the upper portion of the q range may indicate a small particle, or that data collection started too late to capture the full Guinier plateau needed for a reliable Rg.',
    })
  }

  return insights
}

function checkOverallQuality(
  result: GuinierResult,
  priorInsights: AnalysisInsight[],
): AnalysisInsight[] {
  const hasError = priorInsights.some((i) => i.severity === 'error')
  const hasWarning = priorInsights.some((i) => i.severity === 'warning')
  if (hasError || hasWarning) return []

  const { r2 } = result.fit
  const { qRgMax } = result
  const n = result.xs.length

  if (
    Number.isFinite(qRgMax) &&
    qRgMax >= 0.5 &&
    qRgMax <= 1.3 &&
    r2 >= 0.97 &&
    n >= 10
  ) {
    return [
      {
        id: 'overall-ok',
        severity: 'info',
        message:
          'Data quality appears suitable for Guinier analysis — no major concerns detected.',
        explanation:
          'The current fit satisfies standard Guinier validity criteria: q·Rg is within the accepted range, fit quality (R²) is high, sufficient points are used, and no systematic residual patterns are apparent. The derived Rg and I(0) values appear reliable under these conditions.',
      },
    ]
  }

  return []
}

// ── Master export ─────────────────────────────────────────────────────────────

export function collectInsights(
  data: SaxsData,
  result: GuinierResult,
): AnalysisInsight[] {
  const raw = [
    ...checkQRgValidity(result),
    ...checkFitQuality(result),
    ...checkResidualPatterns(result),
    ...checkLowQInstability(data, result.iMin),
    ...checkDataQualityInFitRange(data, result.iMin, result.iMax),
    ...checkKratkyShape(data),
  ]

  const quality = checkOverallQuality(result, raw)
  const all = [...raw, ...quality]

  const order: Record<InsightSeverity, number> = { error: 0, warning: 1, info: 2 }
  return all.sort((a, b) => order[a.severity] - order[b.severity])
}
