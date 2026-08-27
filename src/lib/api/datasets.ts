import { requireSupabase } from '../supabase'
import { packJson, unpackJson, sha256Hex, datasetExtension } from '../gzip'
import type { SaxsData } from '../../types/saxs'

export const DATASET_BUCKET = 'datasets'

/** Refuse uploads that would eat the free tier in one go. */
export const MAX_DATASET_BYTES = 50 * 1024 * 1024

export interface DatasetRow {
	id: string
	name: string
	frame_count: number
	point_count: number
	storage_path: string
	byte_size: number | null
	checksum: string | null
	created_at: string
}

const DATASET_COLUMNS =
	'id, name, frame_count, point_count, storage_path, byte_size, checksum, created_at'

/**
 * Upload frames once and return the dataset row to hang snapshots off.
 *
 * Identical frame data (same checksum) reuses the existing row, so saving five
 * snapshots of one run costs one upload.
 */
export async function uploadDataset(
	frames: SaxsData[],
	name: string,
): Promise<DatasetRow> {
	const supabase = requireSupabase()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) throw new Error('You must be signed in to save to your account.')

	const checksum = await sha256Hex(JSON.stringify(frames))

	const { data: existing, error: lookupError } = await supabase
		.from('datasets')
		.select(DATASET_COLUMNS)
		.eq('checksum', checksum)
		.limit(1)
		.maybeSingle()
	if (lookupError) throw lookupError
	if (existing) return existing as DatasetRow

	const blob = await packJson(frames)
	if (blob.size > MAX_DATASET_BYTES) {
		throw new Error(
			`This dataset is ${(blob.size / 1024 / 1024).toFixed(0)} MB compressed, over the ${MAX_DATASET_BYTES / 1024 / 1024} MB limit. Export it as JSON instead.`,
		)
	}

	const id = crypto.randomUUID()
	const storagePath = `${user.id}/${id}.${datasetExtension}`

	const { error: uploadError } = await supabase.storage
		.from(DATASET_BUCKET)
		.upload(storagePath, blob, { contentType: blob.type, upsert: false })
	if (uploadError) throw uploadError

	const { data: row, error: insertError } = await supabase
		.from('datasets')
		.insert({
			id,
			user_id: user.id,
			name,
			frame_count: frames.length,
			point_count: frames[0]?.q.length ?? 0,
			storage_path: storagePath,
			byte_size: blob.size,
			checksum,
		})
		.select(DATASET_COLUMNS)
		.single()

	if (insertError) {
		// Don't leave an orphaned blob behind paying for storage.
		await supabase.storage.from(DATASET_BUCKET).remove([storagePath])
		throw insertError
	}

	return row as DatasetRow
}

/** Fetch and decompress the frames behind a dataset. */
export async function downloadDataset(datasetId: string): Promise<SaxsData[]> {
	const supabase = requireSupabase()

	const { data: row, error } = await supabase
		.from('datasets')
		.select('storage_path')
		.eq('id', datasetId)
		.single()
	if (error) throw error

	const { data: blob, error: downloadError } = await supabase.storage
		.from(DATASET_BUCKET)
		.download(row.storage_path)
	if (downloadError) throw downloadError

	return unpackJson<SaxsData[]>(blob)
}
