import type { GuinierResult, PorodResult, SaxsData } from '../types/saxs'
import { frameIntensity } from './secSaxs'

const APP_VERSION = '0.1.0'
const EXPORT_FORMAT_VERSION = 2

export interface ExportSession {
	frames: SaxsData[]
	isSec: boolean
	bufferRange: [number, number]
	signalRange: [number, number]
	bufferCurve: SaxsData | null
	signalCurve: SaxsData | null
	activeCurve: SaxsData | null
	guinierResult: GuinierResult | null
	porodResult: PorodResult | null
}

// ── Formatting helpers ────────────────────────────────────────────────────

/**
 * RFC 4180 CSV cell quoting. Quotes only when needed and escapes embedded
 * double-quotes by doubling. Returns '' for null/undefined so empty cells
 * stay empty rather than the string "undefined".
 */
function csvCell(v: string | number | boolean | null | undefined): string {
	if (v === null || v === undefined) return ''
	const s = typeof v === 'string' ? v : String(v)
	if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
	return s
}

/**
 * Format a derived numeric value (Rg, I0, R², etc.) with stable scientific
 * precision. Uses toPrecision so small/large magnitudes don't get clipped to
 * "0.0000" by toFixed. Non-finite values become an empty cell.
 */
function fmtNum(v: number | null | undefined, sig = 6): string {
	if (v === null || v === undefined) return ''
	if (!Number.isFinite(v)) return ''
	if (v === 0) return '0'
	return Number(v).toPrecision(sig)
}

/**
 * Format raw analysis data (q, I, err arrays) with higher precision so the
 * CSV is a faithful, reproducible copy of the IEEE-754 doubles in the model.
 */
function fmtRaw(v: number): string {
	if (!Number.isFinite(v)) return ''
	if (v === 0) return '0'
	return Number(v).toPrecision(12)
}

function csvRow(cells: Array<string | number | boolean | null | undefined>): string {
	return cells.map(csvCell).join(',')
}

function rangeLabel(r: [number, number]): string {
	// 1-based, inclusive, matches the SEC slider UI labels (#1–#N).
	return `${r[0] + 1}-${r[1] + 1}`
}

function safeStem(name: string | undefined): string {
	if (!name) return 'qtrace'
	return name.replace(/\.(dat|txt|csv)$/i, '').replace(/[^A-Za-z0-9_.-]+/g, '_')
}

// ── Section builders ──────────────────────────────────────────────────────

function buildMetadataSection(
	session: ExportSession,
	exportedAt: string,
): string[] {
	const { frames, isSec, bufferRange, signalRange, guinierResult, activeCurve } =
		session
	const sampleId = frames[0]?.filename ?? activeCurve?.filename ?? 'unknown'

	const lines: string[] = []
	lines.push('# QTrace SAXS analysis export')
	lines.push(csvRow(['# key', 'value']))
	lines.push(csvRow(['analysis_version', APP_VERSION]))
	lines.push(csvRow(['export_format_version', EXPORT_FORMAT_VERSION]))
	lines.push(csvRow(['exported_at', exportedAt]))
	lines.push(csvRow(['mode', isSec ? 'sec' : 'single_frame']))
	lines.push(csvRow(['sample_id', sampleId]))
	lines.push(csvRow(['n_frames_loaded', frames.length]))

	if (isSec) {
		const bN = bufferRange[1] - bufferRange[0] + 1
		const sN = signalRange[1] - signalRange[0] + 1
		lines.push(csvRow(['buffer_frames_1based', rangeLabel(bufferRange)]))
		lines.push(csvRow(['buffer_n_frames_averaged', bN]))
		lines.push(csvRow(['signal_frames_1based', rangeLabel(signalRange)]))
		lines.push(csvRow(['signal_n_frames_averaged', sN]))
		lines.push(csvRow(['subtraction', 'signal_avg - buffer_avg']))
	}

	if (activeCurve) {
		lines.push(csvRow(['active_curve_n_points', activeCurve.q.length]))
		lines.push(csvRow(['active_curve_q_min_inv_A', fmtNum(activeCurve.q[0])]))
		lines.push(
			csvRow([
				'active_curve_q_max_inv_A',
				fmtNum(activeCurve.q[activeCurve.q.length - 1]),
			]),
		)
	}

	if (guinierResult && activeCurve) {
		const { iMin, iMax } = guinierResult
		lines.push(csvRow(['guinier_fit_index_min_0based', iMin]))
		lines.push(csvRow(['guinier_fit_index_max_0based', iMax]))
		lines.push(
			csvRow(['guinier_fit_q_min_inv_A', fmtNum(activeCurve.q[iMin])]),
		)
		lines.push(
			csvRow(['guinier_fit_q_max_inv_A', fmtNum(activeCurve.q[iMax])]),
		)
	}

	return lines
}

