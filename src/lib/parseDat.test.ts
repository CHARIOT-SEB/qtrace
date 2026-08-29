import { describe, expect, it } from 'vitest'
import { parseDat } from './parseDat'

describe('parseDat', () => {
	it('parses whitespace-separated q, I, err columns', () => {
		const d = parseDat('0.01 100.0 1.0\n0.02 90.0 0.9\n0.03 80.0 0.8')
		expect(d).not.toBeNull()
		expect(d!.q).toEqual([0.01, 0.02, 0.03])
		expect(d!.I).toEqual([100, 90, 80])
		expect(d!.err).toEqual([1, 0.9, 0.8])
	})

	it('parses comma-separated columns', () => {
		const d = parseDat('0.01,100.0,1.0\n0.02,90.0,0.9')
		expect(d!.q).toEqual([0.01, 0.02])
		expect(d!.I).toEqual([100, 90])
	})

	it('handles mixed tabs and multiple spaces', () => {
		const d = parseDat('0.01\t100.0   1.0\n  0.02  \t 90.0\t0.9  ')
		expect(d!.q).toEqual([0.01, 0.02])
		expect(d!.err).toEqual([1, 0.9])
	})

	it('skips comment lines and header rows', () => {
		const text = [
			'# Sample: lysozyme',
			'// exposure 1.0 s',
			'q I(q) Error',
			'0.01 100.0 1.0',
			'',
			'   ',
			'0.02 90.0 0.9',
		].join('\n')
		const d = parseDat(text)
		expect(d!.q).toHaveLength(2)
	})

	it('estimates err as 1% of |I| when the column is absent', () => {
		const d = parseDat('0.01 100.0\n0.02 -50.0')
		expect(d!.err).toEqual([1, 0.5])
	})

	it('estimates err when the third column is not a number', () => {
		const d = parseDat('0.01 100.0 nan')
		expect(d!.err).toEqual([1])
	})

	it('preserves negative intensities', () => {
		// Buffer subtraction legitimately produces negative I at high q.
		const d = parseDat('0.01 100.0 1.0\n0.4 -0.5 0.2')
		expect(d!.I).toEqual([100, -0.5])
	})

	it('reads scientific notation', () => {
		const d = parseDat('1.0e-2 1.5E3 2.5e1')
		expect(d!.q).toEqual([0.01])
		expect(d!.I).toEqual([1500])
		expect(d!.err).toEqual([25])
	})

	it('skips rows with fewer than two columns or non-finite values', () => {
		const d = parseDat('0.01 100.0 1.0\n0.02\ninf inf\n0.03 80.0 0.8')
		expect(d!.q).toEqual([0.01, 0.03])
	})

	it('returns null when nothing parses', () => {
		expect(parseDat('')).toBeNull()
		expect(parseDat('# only a comment\n\n')).toBeNull()
		expect(parseDat('q I err')).toBeNull()
	})

	it('handles CRLF line endings', () => {
		const d = parseDat('0.01 100.0 1.0\r\n0.02 90.0 0.9\r\n')
		expect(d!.q).toHaveLength(2)
	})

	it('carries the filename through', () => {
		expect(parseDat('0.01 100 1', 'frame_001.dat')!.filename).toBe(
			'frame_001.dat',
		)
	})
})
