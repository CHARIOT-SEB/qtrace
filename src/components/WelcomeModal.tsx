import { useEffect, useState } from 'react'
import {
	Backdrop,
	Card,
	LogoBlock,
	Logo,
	Wordmark,
	Divider,
	Tagline,
	Body,
	GetStartedButton,
	FooterDivider,
	FooterText,
	CoffeeLink,
} from './WelcomeModal.styles'

const STORAGE_KEY = 'qtrace_welcome_shown'

export function WelcomeModal() {
	const [isOpen, setIsOpen] = useState(false)

	useEffect(() => {
		if (sessionStorage.getItem(STORAGE_KEY) !== '1') {
			setIsOpen(true)
		}
	}, [])

	function dismiss() {
		sessionStorage.setItem(STORAGE_KEY, '1')
		setIsOpen(false)
	}

	if (!isOpen) return null

	function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
		if (e.target === e.currentTarget) dismiss()
	}

	const logoSrc = `${import.meta.env.BASE_URL}assets/qtrace-logo.png`

	return (
		<Backdrop
			onClick={handleBackdropClick}
			role='dialog'
			aria-modal='true'
			aria-labelledby='welcome-title'
		>
			<Card>
				<LogoBlock>
					<Logo src={logoSrc} alt='QTrace logo' />
					<Wordmark id='welcome-title'>QTrace</Wordmark>
					<Divider />
					<Tagline>SEC-SAXS Analysis. Clearer Insight.</Tagline>
				</LogoBlock>

				<Body>
					Welcome to QTrace - a modern, browser-based SEC-SAXS analysis tool.
					Load your data, trace your elution peaks, and extract scattering
					profiles with a clean interface designed for scientists who just want
					to get on with it.
				</Body>

				<GetStartedButton onClick={dismiss}>Get Started</GetStartedButton>

				<FooterDivider />
				<FooterText>
					If you find QTrace useful, please consider supporting its development.
				</FooterText>
				<CoffeeLink
					href='https://buymeacoffee.com/sebxboyse'
					target='_blank'
					rel='noopener noreferrer'
				>
					☕ Buy Me a Coffee
				</CoffeeLink>
			</Card>
		</Backdrop>
	)
}
