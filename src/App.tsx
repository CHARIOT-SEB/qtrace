import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import {
	Button,
	ButtonGroup,
	Elevation,
	NonIdealState,
} from '@blueprintjs/core'
import { FileDropZone } from './components/FileDropZone'
import {
	ProcessingModal,
	INITIAL_MODAL_STATE,
	type ModalState,
} from './components/ProcessingModal'
import { SnapshotModal } from './components/SnapshotModal'
import { WelcomeModal } from './components/WelcomeModal'
import { AppNavbar } from './components/AppNavbar'
import { FullCurveChart } from './components/FullCurveChart'
import { GuinierChart } from './components/GuinierChart'
import { GuinierFitCard } from './components/GuinierFitCard'
import { HistoryPanel } from './components/HistoryPanel'
import { KratkyChart } from './components/KratkyChart'
import { ResidualsChart } from './components/ResidualsChart'
import { SecTrace } from './components/SecTrace'
import { StatsRow } from './components/StatsRow'
import { AnalysisInsights } from './components/AnalysisInsights'
import { useGuinierRange } from './hooks/useGuinierRange'
import { useHistory } from './hooks/useHistory'
import { computeGuinier } from './lib/guinier'
import { computePorod } from './lib/porod'
import { collectInsights } from './lib/analysisHeuristics'
import { autoDetectRegions, averageFrames, subtractBuffer } from './lib/secSaxs'
import { generateSampleSecFrames } from './lib/sampleData'
import type { SaxsData } from './types/saxs'
import {
	AppRoot,
	AppBody,
	AppContent,
	TopRow,
	DropZoneWrap,
	ToolbarCard,
	AnalysisGrid,
	LeftColumn,
	RightColumn,
	ResidualsWrapper,
	EmptyStateWrapper,
	ErrorCallout,
	SecDivider,
	NoFitCard,
} from './App.styles'

