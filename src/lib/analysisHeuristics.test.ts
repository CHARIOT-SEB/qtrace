import { describe, expect, it } from 'vitest'
import { collectInsights, type AnalysisInsight } from './analysisHeuristics'
import { computeGuinier } from './guinier'
import { makeGuinierCurve } from '../test/fixtures'
import type { SaxsData } from '../types/saxs'

const RG = 25
const curve = makeGuinierCurve(RG)

/** Insight ids raised for a fit over [iMin, iMax] of `data`. */
function idsFor(data: SaxsData, iMin: number, iMax: number): string[] {
	const result = computeGuinier(data, iMin, iMax)
	return collectInsights(data, result!).map((i) => i.id)
}

/** Index of the last point still inside a given q*Rg limit. */
function indexAtQRg(limit: number): number {
	return curve.q.findIndex((q) => q * RG > limit) - 1
}

describe('collectInsights', () => {
	it('reports a clean bill of health for a textbook fit', () => {
		const insights = collectInsights(
			curve,
			computeGuinier(curve, 0, indexAtQRg(1.0))!,
		)
		expect(insights.map((i) => i.id)).toEqual(['overall-ok'])
		expect(insights[0].severity).toBe('info')
	})

	it('escalates from warning to error as the fit passes the qRg limit', () => {
		expect(idsFor(curve, 0, indexAtQRg(1.4))).toContain('qrg-high-warn')
		expect(idsFor(curve, 0, indexAtQRg(1.8))).toContain('qrg-high-error')
	})

	it('notes an over-narrow fit window', () => {
		expect(idsFor(curve, 0, indexAtQRg(0.4))).toContain('qrg-low')
	})

	it('flags a positive slope as physically impossible', () => {
		const rising: SaxsData = {
			q: Array.from({ length: 20 }, (_, i) => 0.01 + i * 0.005),
			I: Array.from({ length: 20 }, (_, i) => 10 + i * 2),
			err: Array.from({ length: 20 }, () => 0.1),
		}
		const insights = collectInsights(rising, computeGuinier(rising, 0, 19)!)
		const qrg = insights.find((i) => i.id === 'qrg-invalid')!
		expect(qrg.severity).toBe('error')
	})

	it('flags a fit built from too few points', () => {
		expect(idsFor(curve, 0, 3)).toContain('points-critical')
		expect(idsFor(curve, 0, 8)).toContain('points-low')
	})

	it('spots a low-q upturn of the kind aggregation produces', () => {
		const aggregated: SaxsData = { ...curve, I: [...curve.I] }
		for (let i = 0; i < 8; i++) aggregated.I[i] *= 1.25
		expect(idsFor(aggregated, 0, indexAtQRg(1.0))).toContain(
			'residual-aggregation',
		)
	})

	it('spots beamstop artefacts below the fit start', () => {
		const artefact: SaxsData = { ...curve, I: [...curve.I] }
		artefact.I[0] = -0.5
		expect(idsFor(artefact, 3, indexAtQRg(1.0))).toContain('lowq-negative')
	})

	it('reports a poor signal-to-noise ratio across the fit range', () => {
		const noisy: SaxsData = { ...curve, err: [...curve.err] }
		// err/I above 20% for the majority of the window is the trigger.
		for (let i = 0; i < 20; i++) noisy.err[i] = noisy.I[i] * 0.5
		expect(idsFor(noisy, 0, indexAtQRg(1.0))).toContain('fit-range-noisy')
	})

	it('reports points dropped from the fit for non-positive intensity', () => {
		const holed: SaxsData = { ...curve, I: [...curve.I] }
		holed.I[4] = -1
		const insights = collectInsights(
			holed,
			computeGuinier(holed, 0, indexAtQRg(1.0))!,
		)
		const dropped = insights.find((i) => i.id === 'fit-range-negative')!
		expect(dropped.severity).toBe('error')
		expect(dropped.message).toContain('1 point')
	})

	it('withholds the all-clear once anything else has fired', () => {
		const ids = idsFor(curve, 0, indexAtQRg(1.8))
		expect(ids).toContain('qrg-high-error')
		expect(ids).not.toContain('overall-ok')
	})

	it('orders errors before warnings before info', () => {
		const messy: SaxsData = { ...curve, I: [...curve.I] }
		for (let i = 0; i < 8; i++) messy.I[i] *= 1.25
		const insights = collectInsights(
			messy,
			computeGuinier(messy, 0, indexAtQRg(1.8))!,
		)
		const rank = { error: 0, warning: 1, info: 2 } as const
		const ranks = insights.map((i: AnalysisInsight) => rank[i.severity])
		expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
	})

	it('never repeats an insight id', () => {
		const ids = idsFor(curve, 0, indexAtQRg(1.8))
		expect(new Set(ids).size).toBe(ids.length)
	})

	it('gives every insight a message and an explanation', () => {
		const insights = collectInsights(curve, computeGuinier(curve, 0, 3)!)
		expect(insights.length).toBeGreaterThan(0)
		for (const i of insights) {
			expect(i.message.length).toBeGreaterThan(20)
			expect(i.explanation.length).toBeGreaterThan(50)
		}
	})
})
