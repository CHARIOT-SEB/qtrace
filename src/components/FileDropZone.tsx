import { useRef, useState } from 'react'
import { Icon } from '@blueprintjs/core'
import { readDatFiles } from '../lib/readDatFiles'
import type { SaxsData } from '../types/saxs'
import {
	DropCard,
	DropIconTile,
	DropPrimary,
	DropSecondary,
	DropBrowse,
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

	const handlers = { onLoad, onError, onReadStart, onReadProgress }

	return (
		<DropCard
			role='button'
			tabIndex={0}
			$isDragging={drag}
			onClick={() => inputRef.current?.click()}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					inputRef.current?.click()
				}
			}}
			onDragOver={(e) => {
				e.preventDefault()
				setDrag(true)
			}}
			onDragLeave={() => setDrag(false)}
			onDrop={(e) => {
				e.preventDefault()
				setDrag(false)
				readDatFiles(e.dataTransfer.files, handlers)
			}}
		>
			<DropIconTile>
				<Icon icon='upload' size={22} />
			</DropIconTile>
			<div>
				<DropPrimary>Drop frame files here</DropPrimary>
				<DropSecondary>
					A single curve, or a whole SEC run — sorted by filename for frame
					order
				</DropSecondary>
			</div>
			<DropBrowse>Browse files</DropBrowse>
			<HiddenInput
				ref={inputRef}
				type='file'
				accept='.dat,.txt,.csv'
				multiple
				onChange={(e) => {
					if (e.target.files) readDatFiles(e.target.files, handlers)
					e.target.value = ''
				}}
			/>
		</DropCard>
	)
}
