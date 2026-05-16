import { memo } from 'react'
import { Button, Dialog, Icon, Intent, Spinner } from '@blueprintjs/core'

export const PROCESSING_STAGES = [
	'Uploading files',
	'Parsing scattering data',
	'Detecting SEC regions',
	'Running buffer subtraction',
	'Calculating Guinier analysis',
	'Generating plots',
] as const

export interface ModalState {
	isOpen: boolean
	status: 'processing' | 'success' | 'error'
	stageIndex: number
	frameCount?: number
	parsedCount?: number
	errorMessage?: string
}

export const INITIAL_MODAL_STATE: ModalState = {
	isOpen: false,
	status: 'processing',
	stageIndex: 0,
}

interface Props {
	state: ModalState
	onViewAnalysis: () => void
	onRetry: () => void
	onDismiss: () => void
}

export const ProcessingModal = memo(function ProcessingModal({
	state,
	onViewAnalysis,
	onRetry,
	onDismiss,
}: Props) {
	const { isOpen, status, stageIndex, frameCount, parsedCount, errorMessage } =
		state

	return (
		<Dialog
			isOpen={isOpen}
			isCloseButtonShown={false}
			canEscapeKeyClose={false}
			canOutsideClickClose={false}
			className='processing-modal'
		>
			<div className='processing-modal-body'>
				<div className='processing-modal-indicator'>
					{status === 'processing' && (
						<Spinner size={40} intent={Intent.PRIMARY} />
					)}
					{status === 'success' && (
						<div className='processing-success-icon'>
							<Icon icon='tick-circle' size={40} color='#238551' />
						</div>
					)}
					{status === 'error' && (
						<Icon icon='error' size={40} color='#cd4246' />
					)}
				</div>

				<h4 className='processing-modal-title'>
					{status === 'processing' && 'Processing…'}
					{status === 'success' && 'Your analysis is ready'}
					{status === 'error' && 'Processing failed'}
				</h4>

				{status === 'error' && errorMessage && (
					<p className='processing-modal-error-desc'>{errorMessage}</p>
				)}

				{status !== 'error' && (
					<ul className='processing-stage-list'>
						{PROCESSING_STAGES.map((label, i) => {
							const done = status === 'success' || i < stageIndex
							const active = status === 'processing' && i === stageIndex
							const pending = !done && !active
							const showCount =
								active &&
								(i === 0 || i === 1) &&
								frameCount != null &&
								parsedCount != null
							return (
								<li
									key={label}
									className={`pstage ${done ? 'pstage--done' : active ? 'pstage--active' : 'pstage--pending'}`}
								>
									<span className='pstage-icon'>
										{done && <Icon icon='small-tick' size={14} />}
										{active && <Spinner size={10} />}
										{pending && <span className='pstage-dot' />}
									</span>
									<span className='pstage-label'>{label}</span>
									{showCount && (
										<span className='pstage-count'>
											{parsedCount}/{frameCount}
										</span>
									)}
								</li>
							)
						})}
					</ul>
				)}

				<div className='processing-modal-actions'>
					{status === 'success' && (
						<Button
							intent={Intent.PRIMARY}
							large
							fill
							onClick={onViewAnalysis}
						>
							View Analysis
						</Button>
					)}
					{status === 'error' && (
						<div className='processing-modal-error-actions'>
							<Button intent={Intent.PRIMARY} onClick={onRetry}>
								Retry
							</Button>
							<Button onClick={onDismiss}>Dismiss</Button>
						</div>
					)}
				</div>
			</div>
		</Dialog>
	)
})
