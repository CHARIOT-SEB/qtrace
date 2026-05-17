import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { autoFindGuinierRegion } from '../lib/guinier'
import type { SaxsData } from '../types/saxs'

export function useGuinierRange(activeCurve: SaxsData | null) {
	const [iMin, setIMin] = useState(2)
	const [iMax, setIMax] = useState(20)
	// Prevents the filename-change effect from resetting the range during restore/import.
	const skipGuinierResetRef = useRef(false)

	const lo = Math.min(iMin, iMax)
	const hi = Math.max(iMin, iMax)
	const deferredLo = useDeferredValue(lo)
	const deferredHi = useDeferredValue(hi)

	useEffect(() => {
		if (!activeCurve) return
		if (skipGuinierResetRef.current) {
			skipGuinierResetRef.current = false
			return
		}
		setIMin(2)
		setIMax(Math.min(20, activeCurve.q.length - 1))
	}, [activeCurve?.filename])

	function handleAutoFind() {
		if (!activeCurve) return
		const region = autoFindGuinierRegion(activeCurve)
		if (region) {
			setIMin(region.start)
			setIMax(region.end)
		}
	}

	function resetRange(qLength?: number) {
		setIMin(2)
		setIMax(qLength !== undefined ? Math.min(20, qLength - 1) : 20)
	}

	return {
		iMin,
		setIMin,
		iMax,
		setIMax,
		lo,
		hi,
		deferredLo,
		deferredHi,
		handleAutoFind,
		resetRange,
		skipGuinierResetRef,
	}
}
