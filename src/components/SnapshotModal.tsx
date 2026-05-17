import { Button, InputGroup, Intent } from '@blueprintjs/core'
import { SnapDialog, SnapBody, SnapHint, SnapActions } from './SnapshotModal.styles'

interface Props {
	isOpen: boolean
	name: string
	onChange: (name: string) => void
	onSave: () => void
	onCancel: () => void
}

export function SnapshotModal({
	isOpen,
	name,
	onChange,
	onSave,
	onCancel,
}: Props) {
	return (
		<SnapDialog
			isOpen={isOpen}
			onClose={onCancel}
			title='Save snapshot'
			icon='bookmark'
		>
			<SnapBody>
				<SnapHint>
					Give this analysis state a name so you can return to it later.
				</SnapHint>
				<InputGroup
					autoFocus
					large
					placeholder='e.g. Run 3 — 2 mg/mL, pH 7.4'
					value={name}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && name.trim()) onSave()
						if (e.key === 'Escape') onCancel()
					}}
				/>
				<SnapActions>
					<Button
						intent={Intent.PRIMARY}
						icon='bookmark'
						disabled={!name.trim()}
						onClick={onSave}
					>
						Save snapshot
					</Button>
					<Button onClick={onCancel}>Cancel</Button>
				</SnapActions>
			</SnapBody>
		</SnapDialog>
	)
}
