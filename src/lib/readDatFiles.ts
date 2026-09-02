import { parseDat } from './parseDat'
import type { SaxsData } from '../types/saxs'

export interface ReadHandlers {
	onLoad: (data: SaxsData[]) => void
	onError: (msg: string) => void
	onReadStart?: (total: number) => void
	onReadProgress?: (done: number, total: number) => void
}

/**
 * Parse a set of dropped or picked .dat files into frames.
 *
 * Files are sorted by filename with numeric collation first, because SEC-SAXS
 * frame order is filename order and `frame_2` must not sort after `frame_10`.
 * Reads run concurrently and report progress as each one lands, so the order
 * of completion does not matter - results are written back by index.
 */
export function readDatFiles(
	files: FileList | File[],
	{ onLoad, onError, onReadStart, onReadProgress }: ReadHandlers,
): void {
	const arr = Array.from(files)
	if (arr.length === 0) return
	arr.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

	onReadStart?.(arr.length)

	const results: (SaxsData | null)[] = new Array(arr.length).fill(null)
	let completed = 0

	arr.forEach((file, idx) => {
		const reader = new FileReader()
		const finish = () => {
			completed++
			onReadProgress?.(completed, arr.length)
			if (completed < arr.length) return
			const valid = results.filter((d): d is SaxsData => d !== null)
			const skipped = arr.length - valid.length
			if (valid.length === 0) {
				onError('Could not parse any files. Expecting q, I(q), [err] columns.')
			} else {
				if (skipped > 0)
					onError(`${skipped} file(s) could not be parsed and were skipped.`)
				onLoad(valid)
			}
		}
		reader.onload = () => {
			results[idx] = parseDat(String(reader.result ?? ''), file.name)
			finish()
		}
		reader.onerror = () => finish()
		reader.readAsText(file)
	})
}
