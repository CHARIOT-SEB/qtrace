import { useState } from 'react'
import {
	Button,
	ButtonVariant,
	Callout,
	FormGroup,
	Icon,
	InputGroup,
	Intent,
} from '@blueprintjs/core'
import { useAuth } from '../auth/AuthProvider'
import {
	AuthDialog,
	AuthBody,
	AuthHint,
	AuthActions,
	SwitchModeRow,
	CheckInbox,
	CheckInboxAddress,
} from './AuthModal.styles'

type Mode = 'signin' | 'signup'

interface Props {
	isOpen: boolean
	onClose: () => void
}

const MIN_PASSWORD_LENGTH = 8

export function AuthModal({ isOpen, onClose }: Props) {
	const { signIn, signUp } = useAuth()
	const [mode, setMode] = useState<Mode>('signin')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [isBusy, setIsBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [sentTo, setSentTo] = useState<string | null>(null)

	const isSignUp = mode === 'signup'
	const canSubmit =
		email.trim().length > 0 &&
		password.length >= (isSignUp ? MIN_PASSWORD_LENGTH : 1)

	function reset() {
		setPassword('')
		setShowPassword(false)
		setError(null)
		setIsBusy(false)
	}

	function handleClose() {
		reset()
		setSentTo(null)
		onClose()
	}

	function switchMode(next: Mode) {
		setMode(next)
		reset()
	}

	async function handleSubmit() {
		if (!canSubmit || isBusy) return
		setIsBusy(true)
		setError(null)
		try {
			if (isSignUp) {
				const { needsVerification } = await signUp(email.trim(), password)
				if (needsVerification) {
					setSentTo(email.trim())
				} else {
					handleClose()
					return
				}
			} else {
				await signIn(email.trim(), password)
				handleClose()
				return
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Something went wrong.')
		}
		setIsBusy(false)
	}

	return (
		<AuthDialog
			isOpen={isOpen}
			onClose={handleClose}
			title={sentTo ? 'Verify your email' : isSignUp ? 'Create account' : 'Sign in'}
			icon={sentTo ? 'envelope' : 'user'}
		>
			{sentTo ? (
				<AuthBody>
					<CheckInbox>
						<Icon icon='envelope' size={28} intent={Intent.PRIMARY} />
						<AuthHint>
							We sent a verification link to{' '}
							<CheckInboxAddress>{sentTo}</CheckInboxAddress>. Open it to
							activate your account, then sign in.
						</AuthHint>
					</CheckInbox>
					<AuthActions>
						<Button
							intent={Intent.PRIMARY}
							onClick={() => {
								setSentTo(null)
								switchMode('signin')
							}}
						>
							Back to sign in
						</Button>
					</AuthActions>
				</AuthBody>
			) : (
				<AuthBody>
					<AuthHint>
						{isSignUp
							? 'An account lets you save snapshots and reopen them on any machine.'
							: 'Sign in to reach the snapshots saved to your account.'}
					</AuthHint>

					{error && (
						<Callout intent={Intent.DANGER} icon='error'>
							{error}
						</Callout>
					)}

					<FormGroup label='Email' labelFor='auth-email'>
						<InputGroup
							id='auth-email'
							autoFocus
							type='email'
							autoComplete='email'
							placeholder='you@lab.ac.uk'
							value={email}
							disabled={isBusy}
							onChange={(e) => setEmail(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleSubmit()
							}}
						/>
					</FormGroup>

					<FormGroup
						label='Password'
						labelFor='auth-password'
						helperText={
							isSignUp
								? `At least ${MIN_PASSWORD_LENGTH} characters.`
								: undefined
						}
					>
						<InputGroup
							id='auth-password'
							type={showPassword ? 'text' : 'password'}
							autoComplete={isSignUp ? 'new-password' : 'current-password'}
							value={password}
							disabled={isBusy}
							onChange={(e) => setPassword(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleSubmit()
							}}
							rightElement={
								<Button
									variant={ButtonVariant.MINIMAL}
									icon={showPassword ? 'eye-off' : 'eye-open'}
									aria-label={showPassword ? 'Hide password' : 'Show password'}
									onClick={() => setShowPassword((v) => !v)}
								/>
							}
						/>
					</FormGroup>

					<AuthActions>
						<Button
							intent={Intent.PRIMARY}
							icon={isSignUp ? 'new-person' : 'log-in'}
							loading={isBusy}
							disabled={!canSubmit}
							onClick={handleSubmit}
						>
							{isSignUp ? 'Create account' : 'Sign in'}
						</Button>
						<Button onClick={handleClose} disabled={isBusy}>
							Cancel
						</Button>
					</AuthActions>

					<SwitchModeRow>
						<Button
							variant={ButtonVariant.MINIMAL}
							small
							disabled={isBusy}
							onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
						>
							{isSignUp
								? 'Already have an account? Sign in'
								: 'No account? Create one'}
						</Button>
					</SwitchModeRow>
				</AuthBody>
			)}
		</AuthDialog>
	)
}
