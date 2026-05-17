import type { SaxsData } from './saxs'

export type HistoryActionType =
	| 'file_import'
	| 'sample_loaded'
	| 'buffer_region_change'
	| 'signal_region_change'
	| 'guinier_range_change'
	| 'auto_guinier'
	| 'named_snapshot'

export interface AnalysisSnapshot {
	/** Shared reference - not cloned. Old snapshots retain refs to old frame arrays. */
	frames: SaxsData[]
	bufferRange: [number, number]
	signalRange: [number, number]
	iMin: number
	iMax: number
}

export interface HistoryEntry {
	id: string
	timestamp: number
	actionType: HistoryActionType
	label: string
	params: Record<string, unknown>
	snapshot: AnalysisSnapshot
	isNamed: boolean
	name?: string
}

/** Serialisable format for JSON export - frames stored once, not per-entry. */
export interface SessionExport {
	version: 1
	exportedAt: string
	frames: SaxsData[]
	entries: Array<
		Omit<HistoryEntry, 'snapshot'> & {
			bufferRange: [number, number]
			signalRange: [number, number]
			iMin: number
			iMax: number
		}
	>
}