function buildGuinierSection(
	session: ExportSession,
): string[] {
	const { guinierResult, activeCurve } = session
	if (!guinierResult || !activeCurve) return []

	const { Rg, dRg, I0, dI0, qRgMax, fit, iMin, iMax, xs } = guinierResult
	const qMin = activeCurve.q[iMin]
	const qMaxFit = activeCurve.q[iMax]
	const qRgMin = Number.isFinite(Rg) ? qMin * Rg : NaN

	const qRgValid = Number.isFinite(qRgMax) && qRgMax <= 1.3
	const rgValid = Number.isFinite(Rg) && fit.slope < 0

	const lines: string[] = []
	lines.push('')
	lines.push('# Section: Guinier')
	lines.push(csvRow(['metric', 'value', 'uncertainty', 'units']))
	lines.push(csvRow(['Rg', fmtNum(Rg), fmtNum(dRg), 'Angstrom']))
	lines.push(csvRow(['I0', fmtNum(I0), fmtNum(dI0), 'intensity']))
	lines.push(csvRow(['qRg_min', fmtNum(qRgMin), '', 'dimensionless']))
	lines.push(csvRow(['qRg_max', fmtNum(qRgMax), '', 'dimensionless']))
	lines.push(csvRow(['R2', fmtNum(fit.r2), '', 'dimensionless']))
	lines.push(csvRow(['slope', fmtNum(fit.slope), '', 'A^2']))
	lines.push(csvRow(['intercept', fmtNum(fit.intercept), '', 'ln(intensity)']))
	lines.push(csvRow(['n_points_used', xs.length, '', '']))
	lines.push(csvRow(['fit_q_min', fmtNum(qMin), '', 'inv_A']))
	lines.push(csvRow(['fit_q_max', fmtNum(qMaxFit), '', 'inv_A']))
	lines.push(csvRow(['rg_valid', rgValid ? 'true' : 'false', '', '']))
	lines.push(csvRow(['qRg_max_valid', qRgValid ? 'true' : 'false', '', '']))

	return lines
}

function buildGuinierPointsSection(session: ExportSession): string[] {
	const { guinierResult, activeCurve } = session
	if (!guinierResult || !activeCurve) return []

	const { xs, ys, fit, iMin, iMax } = guinierResult
	const lines: string[] = []
	lines.push('')
	lines.push('# Section: Guinier_Points (points actually used in the fit)')
	lines.push(
		csvRow(['source_index_0based', 'q_inv_A', 'q_squared', 'ln_I', 'ln_I_fit', 'residual']),
	)

	// xs contains q² for the *kept* points (those with I > 0 in [iMin,iMax]).
	// Walk the source range and emit only the points that survived the I > 0
	// filter in computeGuinier — keeps the export aligned with the fit.
	let k = 0
	for (let i = iMin; i <= iMax; i++) {
		if (activeCurve.I[i] <= 0) continue
		const x = xs[k]
		const y = ys[k]
		const yFit = fit.slope * x + fit.intercept
		lines.push(
			csvRow([
				i,
				fmtRaw(activeCurve.q[i]),
				fmtRaw(x),
				fmtRaw(y),
				fmtRaw(yFit),
				fmtRaw(y - yFit),
			]),
		)
		k++
	}
	return lines
}

function buildPorodSection(session: ExportSession): string[] {
	const { porodResult } = session
	if (!porodResult) return []

	const lines: string[] = []
	lines.push('')
	lines.push('# Section: Porod')
	lines.push(csvRow(['metric', 'value', 'units']))
	lines.push(
		csvRow([
			'porod_invariant',
			fmtNum(porodResult.porodInvariant),
			'intensity*inv_A^3',
		]),
	)
	lines.push(
		csvRow(['porod_volume', fmtNum(porodResult.porodVolume), 'Angstrom^3']),
	)
	return lines
}

