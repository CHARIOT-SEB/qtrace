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

	const userId = user?.id ?? null
	const isSignedIn = Boolean(userId)

	/**
	 * Bumped whenever the signed-in account changes. Every async call captures
	 * it and drops its result if it no longer matches, so a list or download
	 * that was in flight at sign-out can't write the old account's data back
	 * into state after the reset.
	 */
	const epoch = useRef(0)

	const refresh = useCallback(async () => {
		if (!userId) return
		const era = epoch.current
		setIsLoading(true)
		try {
			const next = await listSnapshots()
			if (era !== epoch.current) return
			setItems(next)
			setError(null)
		} catch (e) {
			if (era !== epoch.current) return
			setError(message(e, 'Could not load your saved snapshots.'))
		}
		if (era === epoch.current) setIsLoading(false)
	}, [userId])

	/**
	 * Nothing from one account may survive into the next. Signing out empties
	 * the list, the error banner and the frames->dataset cache - a cached
	 * dataset id belongs to the account that uploaded it and means nothing to
	 * anyone else - and signing in as someone else clears the same state before
	 * loading their snapshots.
	 */
	useEffect(() => {
		epoch.current += 1
		setItems([])
		setError(null)
		setIsLoading(false)
		setIsBusy(false)
		datasetIdByFrames.current = new WeakMap()
		void refresh()
	}, [userId, refresh])

	/**
	 * Save an analysis state to the account, uploading its frames first if that
	 * run isn't in storage yet. Returns false on failure - `error` holds why.
	 */
	const save = useCallback(
		async (name: string, snapshot: AnalysisSnapshot) => {
			if (!userId) return false
			if (snapshot.frames.length === 0) {
				setError('Load some data before saving to your account.')
				return false
			}
			const era = epoch.current
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
					if (era !== epoch.current) return false
					datasetIdByFrames.current.set(snapshot.frames, datasetId)
				}
				const created = await createSnapshot({ datasetId, name, snapshot })
				if (era !== epoch.current) return false
				setItems((prev) => [created, ...prev])
				setIsBusy(false)
				return true
			} catch (e) {
				if (era !== epoch.current) return false
				setError(message(e, 'Could not save this snapshot to your account.'))
				setIsBusy(false)
				return false
			}
		},
		[userId],
	)

	/** Download the frames behind a saved snapshot and apply it to the app. */
	const restore = useCallback(
		async (id: string) => {
			const entry = items.find((s) => s.id === id)
			if (!entry) return false
			const era = epoch.current
			setIsBusy(true)
			setError(null)
			try {
				const frames = await downloadDataset(entry.datasetId)
				if (era !== epoch.current) return false
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
				if (era !== epoch.current) return false
				setError(message(e, 'Could not open that snapshot.'))
				setIsBusy(false)
				return false
			}
		},
		[items, applySnapshot],
	)

	const remove = useCallback(async (id: string) => {
		const era = epoch.current
		setError(null)
		try {
			await deleteSnapshot(id)
			if (era !== epoch.current) return
			setItems((prev) => prev.filter((s) => s.id !== id))
		} catch (e) {
			if (era !== epoch.current) return
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
