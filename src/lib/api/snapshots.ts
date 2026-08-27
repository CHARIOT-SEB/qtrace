import { requireSupabase } from '../supabase'
import type { AnalysisSnapshot } from '../../types/history'

/** A snapshot as stored server-side: ranges only, frames live in its dataset. */
export interface CloudSnapshot {
	id: string
	datasetId: string
	name: string
	createdAt: number
	bufferRange: [number, number]
	signalRange: [number, number]
	iMin: number
	iMax: number
	/** Dataset context for display - how many frames this snapshot points at. */
	datasetName: string | null
	frameCount: number | null
}

interface SnapshotRow {
	id: string
	dataset_id: string
	name: string
	created_at: string
	buffer_range: number[]
	signal_range: number[]
	i_min: number
	i_max: number
	datasets: { name: string; frame_count: number } | null
}

const SNAPSHOT_COLUMNS =
	'id, dataset_id, name, created_at, buffer_range, signal_range, i_min, i_max, datasets(name, frame_count)'

function toCloudSnapshot(row: SnapshotRow): CloudSnapshot {
	return {
		id: row.id,
		datasetId: row.dataset_id,
		name: row.name,
		createdAt: new Date(row.created_at).getTime(),
		bufferRange: [row.buffer_range[0] ?? 0, row.buffer_range[1] ?? 0],
		signalRange: [row.signal_range[0] ?? 0, row.signal_range[1] ?? 0],
		iMin: row.i_min,
		iMax: row.i_max,
		datasetName: row.datasets?.name ?? null,
		frameCount: row.datasets?.frame_count ?? null,
	}
}

/** Newest first. RLS scopes this to the signed-in user; no filter needed here. */
export async function listSnapshots(): Promise<CloudSnapshot[]> {
	const supabase = requireSupabase()
	const { data, error } = await supabase
		.from('snapshots')
		.select(SNAPSHOT_COLUMNS)
		.order('created_at', { ascending: false })
	if (error) throw error
	return (data as unknown as SnapshotRow[]).map(toCloudSnapshot)
}

export async function createSnapshot(input: {
	datasetId: string
	name: string
	snapshot: AnalysisSnapshot
}): Promise<CloudSnapshot> {
	const supabase = requireSupabase()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) throw new Error('You must be signed in to save to your account.')

	const { snapshot } = input
	const { data, error } = await supabase
		.from('snapshots')
		.insert({
			user_id: user.id,
			dataset_id: input.datasetId,
			name: input.name,
			label: input.name,
			action_type: 'named_snapshot',
			buffer_range: snapshot.bufferRange,
			signal_range: snapshot.signalRange,
			i_min: snapshot.iMin,
			i_max: snapshot.iMax,
		})
		.select(SNAPSHOT_COLUMNS)
		.single()
	if (error) throw error
	return toCloudSnapshot(data as unknown as SnapshotRow)
}

export async function deleteSnapshot(id: string): Promise<void> {
	const supabase = requireSupabase()
	const { error } = await supabase.from('snapshots').delete().eq('id', id)
	if (error) throw error
}
