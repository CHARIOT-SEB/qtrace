import { Button, Checkbox, InputGroup, Intent } from '@blueprintjs/core'
import {
	SnapDialog,
	SnapBody,
	SnapHint,
	SnapActions,
	CloudRow,
} from './SnapshotModal.styles'

interface Props {
	isOpen: boolean
	name: string
	onChange: (name: string) => void
	onSave: () => void
	onCancel: () => void
	/** Account features - omitted when signed out or unconfigured. */
	canSaveToCloud?: boolean
	saveToCloud?: boolean
	onToggleCloud?: (next: boolean) => void
	isSaving?: boolean
}

export function SnapshotModal({
	isOpen,
	name,
	onChange,
	onSave,
	onCancel,
	canSaveToCloud = false,
	saveToCloud = false,
	onToggleCloud,
	isSaving = false,
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
					placeholder='e.g. Run 3 - 2 mg/mL, pH 7.4'
					value={name}
					disabled={isSaving}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && name.trim()) onSave()
						if (e.key === 'Escape') onCancel()
					}}
				/>
				{canSaveToCloud && (
					<CloudRow>
						<Checkbox
							checked={saveToCloud}
							disabled={isSaving}
							onChange={(e) => onToggleCloud?.(e.currentTarget.checked)}
							label='Also save to my account'
						/>
						<SnapHint>
							Uploads this run's frames so you can reopen the snapshot on
							another machine.
						</SnapHint>
					</CloudRow>
				)}
				<SnapActions>
					<Button
						intent={Intent.PRIMARY}
						icon='bookmark'
						loading={isSaving}
						disabled={!name.trim()}
						onClick={onSave}
					>
						Save snapshot
					</Button>
					<Button onClick={onCancel} disabled={isSaving}>
						Cancel
					</Button>
				</SnapActions>
			</SnapBody>
		</SnapDialog>
	)
}
