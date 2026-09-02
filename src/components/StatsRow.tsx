import { memo } from 'react'
import type { GuinierResult, PorodResult } from '../types/saxs'
import {
	StatsBlock,
	StatsGrid,
	StatCard,
	HeroCard,
	StatLabel,
	HeroLabel,
	StatValueRow,
	StatValue,
	HeroValue,
	StatUnit,
	HeroUnit,
	StatSub,
	HeroSub,
	StatusTag,
} from './StatsRow.styles'

interface Props {
	result: GuinierResult
	pointsUsed: number
	totalPoints?: number
	porodResult?: PorodResult
}

function fmt(n: number, d = 2) {
	return Number.isFinite(n) ? n.toFixed(d) : '-'
}

function fmtInt(n: number) {
	return Number.isFinite(n) ? Math.round(n).toLocaleString() : '-'
}

/** qRg max grades the fit; NaN is unphysical and grades as BAD. */
function gradeQRg(qRgMax: number): 'ok' | 'warn' | 'bad' {
	if (!Number.isFinite(qRgMax)) return 'bad'
	if (qRgMax <= 1.3) return 'ok'
	if (qRgMax <= 1.5) return 'warn'
	return 'bad'
}

export const StatsRow = memo(function StatsRow({
	result,
	pointsUsed,
	totalPoints,
	porodResult,
}: Props) {
	const grade = gradeQRg(result.qRgMax)

	const extrapolated =
		porodResult && porodResult.porodInvariant > 0
			? ((porodResult.qLow + porodResult.qHigh) / porodResult.porodInvariant) *
				100
			: null

	return (
		<StatsBlock>
			<HeroCard>
				<HeroLabel>Radius of gyration</HeroLabel>
				<StatValueRow>
					<HeroValue>{fmt(result.Rg, 2)}</HeroValue>
					<HeroUnit>Å</HeroUnit>
				</StatValueRow>
				{Number.isFinite(result.dRg) && (
					<HeroSub>± {fmt(result.dRg, 2)} Å</HeroSub>
				)}
			</HeroCard>

			<StatsGrid>
				<StatCard>
					<StatLabel>I(0)</StatLabel>
					<StatValueRow>
						<StatValue>{fmt(result.I0, 2)}</StatValue>
					</StatValueRow>
					{Number.isFinite(result.dI0) && (
						<StatSub>± {fmt(result.dI0, 2)}</StatSub>
					)}
				</StatCard>

				<StatCard>
					<StatLabel>q · Rg max</StatLabel>
					<StatValueRow>
						<StatValue>{fmt(result.qRgMax, 2)}</StatValue>
						<StatusTag $kind={grade}>
							{grade === 'ok' ? 'OK' : grade === 'warn' ? 'WARN' : 'BAD'}
						</StatusTag>
					</StatValueRow>
					<StatSub>limit 1.30</StatSub>
				</StatCard>

				<StatCard>
					<StatLabel>R²</StatLabel>
					<StatValueRow>
						<StatValue>{fmt(result.fit.r2, 4)}</StatValue>
					</StatValueRow>
				</StatCard>

				<StatCard>
					<StatLabel>Points used</StatLabel>
					<StatValueRow>
						<StatValue>{pointsUsed}</StatValue>
					</StatValueRow>
					{totalPoints ? <StatSub>of {totalPoints}</StatSub> : null}
				</StatCard>

				<StatCard $span>
					<StatLabel>Porod volume</StatLabel>
					<StatValueRow>
						<StatValue>
							{porodResult ? fmtInt(porodResult.porodVolume) : '-'}
						</StatValue>
						<StatUnit>Å³</StatUnit>
					</StatValueRow>
					{extrapolated !== null && (
						<StatSub
							title={`Flat background ${porodResult!.background.toExponential(2)} fitted from q = ${fmt(porodResult!.backgroundFitQMin, 3)} and removed from the invariant. The measured q range never reaches q → ∞, so the q⁻⁴ tail beyond it is extrapolated.`}
						>
							{fmt(extrapolated, 0)}% extrapolated beyond measured q
						</StatSub>
					)}
				</StatCard>
			</StatsGrid>
		</StatsBlock>
	)
})
