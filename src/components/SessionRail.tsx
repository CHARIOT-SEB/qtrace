import { useRef } from 'react'
import { Button, ButtonVariant, Icon, Spinner } from '@blueprintjs/core'
import type { HistoryEntry, SessionExport } from '../types/history'
import type { CloudSnapshot } from '../lib/api/snapshots'
import { color } from '../theme'
import { readDatFiles } from '../lib/readDatFiles'
import type { SaxsData } from '../types/saxs'
import {
	RailAside,
	RailSection,
	RailSectionHead,
	RailLabel,
	RailDivider,
	RailFooter,
	RailButton,
	EmptyNote,
} from '../styles/rail.styles'
import {
	DatasetCard,
	DatasetTitle,
	DatasetTitleText,
	DatasetFacts,
	LinkButton,
	RegionList,
	RegionRow,
	RegionSwatch,
	RegionBody,
	RegionName,
	RegionValue,
	RegionCount,
	SnapshotGroup,
	SnapshotGroupHead,
	SnapshotRowEl,
	SnapshotIcon,
	SnapshotBody,
	SnapshotName,
	SnapshotMeta,
	SnapshotActions,
	SessionActions,
	SignedOutNote,
	DangerLink,
	HiddenInput,
} from './SessionRail.styles'

export interface CloudPanelProps {
	isConfigured: boolean
	isSignedIn: boolean
	items: CloudSnapshot[]
	isLoading: boolean
	isBusy: boolean
	onRestore: (id: string) => void
	onDelete: (id: string) => void
	/** Upload an existing session snapshot to the account. */
	onUpload: (entry: HistoryEntry) => void
}

function formatTime(ts: number): string {
	return new Date(ts).toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
	})
}

function formatDate(ts: number): string {
	return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short' })
}

interface Props {
	datasetName: string | null
	frameCount: number
	isSec: boolean
	qMin: number | null
	qMax: number | null
	bufferRange: [number, number]
	signalRange: [number, number]
	entries: HistoryEntry[]
	activeId: string | null
	cloud: CloudPanelProps
	onRestore: (id: string) => void
	onExportSession: () => void
	onImportSession: (data: SessionExport) => void
	onClearSession: () => void
	onLoadFiles: (data: SaxsData[]) => void
	onFileError: (msg: string) => void
	onReadStart: (total: number) => void
	onReadProgress: (done: number, total: number) => void
	className?: string
}

