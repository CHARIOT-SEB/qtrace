import { describe, expect, it } from 'vitest'
import { buildExportCsv, type ExportSession } from './csvExport'
import { computeGuinier } from './guinier'
import { computePorod } from './porod'
import { averageFrames, subtractBuffer } from './secSaxs'
import { makeGuinierCurve, makeSecRun } from '../test/fixtures'
import type { SaxsData } from '../types/saxs'

/** Split the CSV back into rows, dropping the trailing blank. */
function rows(csv: string): string[] {
	return csv.split('\r\n').slice(0, -1)
}

/** First cell of every row, for locating sections. */
function findRow(csv: string, key: string): string | undefined {
	return rows(csv).find((r) => r.startsWith(`${key},`))
}

function valueOf(csv: string, key: string): string | undefined {
	return findRow(csv, key)?.split(',')[1]
}

/**
 * Data rows of one `# Section: <name>` block - everything after its header row
 * up to the blank line that separates sections. Sections are only bounded by
 * that blank, so a naive slice runs straight into the next block.
 */
function sectionRows(csv: string, name: string): string[] {
	const all = rows(csv)
	const start = all.findIndex((r) => r.startsWith(`# Section: ${name}`))
	if (start === -1) return []
	const body = all.slice(start + 2)
	const end = body.findIndex((r) => r === '' || r.startsWith('# Section:'))
	return end === -1 ? body : body.slice(0, end)
}

function singleFrameSession(overrides: Partial<ExportSession> = {}): ExportSession {
	const curve = makeGuinierCurve(25, { filename: 'lysozyme.dat' })
	const guinierResult = computeGuinier(curve, 0, 30)
	return {
		frames: [curve],
		isSec: false,
		bufferRange: [0, 0],
		signalRange: [0, 0],
		bufferCurve: null,
		signalCurve: null,
		activeCurve: curve,
		guinierResult,
		porodResult: computePorod(curve, guinierResult!),
		...overrides,
	}
}

function secSession(): ExportSession {
	const frames = makeSecRun({ frames: 20, center: 10, sigma: 3 })
	const bufferRange: [number, number] = [0, 4]
	const signalRange: [number, number] = [8, 12]
	const bufferCurve = averageFrames(frames.slice(0, 5))
	const signalCurve = averageFrames(frames.slice(8, 13))
	const activeCurve = subtractBuffer(signalCurve, bufferCurve)
	const guinierResult = computeGuinier(activeCurve, 0, 30)
	return {
		frames,
		isSec: true,
		bufferRange,
		signalRange,
		bufferCurve,
		signalCurve,
		activeCurve,
		guinierResult,
		porodResult: computePorod(activeCurve, guinierResult!),
	}
}

