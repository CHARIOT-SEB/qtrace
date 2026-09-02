import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface SignUpResult {
	/** True when Supabase sent a verification email and no session exists yet. */
	needsVerification: boolean
}

interface AuthContextValue {
	/** False until the initial session lookup settles, to avoid a signed-out flash. */
	isReady: boolean
	isConfigured: boolean
	session: Session | null
	user: User | null
	signUp: (email: string, password: string) => Promise<SignUpResult>
	signIn: (email: string, password: string) => Promise<void>
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Where the verification link should land - respects the /qtrace/ base path. */
function redirectUrl(): string {
	return `${window.location.origin}${import.meta.env.BASE_URL}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null)
	const [isReady, setIsReady] = useState(!isSupabaseConfigured)

	useEffect(() => {
		if (!supabase) return

		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session)
			setIsReady(true)
		})

		const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
			setSession(next)
			setIsReady(true)
		})

		return () => sub.subscription.unsubscribe()
	}, [])

	const value = useMemo<AuthContextValue>(
		() => ({
			isReady,
			isConfigured: isSupabaseConfigured,
			session,
			user: session?.user ?? null,

			async signUp(email, password) {
				if (!supabase) throw new Error('QTrace is not configured for accounts.')
				const { data, error } = await supabase.auth.signUp({
					email,
					password,
					options: { emailRedirectTo: redirectUrl() },
				})
				if (error) throw error
				// With email confirmation on, signUp returns a user but no session.
				return { needsVerification: !data.session }
			},

			async signIn(email, password) {
				if (!supabase) throw new Error('QTrace is not configured for accounts.')
				const { error } = await supabase.auth.signInWithPassword({
					email,
					password,
				})
				if (error) throw error
			},

			async signOut() {
				if (!supabase) return
				const { error } = await supabase.auth.signOut()
				// A refused or unreachable server must not leave the app looking
				// signed in with the account's data on screen. Drop the session
				// here so the signed-out state is reached either way.
				if (error) {
					setSession(null)
					throw error
				}
			},
		}),
		[isReady, session],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
	return ctx
}
