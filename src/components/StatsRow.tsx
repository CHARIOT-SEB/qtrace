import { memo } from 'react'
import { Elevation, Intent } from '@blueprintjs/core'
import type { GuinierResult, PorodResult } from '../types/saxs'
import {
	StatsGrid,
	StatCard,
	StatLabel,
	StatValue,
	StatUnit,
	StatUncertainty,
	QRgValueRow,
	QRgTag,
} from './StatsRow.styles'

interface Props {
	result: GuinierResult
	pointsUsed: number
	porodResult?: PorodResult
}

function fmt(n: number, d = 2) {
	return Number.isFinite(n) ? n.toFixed(d) : '-'
}

export const StatsRow = memo(function StatsRow({
	result,
	pointsUsed,
	porodResult,
}: Props) {
	const qrgIntent = !Number.isFinite(result.qRgMax)
		? Intent.DANGER
		: result.qRgMax <= 1.3
			? Intent.SUCCESS
			: result.qRgMax <= 1.5
				? Intent.WARNING
				: Intent.DANGER

	return (
		<StatsGrid>
			<StatCard elevation={Elevation.ONE}>
				<StatLabel>Rg</StatLabel>
				<StatValue>
					{fmt(result.Rg, 2)}
					<StatUnit>Å</StatUnit>
				</StatValue>
				{Number.isFinite(result.dRg) && (
					<StatUncertainty>± {fmt(result.dRg, 2)} Å</StatUncertainty>
				)}
			</StatCard>

			<StatCard elevation={Elevation.ONE}>
				<StatLabel>I(0)</StatLabel>
				<StatValue>{fmt(result.I0, 2)}</StatValue>
				{Number.isFinite(result.dI0) && (
					<StatUncertainty>± {fmt(result.dI0, 2)}</StatUncertainty>
				)}
			</StatCard>

			<StatCard elevation={Elevation.ONE}>
				<StatLabel>q · Rg max</StatLabel>
				<StatValue>
					<QRgValueRow>
						{fmt(result.qRgMax, 2)}
						<QRgTag intent={qrgIntent} minimal>
							{qrgIntent === Intent.SUCCESS
								? 'OK'
								: qrgIntent === Intent.WARNING
									? 'WARN'
									: 'BAD'}
						</QRgTag>
					</QRgValueRow>
				</StatValue>
			</StatCard>

			<StatCard elevation={Elevation.ONE}>
				<StatLabel>R²</StatLabel>
				<StatValue>{fmt(result.fit.r2, 4)}</StatValue>
			</StatCard>

			<StatCard elevation={Elevation.ONE}>
				<StatLabel>Points used</StatLabel>
				<StatValue>{pointsUsed}</StatValue>
			</StatCard>

			<StatCard elevation={Elevation.ONE}>
				<StatLabel>Vp</StatLabel>
				<StatValue>
					{porodResult ? fmt(porodResult.porodVolume, 0) : '-'}
					<StatUnit>Å³</StatUnit>
				</StatValue>
			</StatCard>
		</StatsGrid>
	)
})
