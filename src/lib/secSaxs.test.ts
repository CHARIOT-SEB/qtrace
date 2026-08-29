import { describe, expect, it } from 'vitest'
import {
	autoDetectRegions,
	averageFrames,
	frameIntensity,
	subtractBuffer,
} from './secSaxs'
import { makeGuinierCurve, makeSecRun } from '../test/fixtures'
import type { SaxsData } from '../types/saxs'

const curve = (I: number[], err: number[]): SaxsData => ({
	q: I.map((_, i) => 0.01 * (i + 1)),
	I,
	err,
})

describe('averageFrames', () => {
	it('averages intensities point by point', () => {
		const avg = averageFrames([
			curve([10, 20], [1, 1]),
			curve([20, 40], [1, 1]),
			curve([30, 60], [1, 1]),
		])
		expect(avg.I).toEqual([20, 40])
	})

	it('propagates error as sigma / sqrt(n) for equal error bars', () => {
		const n = 4
		const frames = Array.from({ length: n }, () => curve([100], [2]))
		const avg = averageFrames(frames)
		expect(avg.err[0]).toBeCloseTo(2 / Math.sqrt(n), 12)
	})

	it('adds errors in quadrature when they differ', () => {
		const avg = averageFrames([curve([100], [3]), curve([100], [4])])
		expect(avg.err[0]).toBeCloseTo(Math.sqrt(9 + 16) / 2, 12)
	})

	it('labels the result with the frame count and keeps the q grid', () => {
		const frames = [curve([1, 2], [1, 1]), curve([3, 4], [1, 1])]
		const avg = averageFrames(frames)
		expect(avg.filename).toBe('avg (2 frames)')
		expect(avg.q).toEqual(frames[0].q)
	})

	it('throws on an empty frame list', () => {
		expect(() => averageFrames([])).toThrow('No frames to average')
	})
})

describe('subtractBuffer', () => {
	it('subtracts intensities and combines errors in quadrature', () => {
		const out = subtractBuffer(curve([100, 50], [3, 3]), curve([40, 10], [4, 4]))
		expect(out.I).toEqual([60, 40])
		expect(out.err[0]).toBeCloseTo(5, 12)
		expect(out.filename).toBe('subtracted')
	})

	it('allows the difference to go negative', () => {
		// Over-subtraction at high q is real and must not be clamped away.
		const out = subtractBuffer(curve([10], [1]), curve([25], [1]))
		expect(out.I[0]).toBe(-15)
	})
})

describe('frameIntensity', () => {
	it('returns the mean intensity of a frame', () => {
		expect(frameIntensity(curve([1, 2, 3, 4], [1, 1, 1, 1]))).toBe(2.5)
	})
})

describe('autoDetectRegions', () => {
	it('places the signal on the peak and the buffer just before it', () => {
		const frames = makeSecRun({ frames: 30, center: 14, sigma: 3 })
		const { bufferRange, signalRange } = autoDetectRegions(frames)

		// The peak frame must fall inside the detected signal window.
		expect(signalRange[0]).toBeLessThanOrEqual(14)
		expect(signalRange[1]).toBeGreaterThanOrEqual(14)

		// Buffer sits strictly before the signal and is capped at 6 frames.
		expect(bufferRange[1]).toBeLessThan(signalRange[0])
		expect(bufferRange[1] - bufferRange[0] + 1).toBeLessThanOrEqual(6)
		expect(bufferRange[0]).toBeGreaterThanOrEqual(0)
	})

	it('keeps the buffer in range when the peak starts at the first frame', () => {
		const frames = makeSecRun({ frames: 20, center: 0, sigma: 3 })
		const { bufferRange } = autoDetectRegions(frames)
		expect(bufferRange[0]).toBeGreaterThanOrEqual(0)
		expect(bufferRange[1]).toBeGreaterThanOrEqual(0)
	})

	it('falls back to proportional windows when no frame stands out', () => {
		// A flat run has max === min, so nothing clears the 50% threshold.
		const flat = Array.from({ length: 20 }, () => makeGuinierCurve(30))
		const { bufferRange, signalRange } = autoDetectRegions(flat)
		expect(bufferRange).toEqual([0, 2])
		expect(signalRange).toEqual([8, 13])
	})
})
