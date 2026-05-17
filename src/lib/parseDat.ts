import type { SaxsData } from '../types/saxs'

/**
 * Parse a SAXS .dat file.
 *
 * Expected format: whitespace- or comma-separated columns of `q  I(q)  [error]`.
 * Lines starting with `#`, `//`, or any letter are treated as comments/headers
 * and skipped. Error column is optional - if missing, we estimate it as 1% of I.
 */
export function parseDat(text: string, filename?: string): SaxsData | null {
	const q: number[] = []
	const I: number[] = []
	const err: number[] = []

	const lines = text.split(/\r?\n/)
	for (const raw of lines) {
		const line = raw.trim()
		if (!line) continue
		if (line.startsWith('#') || line.startsWith('//')) continue
		if (/^[A-Za-z]/.test(line)) continue // header rows

		const parts = line.split(/[\s,]+/).map(Number)
		if (parts.length < 2) continue
		if (!Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) continue

		q.push(parts[0])
		I.push(parts[1])
		err.push(
			parts.length >= 3 && Number.isFinite(parts[2])
				? parts[2]
				: Math.abs(parts[1]) * 0.01,
		)
	}

	if (q.length === 0) return null
	return { q, I, err, filename }
}