export function SessionRail({
	datasetName,
	frameCount,
	isSec,
	qMin,
	qMax,
	bufferRange,
	signalRange,
	entries,
	activeId,
	cloud,
	onRestore,
	onExportSession,
	onImportSession,
	onClearSession,
	onLoadFiles,
	onFileError,
	onReadStart,
	onReadProgress,
	className,
}: Props) {
	const fileRef = useRef<HTMLInputElement>(null)
	const hasData = frameCount > 0
	const namedEntries = entries.filter((e) => e.isNamed)

	function handleImportClick() {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = '.json'
		input.onchange = () => {
			const file = input.files?.[0]
			if (!file) return
			const reader = new FileReader()
			reader.onload = (e) => {
				try {
					onImportSession(
						JSON.parse(e.target?.result as string) as SessionExport,
					)
				} catch {
					onFileError('That file is not a QTrace session export.')
				}
			}
			reader.readAsText(file)
		}
		input.click()
	}

	return (
		<RailAside $side='left' className={className}>
			<RailSection>
				<RailSectionHead>
					<RailLabel>Dataset</RailLabel>
				</RailSectionHead>
				{hasData ? (
					<DatasetCard>
						<DatasetTitle>
							<Icon icon='layers' size={14} color={color.accent} />
							<DatasetTitleText title={datasetName ?? undefined}>
								{datasetName ?? 'Loaded frames'}
							</DatasetTitleText>
						</DatasetTitle>
						<DatasetFacts>
							<span>
								{frameCount} frame{frameCount === 1 ? '' : 's'}
							</span>
							<span aria-hidden>·</span>
							<span>{isSec ? 'SEC-SAXS' : 'Single curve'}</span>
							{qMin !== null && qMax !== null && (
								<>
									<span aria-hidden>·</span>
									<span>
										q {qMin.toFixed(3)}–{qMax.toFixed(2)} Å⁻¹
									</span>
								</>
							)}
						</DatasetFacts>
						<LinkButton
							type='button'
							onClick={() => fileRef.current?.click()}
						>
							Replace files
						</LinkButton>
					</DatasetCard>
				) : (
					<EmptyNote>Nothing loaded yet.</EmptyNote>
				)}
				<HiddenInput
					ref={fileRef}
					type='file'
					accept='.dat,.txt,.csv'
					multiple
					onChange={(e) => {
						if (e.target.files)
							readDatFiles(e.target.files, {
								onLoad: onLoadFiles,
								onError: onFileError,
								onReadStart,
								onReadProgress,
							})
						e.target.value = ''
					}}
				/>
			</RailSection>

			{isSec && (
				<RailSection>
					<RailSectionHead>
						<RailLabel>Frame selection</RailLabel>
					</RailSectionHead>
					<RegionList>
						{(
							[
								['Buffer', color.selBuffer, bufferRange],
								['Signal', color.selSignal, signalRange],
							] as const
						).map(([name, swatch, [lo, hi]]) => (
							<RegionRow key={name}>
								<RegionSwatch $color={swatch} />
								<RegionBody>
									<RegionName>{name}</RegionName>
									<RegionValue>
										{lo} – {hi}
									</RegionValue>
								</RegionBody>
								<RegionCount>
									{Math.max(0, hi - lo + 1)} frames
								</RegionCount>
							</RegionRow>
						))}
					</RegionList>
				</RailSection>
			)}

			<RailDivider />

			<RailSection style={{ flexGrow: 1, minHeight: 0 }}>
				<RailSectionHead>
					<RailLabel>Snapshots</RailLabel>
					<SessionActions>
						<RailButton
							type='button'
							onClick={onExportSession}
							disabled={entries.length === 0}
							title='Export this session as JSON'
						>
							<Icon icon='export' size={12} />
							Export
						</RailButton>
						<RailButton
							type='button'
							onClick={handleImportClick}
							title='Import a session JSON'
						>
							<Icon icon='import' size={12} />
							Import
						</RailButton>
					</SessionActions>
				</RailSectionHead>

				{cloud.isConfigured && (
					<SnapshotGroup>
						<SnapshotGroupHead>
							<SnapshotIcon $cloud>
								<Icon icon='cloud' size={13} />
							</SnapshotIcon>
							Saved to account
							{cloud.isLoading && <Spinner size={11} />}
						</SnapshotGroupHead>
						{!cloud.isSignedIn ? (
							<SignedOutNote>
								Sign in to keep snapshots between sessions.
							</SignedOutNote>
						) : cloud.items.length === 0 ? (
							<SignedOutNote>No snapshots saved yet.</SignedOutNote>
						) : (
							cloud.items.map((item) => (
								<SnapshotRowEl
									key={item.id}
									role='button'
									tabIndex={0}
									onClick={() => cloud.onRestore(item.id)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault()
											cloud.onRestore(item.id)
										}
									}}
								>
									<SnapshotIcon $cloud>
										<Icon icon='cloud' size={14} />
									</SnapshotIcon>
									<SnapshotBody>
										<SnapshotName title={item.name}>{item.name}</SnapshotName>
										<SnapshotMeta>
											{formatDate(item.createdAt)}
											{item.frameCount ? ` · ${item.frameCount} frames` : ''}
										</SnapshotMeta>
									</SnapshotBody>
									<SnapshotActions data-row-actions>
										<Button
											variant={ButtonVariant.MINIMAL}
											icon='trash'
											size='small'
											disabled={cloud.isBusy}
											aria-label={`Delete ${item.name}`}
											onClick={(e) => {
												e.stopPropagation()
												cloud.onDelete(item.id)
											}}
										/>
									</SnapshotActions>
								</SnapshotRowEl>
							))
						)}
					</SnapshotGroup>
				)}

				<SnapshotGroup style={{ marginTop: cloud.isConfigured ? 12 : 0 }}>
					<SnapshotGroupHead>This session only</SnapshotGroupHead>
					{namedEntries.length === 0 ? (
						<SignedOutNote>
							Nothing saved yet — use Snapshot to keep the current fit.
						</SignedOutNote>
					) : (
						namedEntries.map((entry) => (
							<SnapshotRowEl
								key={entry.id}
								$active={entry.id === activeId}
								role='button'
								tabIndex={0}
								onClick={() => onRestore(entry.id)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault()
										onRestore(entry.id)
									}
								}}
							>
								<SnapshotIcon>
									<Icon icon='bookmark' size={14} />
								</SnapshotIcon>
								<SnapshotBody>
									<SnapshotName
										$active={entry.id === activeId}
										title={entry.name ?? entry.label}
									>
										{entry.name ?? entry.label}
									</SnapshotName>
									<SnapshotMeta>{formatTime(entry.timestamp)}</SnapshotMeta>
								</SnapshotBody>
								{cloud.isSignedIn && (
									<SnapshotActions data-row-actions>
										<Button
											variant={ButtonVariant.MINIMAL}
											icon='cloud-upload'
											size='small'
											disabled={cloud.isBusy}
											aria-label={`Save ${entry.name ?? entry.label} to account`}
											onClick={(e) => {
												e.stopPropagation()
												cloud.onUpload(entry)
											}}
										/>
									</SnapshotActions>
								)}
							</SnapshotRowEl>
						))
					)}
				</SnapshotGroup>
			</RailSection>

			<RailFooter>
				<DangerLink
					type='button'
					onClick={onClearSession}
					disabled={!hasData}
				>
					<Icon icon='trash' size={13} />
					Clear session
				</DangerLink>
			</RailFooter>
		</RailAside>
	)
}