function buildSecChromatogramSection(session: ExportSession): string[] {
	const { frames, isSec, bufferRange, signalRange } = session
	if (!isSec) return []

	const [bS, bE] = bufferRange
	const [sS, sE] = signalRange

	const lines: string[] = []
	lines.push('')
	lines.push('# Section: SEC_Chromatogram')
	lines.push(
		csvRow([
			'frame_index_1based',
			'frame_index_0based',
			'filename',
			'mean_intensity',
			'in_buffer',
			'in_signal',
			'assignment',
		]),
	)

	for (let i = 0; i < frames.length; i++) {
		const inBuffer = i >= bS && i <= bE
		const inSignal = i >= sS && i <= sE
		// Signal wins if both ranges overlap (matches the SEC viewer colouring).
		const assignment = inSignal
			? 'signal'
			: inBuffer
				? 'buffer'
				: 'excluded'
		lines.push(
			csvRow([
				i + 1,
				i,
				frames[i].filename ?? `frame_${i + 1}`,
				fmtNum(frameIntensity(frames[i])),
				inBuffer ? 'true' : 'false',
				inSignal ? 'true' : 'false',
				assignment,
			]),
		)
	}
	return lines
}

function buildScatteringCurveSection(session: ExportSession): string[] {
	const { activeCurve, isSec, guinierResult } = session
	if (!activeCurve) return []

	const iMin = guinierResult?.iMin
	const iMax = guinierResult?.iMax

	const lines: string[] = []
	lines.push('')
	lines.push(
		`# Section: Active_Scattering_Curve (${isSec ? 'buffer-subtracted average' : 'loaded frame'})`,
	)
	lines.push(
		csvRow(['index_0based', 'q_inv_A', 'I', 'err', 'in_guinier_fit_range']),
	)

	for (let i = 0; i < activeCurve.q.length; i++) {
		const inFit =
			iMin !== undefined && iMax !== undefined && i >= iMin && i <= iMax
		lines.push(
			csvRow([
				i,
				fmtRaw(activeCurve.q[i]),
				fmtRaw(activeCurve.I[i]),
				fmtRaw(activeCurve.err[i]),
				inFit ? 'true' : 'false',
			]),
		)
	}
	return lines
}

function buildAveragedCurvesSection(session: ExportSession): string[] {
	const { isSec, bufferCurve, signalCurve } = session
	if (!isSec || !bufferCurve || !signalCurve) return []

	const lines: string[] = []
	lines.push('')
	lines.push(
		'# Section: Averaged_Buffer_and_Signal (pre-subtraction inputs)',
	)
	lines.push(
		csvRow([
			'index_0based',
			'q_inv_A',
			'I_buffer_avg',
			'err_buffer_avg',
			'I_signal_avg',
			'err_signal_avg',
		]),
	)

	const n = Math.min(bufferCurve.q.length, signalCurve.q.length)
	for (let i = 0; i < n; i++) {
		lines.push(
			csvRow([
				i,
				fmtRaw(bufferCurve.q[i]),
				fmtRaw(bufferCurve.I[i]),
				fmtRaw(bufferCurve.err[i]),
				fmtRaw(signalCurve.I[i]),
				fmtRaw(signalCurve.err[i]),
			]),
		)
	}
	return lines
}

// ── Public API ────────────────────────────────────────────────────────────

export interface BuiltCsv {
	csv: string
	filename: string
}

export function buildExportCsv(session: ExportSession): BuiltCsv {
	const exportedAt = new Date().toISOString()

	const sections: string[][] = [
		buildMetadataSection(session, exportedAt),
		buildGuinierSection(session),
		buildGuinierPointsSection(session),
		buildPorodSection(session),
		buildSecChromatogramSection(session),
		buildAveragedCurvesSection(session),
		buildScatteringCurveSection(session),
	]

	// Excel/locale-safe newlines (CRLF per RFC 4180), trailing newline included.
	const csv = sections.flat().join('\r\n') + '\r\n'

	const stem = safeStem(session.frames[0]?.filename)
	// Compact UTC timestamp keeps the filename deterministic relative to
	// the embedded `exported_at` metadata field.
	const stamp = exportedAt.replace(/[:.]/g, '-')
	const filename = `qtrace-${stem}-${stamp}.csv`

	return { csv, filename }
}

export function downloadCsv({ csv, filename }: BuiltCsv): void {
	// UTF-8 BOM so Excel respects non-ASCII characters in filenames.
	const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	a.remove()
	URL.revokeObjectURL(url)
}
