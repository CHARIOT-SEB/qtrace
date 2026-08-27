import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { uploadDataset, downloadDataset } from '../lib/api/datasets'
import {
	listSnapshots,
	createSnapshot,
	deleteSnapshot,
	type CloudSnapshot,
} from '../lib/api/snapshots'
import type { AnalysisSnapshot } from '../types/history'
import type { SaxsData } from '../types/saxs'

interface UseCloudSnapshotsOptions {
	/** Single restore path, shared with session snapshots. */
	applySnapshot: (snapshot: AnalysisSnapshot) => void
}

function message(e: unknown, fallback: string): string {
	return e instanceof Error && e.message ? e.message : fallback
}

export function useCloudSnapshots({ applySnapshot }: UseCloudSnapshotsOptions) {
	const { user, isConfigured } = useAuth()
	const [items, setItems] = useState<CloudSnapshot[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isBusy, setIsBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)

	/**
	 * Frame arrays already in storage, keyed by identity. Snapshots of one run
	 * share a frames reference (see AnalysisSnapshot), so saving five snapshots
	 * of the same data costs one upload - and an old snapshot pointing at
	 * different frames still gets its own dataset.
	 */
	const datasetIdByFrames = useRef(new WeakMap<SaxsData[], string>())

	const isSignedIn = Boolean(user)

	const refresh = useCallback(async () => {
		if (!user) {
			setItems([])
			return
		}
		setIsLoading(true)
		try {
			setItems(await listSnapshots())
			setError(null)
		} catch (e) {
			setError(message(e, 'Could not load your saved snapshots.'))
		}
		setIsLoading(false)
	}, [user])

	useEffect(() => {
		void refresh()
	}, [refresh])

	/**
	 * Save an analysis state to the account, uploading its frames first if that
	 * run isn't in storage yet. Returns false on failure - `error` holds why.
	 */
	const save = useCallback(
		async (name: string, snapshot: AnalysisSnapshot) => {
			if (!user) return false
			if (snapshot.frames.length === 0) {
				setError('Load some data before saving to your account.')
				return false
			}
			setIsBusy(true)
			setError(null)
			try {
				let datasetId = datasetIdByFrames.current.get(snapshot.frames)
				if (!datasetId) {
					const dataset = await uploadDataset(
						snapshot.frames,
						snapshot.frames[0]?.filename ?? name,
					)
					datasetId = dataset.id
					datasetIdByFrames.current.set(snapshot.frames, datasetId)
				}
				const created = await createSnapshot({ datasetId, name, snapshot })
				setItems((prev) => [created, ...prev])
				setIsBusy(false)
				return true
			} catch (e) {
				setError(message(e, 'Could not save this snapshot to your account.'))
				setIsBusy(false)
				return false
			}
		},
		[user],
	)

	/** Download the frames behind a saved snapshot and apply it to the app. */
	const restore = useCallback(
		async (id: string) => {
			const entry = items.find((s) => s.id === id)
			if (!entry) return false
			setIsBusy(true)
			setError(null)
			try {
				const frames = await downloadDataset(entry.datasetId)
				datasetIdByFrames.current.set(frames, entry.datasetId)
				applySnapshot({
					frames,
					bufferRange: entry.bufferRange,
					signalRange: entry.signalRange,
					iMin: entry.iMin,
					iMax: entry.iMax,
				})
				setIsBusy(false)
				return true
			} catch (e) {
				setError(message(e, 'Could not open that snapshot.'))
				setIsBusy(false)
				return false
			}
		},
		[items, applySnapshot],
	)

	const remove = useCallback(async (id: string) => {
		setError(null)
		try {
			await deleteSnapshot(id)
			setItems((prev) => prev.filter((s) => s.id !== id))
		} catch (e) {
			setError(message(e, 'Could not delete that snapshot.'))
		}
	}, [])

	return {
		isConfigured,
		isSignedIn,
		items,
		isLoading,
		isBusy,
		error,
		refresh,
		save,
		restore,
		remove,
		clearError: useCallback(() => setError(null), []),
	}
}
