import { memo } from 'react'
import { Button, Icon, Intent, Spinner } from '@blueprintjs/core'
import {
	ProcessingDialog,
	ModalBody,
	ModalIndicator,
	SuccessIconWrap,
	ModalTitle,
	ModalErrorDesc,
	StageList,
	StageItem,
	StageIcon,
	StageDot,
	StageLabel,
	StageCount,
	ModalActions,
	ModalErrorActions,
	SampleCallout,
} from './ProcessingModal.styles'

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
	isSample?: boolean
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
	const {
		isOpen,
		status,
		stageIndex,
		frameCount,
		parsedCount,
		errorMessage,
		isSample,
	} = state

	return (
		<ProcessingDialog
			isOpen={isOpen}
			isCloseButtonShown={false}
			canEscapeKeyClose={false}
			canOutsideClickClose={false}
		>
			<ModalBody>
				<ModalIndicator>
					{status === 'processing' && (
						<Spinner size={40} intent={Intent.PRIMARY} />
					)}
					{status === 'success' && (
						<SuccessIconWrap>
							<Icon icon='tick-circle' size={40} color='#238551' />
						</SuccessIconWrap>
					)}
					{status === 'error' && (
						<Icon icon='error' size={40} color='#cd4246' />
					)}
				</ModalIndicator>

				<ModalTitle>
					{status === 'processing' && 'Processing…'}
					{status === 'success' && 'Your analysis is ready'}
					{status === 'error' && 'Processing failed'}
				</ModalTitle>

				{status === 'error' && errorMessage && (
					<ModalErrorDesc>{errorMessage}</ModalErrorDesc>
				)}

				{status !== 'error' && (
					<StageList>
						{PROCESSING_STAGES.map((label, i) => {
							const done = status === 'success' || i < stageIndex
							const active = status === 'processing' && i === stageIndex
							const pending = !done && !active
							const stage = done ? 'done' : active ? 'active' : 'pending'
							const showCount =
								active &&
								(i === 0 || i === 1) &&
								frameCount != null &&
								parsedCount != null
							return (
								<StageItem key={label} $stage={stage}>
									<StageIcon $stage={stage}>
										{done && <Icon icon='small-tick' size={14} />}
										{active && <Spinner size={10} />}
										{pending && <StageDot />}
									</StageIcon>
									<StageLabel>{label}</StageLabel>
									{showCount && (
										<StageCount>
											{parsedCount}/{frameCount}
										</StageCount>
									)}
								</StageItem>
							)
						})}
					</StageList>
				)}

				{status === 'success' && isSample && (
					<SampleCallout intent={Intent.PRIMARY} icon='info-sign'>
						<strong>This is synthetic demo data.</strong> The 30 frames were
						generated mathematically to simulate a SEC-SAXS run - no real
						experimental data has been loaded. Drop your own <code>.dat</code>{' '}
						files above to analyse real data.
					</SampleCallout>
				)}

				<ModalActions>
					{status === 'success' && (
						<Button intent={Intent.PRIMARY} large fill onClick={onViewAnalysis}>
							View Analysis
						</Button>
					)}
					{status === 'error' && (
						<ModalErrorActions>
							<Button intent={Intent.PRIMARY} onClick={onRetry}>
								Retry
							</Button>
							<Button onClick={onDismiss}>Dismiss</Button>
						</ModalErrorActions>
					)}
				</ModalActions>
			</ModalBody>
		</ProcessingDialog>
	)
})