describe('buildExportCsv', () => {
	it('uses CRLF line endings and ends with a newline', () => {
		const { csv } = buildExportCsv(singleFrameSession())
		expect(csv.endsWith('\r\n')).toBe(true)
		expect(csv).toContain('\r\n')
		expect(csv.replace(/\r\n/g, '')).not.toContain('\n')
	})

	it('records the mode and frame count in the metadata block', () => {
		expect(valueOf(buildExportCsv(singleFrameSession()).csv, 'mode')).toBe(
			'single_frame',
		)
		expect(valueOf(buildExportCsv(secSession()).csv, 'mode')).toBe('sec')
		expect(valueOf(buildExportCsv(secSession()).csv, 'n_frames_loaded')).toBe(
			'20',
		)
	})

	it('reports Guinier results that match the analysis', () => {
		const session = singleFrameSession()
		const { csv } = buildExportCsv(session)
		const rg = Number(valueOf(csv, 'Rg'))

		expect(rg).toBeCloseTo(session.guinierResult!.Rg, 4)
		expect(valueOf(csv, 'rg_valid')).toBe('true')
		expect(valueOf(csv, 'qRg_max_valid')).toBe('true')
	})

	it('flags an invalid fit rather than exporting it silently', () => {
		const rising: SaxsData = {
			q: [0.01, 0.02, 0.03, 0.04, 0.05],
			I: [10, 20, 30, 40, 50],
			err: [1, 1, 1, 1, 1],
		}
		const guinierResult = computeGuinier(rising, 0, 4)
		const { csv } = buildExportCsv(
			singleFrameSession({
				frames: [rising],
				activeCurve: rising,
				guinierResult,
				porodResult: null,
			}),
		)
		expect(valueOf(csv, 'rg_valid')).toBe('false')
		// A NaN Rg must leave the cell empty, never the string "NaN".
		expect(findRow(csv, 'Rg')).toBe('Rg,,,Angstrom')
	})

	it('emits one fit-point row per point actually used, skipping I <= 0', () => {
		const curve = makeGuinierCurve(25)
		const holed: SaxsData = { ...curve, I: [...curve.I] }
		holed.I[5] = -1 // dropped by computeGuinier's I > 0 filter

		const guinierResult = computeGuinier(holed, 0, 20)!
		const { csv } = buildExportCsv(
			singleFrameSession({
				frames: [holed],
				activeCurve: holed,
				guinierResult,
				porodResult: null,
			}),
		)

		const pointRows = sectionRows(csv, 'Guinier_Points')

		expect(pointRows).toHaveLength(guinierResult.xs.length)
		expect(pointRows.map((r) => Number(r.split(',')[0]))).not.toContain(5)
	})

	it('keeps residuals consistent with the exported fit line', () => {
		const session = singleFrameSession()
		const { csv } = buildExportCsv(session)
		const first = sectionRows(csv, 'Guinier_Points')[0].split(',')
		const [, , , lnI, lnIFit, residual] = first.map(Number)
		expect(lnI - lnIFit).toBeCloseTo(residual, 10)
	})

	it('assigns SEC frames, letting signal win any overlap', () => {
		const session = secSession()
		session.bufferRange = [0, 9]
		session.signalRange = [8, 12]
		const { csv } = buildExportCsv(session)

		const frameRows = sectionRows(csv, 'SEC_Chromatogram')
		expect(frameRows).toHaveLength(20)

		// Frame index 9 (1-based 10) is in both ranges.
		const overlap = frameRows[9].split(',')
		expect(overlap[4]).toBe('true') // in_buffer
		expect(overlap[5]).toBe('true') // in_signal
		expect(overlap[6]).toBe('signal') // assignment
		expect(frameRows[0].split(',')[6]).toBe('buffer')
		expect(frameRows[19].split(',')[6]).toBe('excluded')
	})

	it('includes the pre-subtraction buffer and signal averages only for SEC', () => {
		expect(buildExportCsv(secSession()).csv).toContain(
			'# Section: Averaged_Buffer_and_Signal',
		)
		expect(buildExportCsv(singleFrameSession()).csv).not.toContain(
			'# Section: Averaged_Buffer_and_Signal',
		)
	})

	it('omits the Porod section when there is no result', () => {
		const { csv } = buildExportCsv(
			singleFrameSession({ porodResult: null }),
		)
		expect(csv).not.toContain('# Section: Porod')
	})

	it('quotes cells containing commas or quotes (RFC 4180)', () => {
		const curve = makeGuinierCurve(25, { filename: 'weird,name".dat' })
		const { csv } = buildExportCsv(
			singleFrameSession({ frames: [curve], activeCurve: curve }),
		)
		expect(csv).toContain('sample_id,"weird,name"".dat"')
	})

	it('sanitises the filename stem and stamps it with the export time', () => {
		const curve = makeGuinierCurve(25, { filename: 'my sample (run 2).dat' })
		const { filename } = buildExportCsv(
			singleFrameSession({ frames: [curve], activeCurve: curve }),
		)
		expect(filename).toMatch(
			/^qtrace-my_sample_run_2_-\d{4}-\d{2}-\d{2}T[\d-]+Z\.csv$/,
		)
	})
})
