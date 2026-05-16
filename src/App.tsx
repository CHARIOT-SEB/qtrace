import {
	useCallback,
	useDeferredValue,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from 'react'
import {
	Alignment,
	Button,
	ButtonGroup,
	ButtonVariant,
	Callout,
	Card,
	Divider,
	Elevation,
	Navbar,
	NonIdealState,
	Tag,
} from '@blueprintjs/core'
import { FileDropZone } from './components/FileDropZone'
import {
	ProcessingModal,
	INITIAL_MODAL_STATE,
	type ModalState,
} from './components/ProcessingModal'
import { SnapshotModal } from './components/SnapshotModal'
import { FullCurveChart } from './components/FullCurveChart'
import { GuinierChart } from './components/GuinierChart'
import { HistoryPanel } from './components/HistoryPanel'
import { KratkyChart } from './components/KratkyChart'
import { RangeControls } from './components/RangeControls'
import { ResidualsChart } from './components/ResidualsChart'
import { SecTrace } from './components/SecTrace'
import { StatsRow } from './components/StatsRow'
import { AnalysisInsights } from './components/AnalysisInsights'
import { autoFindGuinierRegion, computeGuinier } from './lib/guinier'
import { collectInsights } from './lib/analysisHeuristics'
import { autoDetectRegions, averageFrames, subtractBuffer } from './lib/secSaxs'
import { generateSampleSecFrames } from './lib/sampleData'
import { historyReducer, initialHistoryState } from './lib/historyReducer'
import type { SaxsData } from './types/saxs'
import type { SessionExport } from './types/history'

export function App() {
	const [frames, setFrames] = useState<SaxsData[]>([])
	const [bufferRange, setBufferRange] = useState<[number, number]>([0, 0])
	const [signalRange, setSignalRange] = useState<[number, number]>([0, 0])
	const [iMin, setIMin] = useState(2)
	const [iMax, setIMax] = useState(20)
	const [error, setError] = useState<string | null>(null)
	const [hoveredQ, setHoveredQ] = useState<number | null>(null)
	const [isHistoryOpen, setIsHistoryOpen] = useState(false)

	const [isSavingSnapshot, setIsSavingSnapshot] = useState(false)
	const [snapshotName, setSnapshotName] = useState('')
	const [modal, setModal] = useState<ModalState>(INITIAL_MODAL_STATE)

	const [history, dispatchHistory] = useReducer(
		historyReducer,
		initialHistoryState,
	)

	// Prevents the filename-change effect from resetting Guinier range during restore.
	const skipGuinierResetRef = useRef(false)

	const handleHoverQ = useCallback((q: number | null) => setHoveredQ(q), [])

	const isSec = frames.length > 1
	const lo = Math.min(iMin, iMax)
	const hi = Math.max(iMin, iMax)

	const deferredLo = useDeferredValue(lo)
	const deferredHi = useDeferredValue(hi)

	const bufferCurve = useMemo(() => {
		if (!isSec) return null
		const slice = frames.slice(bufferRange[0], bufferRange[1] + 1)
		return slice.length > 0 ? averageFrames(slice) : null
	}, [frames, bufferRange, isSec])

	const signalCurve = useMemo(() => {
		if (!isSec) return null
		const slice = frames.slice(signalRange[0], signalRange[1] + 1)
		return slice.length > 0 ? averageFrames(slice) : null
	}, [frames, signalRange, isSec])

	const subtractedCurve = useMemo(
		() =>
			signalCurve && bufferCurve
				? subtractBuffer(signalCurve, bufferCurve)
				: null,
		[signalCurve, bufferCurve],
	)

	const activeCurve: SaxsData | null = isSec
		? subtractedCurve
		: (frames[0] ?? null)

	const guinierResult = useMemo(
		() =>
			activeCurve ? computeGuinier(activeCurve, deferredLo, deferredHi) : null,
		[activeCurve, deferredLo, deferredHi],
	)

	const rawInsights = useMemo(
		() =>
			activeCurve && guinierResult
				? collectInsights(activeCurve, guinierResult)
				: [],
		[activeCurve, guinierResult],
	)
	const insights = useDeferredValue(rawInsights)

	useEffect(() => {
		if (!activeCurve) return
		if (skipGuinierResetRef.current) {
			skipGuinierResetRef.current = false
			return
		}
		setIMin(2)
		setIMax(Math.min(20, activeCurve.q.length - 1))
	}, [activeCurve?.filename])

	// ── Snapshot save ────────────────────────────────────────────────────

	function handleSaveSnapshot() {
		const name = snapshotName.trim()
		if (!name) return
		dispatchHistory({
			type: 'push',
			entry: {
				id: crypto.randomUUID(),
				timestamp: Date.now(),
				actionType: 'named_snapshot',
				label: name,
				params: {},
				snapshot: { frames, bufferRange, signalRange, iMin, iMax },
				isNamed: true,
				name,
			},
		})
		setSnapshotName('')
		setIsSavingSnapshot(false)
		if (!isHistoryOpen) setIsHistoryOpen(true)
	}

	function cancelSnapshot() {
		setIsSavingSnapshot(false)
		setSnapshotName('')
	}

	// ── Snapshot restore ─────────────────────────────────────────────────

	function handleRestore(id: string) {
		const entry = history.entries.find((e) => e.id === id)
		if (!entry) return
		const { snapshot } = entry
		skipGuinierResetRef.current = true
		setFrames(snapshot.frames)
		setBufferRange(snapshot.bufferRange)
		setSignalRange(snapshot.signalRange)
		setIMin(snapshot.iMin)
		setIMax(snapshot.iMax)
		dispatchHistory({ type: 'restore', id })
	}

	// ── Session export/import ────────────────────────────────────────────

	function handleExportSession() {
		if (history.entries.length === 0) return
		const latestFrames =
			history.entries[history.entries.length - 1].snapshot.frames
		const exportData: SessionExport = {
			version: 1,
			exportedAt: new Date().toISOString(),
			frames: latestFrames,
			entries: history.entries.map(({ snapshot, ...rest }) => ({
				...rest,
				bufferRange: snapshot.bufferRange,
				signalRange: snapshot.signalRange,
				iMin: snapshot.iMin,
				iMax: snapshot.iMax,
			})),
		}
		const blob = new Blob([JSON.stringify(exportData, null, 2)], {
			type: 'application/json',
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `scatter-session-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
		a.click()
		URL.revokeObjectURL(url)
	}

	function handleImportSession(data: SessionExport) {
		if (
			data.version !== 1 ||
			!Array.isArray(data.frames) ||
			!Array.isArray(data.entries)
		) {
			setError('Invalid session file — unrecognised format.')
			return
		}
		const reconstructed = data.entries.map((e) => ({
			id: e.id,
			timestamp: e.timestamp,
			actionType: e.actionType,
			label: e.label,
			params: e.params,
			isNamed: e.isNamed,
			name: e.name,
			snapshot: {
				frames: data.frames,
				bufferRange: e.bufferRange,
				signalRange: e.signalRange,
				iMin: e.iMin,
				iMax: e.iMax,
			},
		}))

		const last = reconstructed[reconstructed.length - 1]
		if (!last) return

		dispatchHistory({ type: 'set', entries: reconstructed, activeId: last.id })
		skipGuinierResetRef.current = true
		setFrames(last.snapshot.frames)
		setBufferRange(last.snapshot.bufferRange)
		setSignalRange(last.snapshot.signalRange)
		setIMin(last.snapshot.iMin)
		setIMax(last.snapshot.iMax)
		setError(null)
		setIsHistoryOpen(true)
	}

	// ── Data loading ─────────────────────────────────────────────────────

	async function loadFrames(newFrames: SaxsData[], fromSample = false) {
		const tick = (ms = 50) => new Promise<void>((r) => setTimeout(r, ms))

		if (fromSample) {
			setModal({
				isOpen: true,
				status: 'processing',
				stageIndex: 1,
				frameCount: newFrames.length,
				parsedCount: newFrames.length,
			})
			await tick(120)
		}

		try {
			setModal((s) => ({ ...s, stageIndex: 2 }))
			await tick(40)

			let br: [number, number] = [0, 0]
			let sr: [number, number] = [0, 0]
			if (newFrames.length > 1) {
				const regions = autoDetectRegions(newFrames)
				br = regions.bufferRange
				sr = regions.signalRange
			}
			const newIMin = 2
			const newIMax = Math.min(20, (newFrames[0]?.q.length ?? 21) - 1)

			setModal((s) => ({ ...s, stageIndex: 3 }))
			await tick(40)

			setModal((s) => ({ ...s, stageIndex: 4 }))
			await tick(40)

			setFrames(newFrames)
			setError(null)
			setBufferRange(br)
			setSignalRange(sr)
			setIMin(newIMin)
			setIMax(newIMax)
			setIsSavingSnapshot(false)
			setSnapshotName('')
			dispatchHistory({ type: 'clear' })

			setModal((s) => ({ ...s, stageIndex: 5 }))
			await tick(180)

			setModal((s) => ({ ...s, status: 'success' }))
		} catch {
			setModal((s) => ({
				...s,
				status: 'error',
				errorMessage: 'An unexpected error occurred during processing.',
			}))
		}
	}

	function handleReadStart(total: number) {
		setModal({
			isOpen: true,
			status: 'processing',
			stageIndex: 0,
			frameCount: total,
			parsedCount: 0,
		})
	}

	function handleReadProgress(done: number, total: number) {
		setModal((s) => ({
			...s,
			stageIndex: done > 0 ? 1 : 0,
			parsedCount: done,
			frameCount: total,
		}))
	}

	function handleFileError(msg: string) {
		setError(msg)
		setModal((s) =>
			s.isOpen ? { ...s, status: 'error', errorMessage: msg } : s,
		)
	}

	function handleViewAnalysis() {
		setModal((s) => ({ ...s, isOpen: false }))
	}

	function handleRetry() {
		setModal(INITIAL_MODAL_STATE)
	}

	function handleDismiss() {
		setModal(INITIAL_MODAL_STATE)
	}

	function handleAutoFind() {
		if (!activeCurve) return
		const region = autoFindGuinierRegion(activeCurve)
		if (region) {
			setIMin(region.start)
			setIMax(region.end)
		}
	}

	function handleClear() {
		setFrames([])
		setError(null)
		setBufferRange([0, 0])
		setSignalRange([0, 0])
		setIMin(2)
		setIMax(20)
		setIsSavingSnapshot(false)
		setSnapshotName('')
		dispatchHistory({ type: 'clear' })
	}

	return (
		<div className='app-root bp6-light'>
			{/* ── Navbar ─────────────────────────────────────────── */}
			<Navbar>
				<Navbar.Group align={Alignment.LEFT}>
					<Navbar.Heading className='app-navbar-heading'>
						<sup>Q</sup>Trace
					</Navbar.Heading>
					<Navbar.Divider />
					<span className='bp6-text-muted' style={{ fontSize: 13 }}>
						SEC-SAXS Analysis
					</span>
				</Navbar.Group>
				<Navbar.Group align={Alignment.RIGHT}>
					{frames.length > 0 && (
						<Tag minimal style={{ marginRight: 8 }}>
							{frames.length} frame{frames.length !== 1 ? 's' : ''} loaded
						</Tag>
					)}
					<Button
						variant={ButtonVariant.MINIMAL}
						icon='history'
						active={isHistoryOpen}
						onClick={() => setIsHistoryOpen((v) => !v)}
						style={{ color: 'var(--c5)' }}
					>
						Snapshots
					</Button>
				</Navbar.Group>
			</Navbar>

			{/* ── Body (content + optional snapshot sidebar) ────── */}
			<div className='app-body'>
				<div className='app-content'>
					{/* Drop zone + toolbar */}
					<div className='top-row'>
						<div className='drop-zone-wrap'>
							<FileDropZone
								onLoad={loadFrames}
								onError={handleFileError}
								onReadStart={handleReadStart}
								onReadProgress={handleReadProgress}
							/>
						</div>
						<Card className='toolbar-card' elevation={Elevation.ONE}>
							<ButtonGroup vertical fill>
								<Button
									icon='lab-test'
									onClick={() => loadFrames(generateSampleSecFrames(), true)}
								>
									Load sample SEC run
								</Button>
								<Button
									icon='trash'
									onClick={handleClear}
									disabled={frames.length === 0}
								>
									Clear
								</Button>
								<Button
									icon='bookmark'
									onClick={() => setIsSavingSnapshot(true)}
									disabled={frames.length === 0 || isSavingSnapshot}
								>
									Save Snapshot
								</Button>
							</ButtonGroup>
						</Card>
					</div>

					{error && (
						<Callout icon='warning-sign' style={{ marginBottom: 16 }}>
							{error}
						</Callout>
					)}

					{/* Empty state */}
					{frames.length === 0 && (
						<div style={{ marginTop: 60 }}>
							<NonIdealState
								icon='document'
								title='No data loaded'
								description='Drop .dat frame files above or load the sample SEC run to begin.'
							/>
						</div>
					)}

					{/* SEC trace */}
					{frames.length > 1 && (
						<>
							<SecTrace
								frames={frames}
								bufferRange={bufferRange}
								signalRange={signalRange}
								onBufferChange={setBufferRange}
								onSignalChange={(r) => {
									skipGuinierResetRef.current = true
									setSignalRange(r)
								}}
							/>
							<Divider style={{ margin: '20px 0' }} />
						</>
					)}

					{/* Analysis panels */}
					{activeCurve && (
						<>
							<div className='analysis-grid'>
								{/* Left column */}
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
								>
									<FullCurveChart
										data={activeCurve}
										result={guinierResult ?? undefined}
										title={
											isSec
												? 'Buffer-subtracted — log I(q)'
												: 'Scattering curve — log I(q)'
										}
										hoveredQ={hoveredQ}
										onHoverQ={handleHoverQ}
									/>
									<Card
										elevation={Elevation.ONE}
										className='guinier-controls'
										style={{ flex: 1 }}
									>
										<p className='chart-card-title'>Guinier fit range</p>
										<RangeControls
											data={activeCurve}
											iMin={iMin}
											iMax={iMax}
											onChange={({ iMin: a, iMax: b }) => {
												setIMin(a)
												setIMax(b)
											}}
										/>
										<Button
											icon='locate'
											variant={ButtonVariant.MINIMAL}
											onClick={handleAutoFind}
											style={{ marginTop: 8 }}
										>
											Auto-find Guinier region
										</Button>
									</Card>
									{guinierResult && (
										<StatsRow
											result={guinierResult}
											pointsUsed={deferredHi - deferredLo + 1}
										/>
									)}
								</div>

								{/* Right column */}
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
								>
									{guinierResult ? (
										<>
											<GuinierChart data={activeCurve} result={guinierResult} />
											<ResidualsChart result={guinierResult} />
										</>
									) : (
										<Card elevation={Elevation.ONE} style={{ flex: 1 }}>
											<NonIdealState
												icon='regression-chart'
												title='No Guinier fit'
												description='Adjust the fit range on the left to compute a Guinier analysis.'
											/>
										</Card>
									)}
								</div>
							</div>

							<KratkyChart data={activeCurve} />

							{guinierResult && insights.length > 0 && (
								<AnalysisInsights insights={insights} />
							)}
						</>
					)}
				</div>

				{/* ── Snapshot sidebar ─────────────────────────────── */}
				{isHistoryOpen && (
					<HistoryPanel
						entries={history.entries}
						activeId={history.activeId}
						onRestore={handleRestore}
						onExport={handleExportSession}
						onImport={handleImportSession}
						onClose={() => setIsHistoryOpen(false)}
					/>
				)}
			</div>

			<ProcessingModal
				state={modal}
				onViewAnalysis={handleViewAnalysis}
				onRetry={handleRetry}
				onDismiss={handleDismiss}
			/>

			<SnapshotModal
				isOpen={isSavingSnapshot}
				name={snapshotName}
				onChange={setSnapshotName}
				onSave={handleSaveSnapshot}
				onCancel={cancelSnapshot}
			/>
		</div>
	)
}
