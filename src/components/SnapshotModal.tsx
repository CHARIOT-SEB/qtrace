import { Button, Dialog, InputGroup, Intent } from '@blueprintjs/core'

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
		<Dialog
			isOpen={isOpen}
			onClose={onCancel}
			title='Save snapshot'
			icon='bookmark'
			className='snapshot-modal'
		>
			<div className='snapshot-modal-body'>
				<p className='snapshot-modal-hint'>
					Give this analysis state a name so you can return to it later.
				</p>
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
				<div className='snapshot-modal-actions'>
					<Button
						intent={Intent.PRIMARY}
						icon='bookmark'
						disabled={!name.trim()}
						onClick={onSave}
					>
						Save snapshot
					</Button>
					<Button onClick={onCancel}>Cancel</Button>
				</div>
			</div>
		</Dialog>
	)
}
