import { useRef, useState } from 'react'
import { Elevation } from '@blueprintjs/core'
import { parseDat } from '../lib/parseDat'
import type { SaxsData } from '../types/saxs'
import {
	DropCard,
	DropIcon,
	DropPrimary,
	DropSecondary,
	HiddenInput,
} from './FileDropZone.styles'

interface Props {
	onLoad: (data: SaxsData[]) => void
	onError: (msg: string) => void
	onReadStart?: (total: number) => void
	onReadProgress?: (done: number, total: number) => void
}

export function FileDropZone({
	onLoad,
	onError,
	onReadStart,
	onReadProgress,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [drag, setDrag] = useState(false)

	function readFiles(files: FileList | File[]) {
		const arr = Array.from(files)
		if (arr.length === 0) return
		arr.sort((a, b) =>
			a.name.localeCompare(b.name, undefined, { numeric: true }),
		)

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
					onError(
						'Could not parse any files. Expecting q, I(q), [err] columns.',
					)
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

	return (
		<DropCard
			elevation={Elevation.ONE}
			$isDragging={drag}
			onClick={() => inputRef.current?.click()}
			onDragOver={(e) => {
				e.preventDefault()
				setDrag(true)
			}}
			onDragLeave={() => setDrag(false)}
			onDrop={(e) => {
				e.preventDefault()
				setDrag(false)
				readFiles(e.dataTransfer.files)
			}}
		>
			<DropIcon icon='upload' size={20} />
			<DropPrimary>
				Drop <code>.dat</code> frame files here, or click to browse
			</DropPrimary>
			<DropSecondary>
				Multiple files accepted - sorted by filename for SEC-SAXS frame order
			</DropSecondary>
			<HiddenInput
				ref={inputRef}
				type='file'
				accept='.dat,.txt,.csv'
				multiple
				onChange={(e) => {
					if (e.target.files) readFiles(e.target.files)
				}}
			/>
		</DropCard>
	)
}
