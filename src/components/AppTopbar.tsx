import { Icon } from '@blueprintjs/core'
import { AccountMenu } from './AccountMenu'
import {
	Bar,
	Brand,
	BrandLogo,
	BrandName,
	BarDivider,
	DatasetChip,
	DatasetName,
	DatasetMeta,
	EmptyDataset,
	Spacer,
	Actions,
	BarButton,
	RailToggle,
} from './AppTopbar.styles'

interface Props {
	datasetName: string | null
	frameCount: number
	isSec: boolean
	canAct: boolean
	onExport: () => void
	onSnapshot: () => void
	/** Opens the session rail as a drawer, below the large breakpoint. */
	onToggleSessionRail: () => void
}

export function AppTopbar({
	datasetName,
	frameCount,
	isSec,
	canAct,
	onExport,
	onSnapshot,
	onToggleSessionRail,
}: Props) {
	return (
		<Bar>
			<Brand>
				<BrandLogo
					src={`${import.meta.env.BASE_URL}assets/qtrace-logo.png`}
					alt=''
				/>
				<BrandName>QTrace</BrandName>
			</Brand>

			<BarDivider />

			{datasetName ? (
				<DatasetChip>
					<Icon icon='layers' size={14} color='var(--accent)' />
					<DatasetName title={datasetName}>{datasetName}</DatasetName>
					<DatasetMeta>
						{frameCount} frame{frameCount === 1 ? '' : 's'}
						{isSec ? ' · SEC-SAXS' : ''}
					</DatasetMeta>
				</DatasetChip>
			) : (
				<EmptyDataset>No dataset loaded</EmptyDataset>
			)}

			<Spacer />

			<Actions>
				<RailToggle
					$variant='secondary'
					type='button'
					onClick={onToggleSessionRail}
					aria-label='Show session and snapshots'
					title='Session and snapshots'
				>
					<Icon icon='panel-stats' size={14} />
					<span>Session</span>
				</RailToggle>
				<BarButton
					$variant='secondary'
					type='button'
					onClick={onExport}
					disabled={!canAct}
					aria-label='Export current analysis as CSV'
					title='Export current analysis as CSV'
				>
					<Icon icon='download' size={14} />
					<span>Export</span>
				</BarButton>
				<BarButton
					$variant='primary'
					type='button'
					onClick={onSnapshot}
					disabled={!canAct}
					aria-label='Save a snapshot of the current session'
					title='Save a snapshot of the current session'
				>
					<Icon icon='bookmark' size={14} />
					<span>Snapshot</span>
				</BarButton>
				<BarDivider />
				<AccountMenu />
			</Actions>
		</Bar>
	)
}
