import { Alignment, ButtonVariant, Navbar } from '@blueprintjs/core'
import {
	NavHeading,
	NavLogo,
	SubtitleSpan,
	FramesTag,
	SnapshotsButton,
	HideOnMobile,
} from './AppNavbar.styles'

interface AppNavbarProps {
	framesCount: number
	isHistoryOpen: boolean
	onToggleHistory: () => void
}

export function AppNavbar({
	framesCount,
	isHistoryOpen,
	onToggleHistory,
}: AppNavbarProps) {
	return (
		<Navbar>
			<Navbar.Group align={Alignment.START}>
				<NavHeading>
					<NavLogo
						src={`${import.meta.env.BASE_URL}assets/qtrace-logo.png`}
						alt='QTrace'
					/>
					Trace
				</NavHeading>
				<HideOnMobile>
					<Navbar.Divider />
				</HideOnMobile>
				<SubtitleSpan className='bp6-text-muted'>
					SEC-SAXS Analysis
				</SubtitleSpan>
			</Navbar.Group>
			<Navbar.Group align={Alignment.END}>
				{framesCount > 0 && (
					<FramesTag minimal>
						{framesCount} frame{framesCount !== 1 ? 's' : ''} loaded
					</FramesTag>
				)}
				<SnapshotsButton
					variant={ButtonVariant.MINIMAL}
					icon='history'
					active={isHistoryOpen}
					onClick={onToggleHistory}
				>
					Snapshots
				</SnapshotsButton>
			</Navbar.Group>
		</Navbar>
	)
}
