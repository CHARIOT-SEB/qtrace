import { useState } from 'react'
import {
	ButtonVariant,
	Menu,
	MenuDivider,
	MenuItem,
	Popover,
} from '@blueprintjs/core'
import { useAuth } from '../auth/AuthProvider'
import { AuthModal } from './AuthModal'
import { AccountButton, AccountEmail } from './AccountMenu.styles'

export function AccountMenu() {
	const { isConfigured, isReady, user, signOut } = useAuth()
	const [isAuthOpen, setIsAuthOpen] = useState(false)

	// No backend configured for this build - accounts simply don't exist.
	if (!isConfigured) return null

	if (!isReady) {
		return <AccountButton variant={ButtonVariant.MINIMAL} icon='user' loading />
	}

	if (!user) {
		return (
			<>
				<AccountButton
					variant={ButtonVariant.MINIMAL}
					icon='log-in'
					onClick={() => setIsAuthOpen(true)}
				>
					Sign in
				</AccountButton>
				<AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
			</>
		)
	}

	return (
		<Popover
			placement='bottom-end'
			content={
				<Menu>
					<MenuDivider title={user.email ?? 'Signed in'} />
					<MenuItem icon='log-out' text='Sign out' onClick={() => signOut()} />
				</Menu>
			}
		>
			<AccountButton
				variant={ButtonVariant.MINIMAL}
				icon='user'
				endIcon='caret-down'
			>
				<AccountEmail>{user.email}</AccountEmail>
			</AccountButton>
		</Popover>
	)
}
