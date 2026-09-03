import { useEffect, useState } from 'react'
import { breakpoints } from '../theme'

/**
 * Subscribe to a media query.
 *
 * Returns false during SSR/first paint where matchMedia is unavailable, then
 * settles on the real value. Anything that must not flash should be driven by
 * CSS instead - this is for cases where the markup itself differs.
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() =>
		typeof window !== 'undefined' && typeof window.matchMedia === 'function'
			? window.matchMedia(query).matches
			: false,
	)

	useEffect(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return
		const mql = window.matchMedia(query)
		const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
		setMatches(mql.matches)
		mql.addEventListener('change', onChange)
		return () => mql.removeEventListener('change', onChange)
	}, [query])

	return matches
}

/**
 * Phone-shaped viewport. The plots are stacked into one tabbed panel here
 * rather than rendered all at once, so this has to be a real JS decision -
 * CSS alone would still mount four charts and pay for four Recharts layouts.
 */
export function useIsPhone(): boolean {
	return useMediaQuery(`(max-width: ${breakpoints.md})`)
}
