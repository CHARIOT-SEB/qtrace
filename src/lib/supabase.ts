import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * True when the build has Supabase credentials. The app is usable without them -
 * all account features hide themselves and QTrace behaves exactly as it did
 * before, working purely in-session.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * The anon key is public by design - it only ever grants what row-level security
 * allows. The service_role key must never appear in this repo.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
	? createClient(url, anonKey, {
			auth: {
				persistSession: true,
				autoRefreshToken: true,
				detectSessionInUrl: true,
			},
		})
	: null

/** Narrowing helper for call sites that require a configured client. */
export function requireSupabase(): SupabaseClient {
	if (!supabase) throw new Error('QTrace is not configured for accounts.')
	return supabase
}