export function App() {
	const [frames, setFrames] = useState<SaxsData[]>([])
	const [bufferRange, setBufferRange] = useState<[number, number]>([0, 0])
	const [signalRange, setSignalRange] = useState<[number, number]>([0, 0])
	const [error, setError] = useState<string | null>(null)
	const [hoveredQ, setHoveredQ] = useState<number | null>(null)
	const [modal, setModal] = useState<ModalState>(INITIAL_MODAL_STATE)

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

	const hist = useHistory({
		getSnapshot: () => ({
			frames,
			bufferRange,
			signalRange,
			iMin: guinier.iMin,
			iMax: guinier.iMax,
		}),
		applySnapshot: (snapshot) => {
			guinier.skipGuinierResetRef.current = true
			setFrames(snapshot.frames)
			setBufferRange(snapshot.bufferRange)
			setSignalRange(snapshot.signalRange)
			guinier.setIMin(snapshot.iMin)
			guinier.setIMax(snapshot.iMax)
		},
		setError,
	})

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
				? computePorod(activeCurve, guinierResult.I0)
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

	function handleExportCSV() {
		if (!guinierResult) return
		const filename = activeCurve?.filename ?? 'unknown'
		const { Rg, dRg, I0, dI0, qRgMax, fit, iMin, iMax, xs } = guinierResult
		const header =
			'filename,Rg_A,dRg_A,I0,dI0,qRg_max,R2,n_points,fit_iMin,fit_iMax,timestamp'
		const row = [
			`"${filename}"`,
			Rg.toFixed(4),
			Number.isFinite(dRg) ? dRg.toFixed(4) : '',
			I0.toFixed(4),
			Number.isFinite(dI0) ? dI0.toFixed(4) : '',
			qRgMax.toFixed(4),
			fit.r2.toFixed(6),
			xs.length,
			iMin,
			iMax,
			new Date().toISOString(),
		].join(',')
		const blob = new Blob([header + '\n' + row], { type: 'text/csv' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `qtrace-${filename.replace(/\.dat$/i, '')}-${Date.now()}.csv`
		a.click()
		URL.revokeObjectURL(url)
	}

	function handleClear() {
		setFrames([])
		setError(null)
		setBufferRange([0, 0])
		setSignalRange([0, 0])
		guinier.resetRange()
		hist.clearHistory()
	}

	return (
		<AppRoot>
			<WelcomeModal />
			<AppNavbar
				framesCount={frames.length}
				isHistoryOpen={hist.isHistoryOpen}
				onToggleHistory={() => hist.setIsHistoryOpen((v) => !v)}
			/>

			{/* ── Body (content + optional snapshot sidebar) ────── */}
			<AppBody>
				<AppContent>
					{/* Drop zone + toolbar */}
					<TopRow>
						<DropZoneWrap>
							<FileDropZone
								onLoad={loadFrames}
								onError={handleFileError}
								onReadStart={handleReadStart}
								onReadProgress={handleReadProgress}
							/>
						</DropZoneWrap>
						<ToolbarCard elevation={Elevation.ONE}>
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
									onClick={() => hist.setIsSavingSnapshot(true)}
									disabled={frames.length === 0 || hist.isSavingSnapshot}
								>
									Save Snapshot
								</Button>
								<Button
									icon='download'
									onClick={handleExportCSV}
									disabled={!guinierResult}
								>
									Export CSV
								</Button>
							</ButtonGroup>
						</ToolbarCard>
					</TopRow>

					{error && <ErrorCallout icon='warning-sign'>{error}</ErrorCallout>}

					{/* Empty state */}
					{frames.length === 0 && (
						<EmptyStateWrapper>
							<NonIdealState
								icon='document'
								title='No data loaded'
								description='Drop .dat frame files above or load the sample SEC run to begin.'
							/>
						</EmptyStateWrapper>
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
									guinier.skipGuinierResetRef.current = true
									setSignalRange(r)
								}}
							/>
							<SecDivider />
						</>
					)}

					{/* Analysis panels */}
					{activeCurve && (
						<>
							<AnalysisGrid>
								{/* Left column */}
								<LeftColumn>
									<FullCurveChart
										data={activeCurve}
										result={guinierResult ?? undefined}
										title={
											isSec
												? 'Buffer-subtracted - log I(q)'
												: 'Scattering curve - log I(q)'
										}
										hoveredQ={hoveredQ}
										onHoverQ={handleHoverQ}
									/>
									<GuinierFitCard
										activeCurve={activeCurve}
										iMin={guinier.iMin}
										iMax={guinier.iMax}
										lo={guinier.lo}
										hi={guinier.hi}
										onChange={({ iMin: a, iMax: b }) => {
											guinier.setIMin(a)
											guinier.setIMax(b)
										}}
										onAutoFind={guinier.handleAutoFind}
									/>
									{guinierResult && (
										<StatsRow
											result={guinierResult}
											pointsUsed={guinier.deferredHi - guinier.deferredLo + 1}
											porodResult={porodResult ?? undefined}
										/>
									)}
								</LeftColumn>

								{/* Right column */}
								<RightColumn>
									{guinierResult ? (
										<>
											<GuinierChart data={activeCurve} result={guinierResult} />
											<ResidualsWrapper>
												<ResidualsChart result={guinierResult} />
											</ResidualsWrapper>
										</>
									) : (
										<NoFitCard elevation={Elevation.ONE}>
											<NonIdealState
												icon='regression-chart'
												title='No Guinier fit'
												description='Adjust the fit range on the left to compute a Guinier analysis.'
											/>
										</NoFitCard>
									)}
								</RightColumn>
							</AnalysisGrid>

							<KratkyChart data={activeCurve} />

							{guinierResult && insights.length > 0 && (
								<AnalysisInsights insights={insights} />
							)}
						</>
					)}
				</AppContent>

				{/* ── Snapshot sidebar ─────────────────────────────── */}
				{hist.isHistoryOpen && (
					<HistoryPanel
						entries={hist.history.entries}
						activeId={hist.history.activeId}
						onRestore={hist.handleRestore}
						onExport={hist.handleExportSession}
						onImport={hist.handleImportSession}
						onClose={() => hist.setIsHistoryOpen(false)}
					/>
				)}
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
				onSave={hist.handleSaveSnapshot}
				onCancel={hist.cancelSnapshot}
			/>
		</AppRoot>
	)
}
