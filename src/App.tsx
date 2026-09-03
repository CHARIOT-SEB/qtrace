import {
	useCallback,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { Alert, Callout, Icon, Intent } from '@blueprintjs/core'
import {
	ProcessingModal,
	INITIAL_MODAL_STATE,
	type ModalState,
} from './components/ProcessingModal'
import { SnapshotModal } from './components/SnapshotModal'
import { WelcomeModal } from './components/WelcomeModal'
import { AppTopbar } from './components/AppTopbar'
import { SessionRail } from './components/SessionRail'
import { ResultsRail } from './components/ResultsRail'
import { FullCurveChart } from './components/FullCurveChart'
import { GuinierChart } from './components/GuinierChart'
import { KratkyChart } from './components/KratkyChart'
import { RangeControls } from './components/RangeControls'
import { ResidualsChart } from './components/ResidualsChart'
import { SecTrace } from './components/SecTrace'
import { useAuth } from './auth/AuthProvider'
import { useGuinierRange } from './hooks/useGuinierRange'
import { useHistory } from './hooks/useHistory'
import { useCloudSnapshots } from './hooks/useCloudSnapshots'
import { computeGuinier } from './lib/guinier'
import { computePorod } from './lib/porod'
import { computeMolecularWeight } from './lib/molecularWeight'
import { collectInsights } from './lib/analysisHeuristics'
import { autoDetectRegions, averageFrames, subtractBuffer } from './lib/secSaxs'
import { buildExportCsv, downloadCsv } from './lib/csvExport'
import { generateSampleSecFrames } from './lib/sampleData'
import { useIsPhone } from './hooks/useMediaQuery'
import { color } from './theme'
import type { SaxsData } from './types/saxs'
import type { AnalysisSnapshot, HistoryEntry } from './types/history'
import { RailLabel } from './styles/rail.styles'
import {
	AppRoot,
	AppBody,
	SessionRailSlot,
	ResultsRailSlot,
	DrawerBackdrop,
	AppContent,
	Panel,
	PanelHead,
	PanelTitle,
	PanelHeadRight,
	PanelNote,
	SubHead,
	SubHeadRule,
	PlotPairGrid,
	PlotTabs,
	PlotTab,
	ErrorCallout,
	EmptyStage,
	EmptyInner,
	EmptyHeading,
	EmptyLead,
	OrRule,
	StartList,
	StartCard,
	StartIcon,
	StartBody,
	StartTitle,
	StartSub,
	FitRangeBar,
	FitRangeSlider,
	FitRangeReadout,
	FitRangeValue,
	FitRangeArrow,
	FitRangeUnit,
} from './App.styles'
import { RailButton } from './styles/rail.styles'
import { FileDropZone } from './components/FileDropZone'

type PlotTabId = 'sec' | 'fit' | 'curve' | 'kratky'

export function App() {
	const [frames, setFrames] = useState<SaxsData[]>([])
	const [bufferRange, setBufferRange] = useState<[number, number]>([0, 0])
	const [signalRange, setSignalRange] = useState<[number, number]>([0, 0])
	const [error, setError] = useState<string | null>(null)
	const [hoveredQ, setHoveredQ] = useState<number | null>(null)
	const [modal, setModal] = useState<ModalState>(INITIAL_MODAL_STATE)
	const [isConfirmingClear, setIsConfirmingClear] = useState(false)
	const [saveToCloud, setSaveToCloud] = useState(false)
	const [isRailOpen, setIsRailOpen] = useState(false)
	const [plotTab, setPlotTab] = useState<PlotTabId>('fit')
	const isPhone = useIsPhone()

	const { user } = useAuth()
	const signedInUserId = user?.id ?? null
	const previousUserId = useRef(signedInUserId)

	const handleHoverQ = useCallback((q: number | null) => setHoveredQ(q), [])

	const isSec = frames.length > 1

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

	const guinier = useGuinierRange(activeCurve)

	function getSnapshot(): AnalysisSnapshot {
		return {
			frames,
			bufferRange,
			signalRange,
			iMin: guinier.iMin,
			iMax: guinier.iMax,
		}
	}

	function applySnapshot(snapshot: AnalysisSnapshot) {
		guinier.skipGuinierResetRef.current = true
		setFrames(snapshot.frames)
		setBufferRange(snapshot.bufferRange)
		setSignalRange(snapshot.signalRange)
		guinier.setIMin(snapshot.iMin)
		guinier.setIMax(snapshot.iMax)
	}

	const hist = useHistory({ getSnapshot, applySnapshot, setError })

	const cloud = useCloudSnapshots({ applySnapshot })

	const guinierResult = useMemo(
		() =>
			activeCurve
				? computeGuinier(activeCurve, guinier.deferredLo, guinier.deferredHi)
				: null,
		[activeCurve, guinier.deferredLo, guinier.deferredHi],
	)

	const porodResult = useMemo(
		() =>
			activeCurve && guinierResult
				? computePorod(activeCurve, guinierResult)
				: null,
		[activeCurve, guinierResult],
	)

	const mwResult = useMemo(
		() =>
			activeCurve && guinierResult
				? computeMolecularWeight(activeCurve, guinierResult)
				: null,
		[activeCurve, guinierResult],
	)

	const rawInsights = useMemo(
		() =>
			activeCurve && guinierResult
				? collectInsights(activeCurve, guinierResult)
				: [],
		[activeCurve, guinierResult],
	)
	const insights = useDeferredValue(rawInsights)

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
				isSample: true,
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

			setModal((s) => ({ ...s, stageIndex: 3 }))
			await tick(40)

			setModal((s) => ({ ...s, stageIndex: 4 }))
			await tick(40)

			setFrames(newFrames)
			setError(null)
			setBufferRange(br)
			setSignalRange(sr)
			guinier.resetRange(newFrames[0]?.q.length)
			hist.clearHistory()
			setIsRailOpen(false)

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

	const fileHandlers = {
		onLoad: (data: SaxsData[]) => void loadFrames(data),
		onError: handleFileError,
		onReadStart: handleReadStart,
		onReadProgress: handleReadProgress,
	}

	function handleExportCSV() {
		if (frames.length === 0) return
		const built = buildExportCsv({
			frames,
			isSec,
			bufferRange,
			signalRange,
			bufferCurve,
			signalCurve,
			activeCurve,
			guinierResult,
			porodResult,
			mwResult,
		})
		downloadCsv(built)
	}

	/**
	 * Phone plot switcher. Four full-height charts stacked on a 390px screen is
	 * a two-thousand-pixel scroll, so on a phone only one is mounted at a time.
	 * Above the breakpoint every plot renders and `showPlot` is always true.
	 */
	const plotTabs: { id: PlotTabId; label: string }[] = [
		...(isSec ? ([{ id: 'sec', label: 'Chromatogram' }] as const) : []),
		{ id: 'fit', label: 'Guinier fit' },
		{ id: 'curve', label: 'Curve' },
		{ id: 'kratky', label: 'Kratky' },
	]
	const activeTab = plotTabs.some((t) => t.id === plotTab) ? plotTab : 'fit'
	const showPlot = (id: PlotTabId) => !isPhone || activeTab === id

	const savedSnapshotCount = hist.history.entries.filter(
		(e) => e.isNamed,
	).length

	/**
	 * Save to the session, and to the account too when the box is ticked. The
	 * cloud write goes first so a failure leaves the dialog open with the name
	 * intact rather than silently dropping the upload.
	 */
	async function handleSaveSnapshot() {
		const name = hist.snapshotName.trim()
		if (!name) return
		if (saveToCloud && cloud.isSignedIn) {
			const ok = await cloud.save(name, getSnapshot())
			if (!ok) return
		}
		hist.handleSaveSnapshot()
	}

	function handleUploadEntry(entry: HistoryEntry) {
		void cloud.save(entry.name ?? entry.label, entry.snapshot)
	}

	/**
	 * Wipe every trace of the current analysis - loaded frames, the regions and
	 * fit range derived from them, and the session history. Shared by the
	 * clear-session action and by leaving an account.
	 */
	function resetWorkspace() {
		setFrames([])
		setError(null)
		setBufferRange([0, 0])
		setSignalRange([0, 0])
		setHoveredQ(null)
		setModal(INITIAL_MODAL_STATE)
		setSaveToCloud(false)
		setIsConfirmingClear(false)
		setIsRailOpen(false)
		guinier.resetRange()
		hist.clearHistory()
	}

	/**
	 * Signing in from a signed-out session keeps what's on screen - that work
	 * came off the user's own machine. Leaving an account, or switching to a
	 * different one, must not leave the previous account's data sitting there
	 * for whoever uses the browser next.
	 */
	useEffect(() => {
		const previous = previousUserId.current
		previousUserId.current = signedInUserId
		if (previous && previous !== signedInUserId) resetWorkspace()
		// eslint-disable-next-line react-hooks/exhaustive-deps -- account change only
	}, [signedInUserId])

	/**
	 * Name the run, not its first frame. SEC frames are conventionally
	 * `<run>_00123.dat`, so a whole run showing "lysozyme_00001" reads as a
	 * single curve. Strip the frame counter for multi-frame sets only - a lone
	 * curve legitimately keeps whatever it was called.
	 */
	const datasetName = (() => {
		const raw = frames[0]?.filename
		if (!raw) return null
		const stem = raw.replace(/\.[^.]+$/, '')
		if (!isSec) return stem
		return stem.replace(/[_-]?\d+$/, '') || stem
	})()

	const cloudPanelProps = {
		isConfigured: cloud.isConfigured,
		isSignedIn: cloud.isSignedIn,
		items: cloud.items,
		isLoading: cloud.isLoading,
		isBusy: cloud.isBusy,
		onRestore: (id: string) => void cloud.restore(id),
		onDelete: (id: string) => void cloud.remove(id),
		onUpload: handleUploadEntry,
	}

	const qValues = activeCurve?.q ?? frames[0]?.q ?? null

	return (
		<AppRoot>
			<WelcomeModal />

			<AppTopbar
				datasetName={datasetName}
				frameCount={frames.length}
				isSec={isSec}
				canAct={frames.length > 0}
				onExport={handleExportCSV}
				onSnapshot={() => hist.setIsSavingSnapshot(true)}
				onToggleSessionRail={() => setIsRailOpen((v) => !v)}
			/>

			<AppBody>
				<DrawerBackdrop
					$open={isRailOpen}
					onClick={() => setIsRailOpen(false)}
				/>

				<SessionRailSlot $open={isRailOpen}>
					<SessionRail
						datasetName={datasetName}
						frameCount={frames.length}
						isSec={isSec}
						qMin={qValues?.[0] ?? null}
						qMax={qValues?.[qValues.length - 1] ?? null}
						bufferRange={bufferRange}
						signalRange={signalRange}
						entries={hist.history.entries}
						activeId={hist.history.activeId}
						cloud={cloudPanelProps}
						onRestore={hist.handleRestore}
						onExportSession={hist.handleExportSession}
						onImportSession={hist.handleImportSession}
						onClearSession={() => setIsConfirmingClear(true)}
						onLoadFiles={(data) => void loadFrames(data)}
						onFileError={handleFileError}
						onReadStart={handleReadStart}
						onReadProgress={handleReadProgress}
					/>
				</SessionRailSlot>

				<ResultsRailSlot>
					<ResultsRail
						result={guinierResult}
						pointsUsed={guinier.deferredHi - guinier.deferredLo + 1}
						totalPoints={activeCurve?.q.length ?? 0}
						porodResult={porodResult}
						mwResult={mwResult}
						insights={insights}
					/>
				</ResultsRailSlot>

				<AppContent>
					{error && <ErrorCallout icon='warning-sign'>{error}</ErrorCallout>}
					{cloud.error && (
						<ErrorCallout icon='cloud'>{cloud.error}</ErrorCallout>
					)}

					{frames.length === 0 ? (
						<EmptyStage>
							<EmptyInner>
								<div style={{ textAlign: 'center' }}>
									<EmptyHeading>Load a scattering dataset</EmptyHeading>
									<EmptyLead>
										QTrace reads <code>.dat</code> frame files from the
										beamline, ATSAS or RAW. Everything is computed in your
										browser — nothing is uploaded unless you save a snapshot
										to your account.
									</EmptyLead>
								</div>

								<FileDropZone {...fileHandlers} />

								<OrRule>
									<span aria-hidden />
									<RailLabel>or start from</RailLabel>
									<span aria-hidden />
								</OrRule>

								<StartList>
									<StartCard
										type='button'
										$primary
										onClick={() =>
											void loadFrames(generateSampleSecFrames(), true)
										}
									>
										<StartIcon $primary>
											<Icon icon='lab-test' size={16} />
										</StartIcon>
										<StartBody>
											<StartTitle>Load the sample SEC run</StartTitle>
											<StartSub>
												Synthetic frames — see the whole workflow in one click
											</StartSub>
										</StartBody>
										<Icon icon='chevron-right' size={14} color={color.ink450} />
									</StartCard>

									{cloud.isConfigured && cloud.isSignedIn && (
										<StartCard
											type='button'
											disabled={cloud.items.length === 0}
											onClick={() => setIsRailOpen(true)}
										>
											<StartIcon>
												<Icon icon='cloud' size={16} />
											</StartIcon>
											<StartBody>
												<StartTitle>Reopen a saved snapshot</StartTitle>
												<StartSub>
													{cloud.items.length === 0
														? 'No snapshots in your account yet'
														: `${cloud.items.length} snapshot${cloud.items.length === 1 ? '' : 's'} in your account`}
												</StartSub>
											</StartBody>
											<Icon
												icon='chevron-right'
												size={14}
												color={color.ink450}
											/>
										</StartCard>
									)}
								</StartList>
							</EmptyInner>
						</EmptyStage>
					) : (
						<>
							{isPhone && (
								<PlotTabs role='tablist' aria-label='Plot'>
									{plotTabs.map((t) => (
										<PlotTab
											key={t.id}
											type='button'
											role='tab'
											aria-selected={t.id === activeTab}
											$active={t.id === activeTab}
											onClick={() => setPlotTab(t.id)}
										>
											{t.label}
										</PlotTab>
									))}
								</PlotTabs>
							)}

							{/* The chromatogram governs everything below it, so it leads. */}
							{isSec && showPlot('sec') && (
								<SecTrace
									frames={frames}
									bufferRange={bufferRange}
									signalRange={signalRange}
									onBufferChange={setBufferRange}
									onSignalChange={(r) => {
										guinier.skipGuinierResetRef.current = true
										setSignalRange(r)
									}}
								/>
							)}

							{activeCurve && (
								<>
									{/* The fit and its residuals share an x-axis, so they
									    share a card - and the range control that drives them
									    both sits directly underneath. */}
									{showPlot('fit') && (
									<Panel>
										<PanelHead>
											<PanelTitle>Guinier fit</PanelTitle>
											<PanelHeadRight>
												<PanelNote>
													{guinier.deferredHi - guinier.deferredLo + 1} of{' '}
													{activeCurve.q.length} points
												</PanelNote>
												<RailButton
													type='button'
													$accent
													onClick={guinier.handleAutoFind}
												>
													<Icon icon='locate' size={12} />
													Auto-find range
												</RailButton>
											</PanelHeadRight>
										</PanelHead>

										{guinierResult ? (
											<>
												<GuinierChart
													data={activeCurve}
													result={guinierResult}
												/>
												<SubHead>
													<RailLabel>Residuals</RailLabel>
													<SubHeadRule />
												</SubHead>
												<ResidualsChart result={guinierResult} />
											</>
										) : (
											<Callout icon='regression-chart'>
												No Guinier fit yet — widen the range below, or use
												auto-find.
											</Callout>
										)}

										<FitRangeBar>
											<RailLabel>Fit range</RailLabel>
											<FitRangeSlider>
												<RangeControls
													data={activeCurve}
													labels={isPhone ? 'none' : 'handles'}
													iMin={guinier.iMin}
													iMax={guinier.iMax}
													onChange={({ iMin, iMax }) => {
														guinier.setIMin(iMin)
														guinier.setIMax(iMax)
													}}
												/>
											</FitRangeSlider>
											<FitRangeReadout>
												<FitRangeValue>
													{activeCurve.q[guinier.lo]?.toFixed(4)}
												</FitRangeValue>
												<FitRangeArrow>→</FitRangeArrow>
												<FitRangeValue>
													{activeCurve.q[guinier.hi]?.toFixed(4)}
												</FitRangeValue>
												<FitRangeUnit>Å⁻¹</FitRangeUnit>
											</FitRangeReadout>
										</FitRangeBar>
									</Panel>
									)}

									{/* Side by side on a wide screen; one per tab on a phone. */}
									<PlotPairGrid>
										{showPlot('curve') && (
											<FullCurveChart
												data={activeCurve}
												result={guinierResult ?? undefined}
												title={
													isSec
														? 'Scattering curve — buffer-subtracted'
														: 'Scattering curve'
												}
												hoveredQ={hoveredQ}
												onHoverQ={handleHoverQ}
											/>
										)}
										{showPlot('kratky') && <KratkyChart data={activeCurve} />}
									</PlotPairGrid>
								</>
							)}
						</>
					)}
				</AppContent>
			</AppBody>

			<ProcessingModal
				state={modal}
				onViewAnalysis={() => setModal((s) => ({ ...s, isOpen: false }))}
				onRetry={() => setModal(INITIAL_MODAL_STATE)}
				onDismiss={() => setModal(INITIAL_MODAL_STATE)}
			/>

			<SnapshotModal
				isOpen={hist.isSavingSnapshot}
				name={hist.snapshotName}
				onChange={hist.setSnapshotName}
				onSave={handleSaveSnapshot}
				onCancel={hist.cancelSnapshot}
				canSaveToCloud={cloud.isSignedIn}
				saveToCloud={saveToCloud}
				onToggleCloud={setSaveToCloud}
				isSaving={cloud.isBusy}
			/>

			<Alert
				isOpen={isConfirmingClear}
				icon='trash'
				intent={Intent.DANGER}
				confirmButtonText='Clear data'
				cancelButtonText='Cancel'
				onCancel={() => setIsConfirmingClear(false)}
				onConfirm={() => resetWorkspace()}
			>
				<p>
					<strong>Clear the current session?</strong>
				</p>
				{savedSnapshotCount > 0 && (
					<Callout
						intent={Intent.WARNING}
						icon='warning-sign'
						style={{ marginBottom: '0.75rem' }}
					>
						You will lose the {savedSnapshotCount} snapshot
						{savedSnapshotCount === 1 ? '' : 's'} saved in this session.{' '}
						{cloud.isSignedIn
							? 'Anything already saved to your account stays there - only session snapshots go.'
							: 'Session snapshots are not stored between sessions - export them first, or sign in to save them to your account.'}
					</Callout>
				)}
				<p>
					This will remove all loaded frames, the selected buffer and signal
					regions, the Guinier fit range, and the snapshot history for this
					session. This action cannot be undone.
				</p>
			</Alert>
		</AppRoot>
	)
}
