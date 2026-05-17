import { useState, useReducer } from 'react'
import { historyReducer, initialHistoryState } from '../lib/historyReducer'
import type { AnalysisSnapshot, SessionExport } from '../types/history'

interface UseHistoryOptions {
	getSnapshot: () => AnalysisSnapshot
	applySnapshot: (snapshot: AnalysisSnapshot) => void
	setError: (msg: string | null) => void
}

export function useHistory({ getSnapshot, applySnapshot, setError }: UseHistoryOptions) {
	const [history, dispatchHistory] = useReducer(historyReducer, initialHistoryState)
	const [isSavingSnapshot, setIsSavingSnapshot] = useState(false)
	const [snapshotName, setSnapshotName] = useState('')
	const [isHistoryOpen, setIsHistoryOpen] = useState(false)

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
				snapshot: getSnapshot(),
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

	function handleRestore(id: string) {
		const entry = history.entries.find((e) => e.id === id)
		if (!entry) return
		applySnapshot(entry.snapshot)
		dispatchHistory({ type: 'restore', id })
	}

	function handleExportSession() {
		if (history.entries.length === 0) return
		const latestFrames = history.entries[history.entries.length - 1].snapshot.frames
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
		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
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
		applySnapshot(last.snapshot)
		setError(null)
		setIsHistoryOpen(true)
	}

	function clearHistory() {
		dispatchHistory({ type: 'clear' })
		setIsSavingSnapshot(false)
		setSnapshotName('')
	}

	return {
		history,
		isSavingSnapshot,
		setIsSavingSnapshot,
		snapshotName,
		setSnapshotName,
		isHistoryOpen,
		setIsHistoryOpen,
		handleSaveSnapshot,
		cancelSnapshot,
		handleRestore,
		handleExportSession,
		handleImportSession,
		clearHistory,
	}
}
