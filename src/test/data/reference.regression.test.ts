import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { autoFindGuinierRegion, computeGuinier } from '../../lib/guinier'
import { parseDat } from '../../lib/parseDat'

/**
 * Regression against real datasets. The synthetic fixtures prove the maths;
 * these prove the pipeline copes with real files end to end.
 *
 * Cases are discovered from two directories:
 *
 *   src/test/data/         committed, redistributable reference data
 *   src/test/data/local/   gitignored, for real experimental data
 *
 * Both are optional. With neither present the whole block skips, which is what
 * CI sees. See README.md in this directory.
 */

interface Reference {
	sample: string
	source?: string
	url?: string
	licence?: string
	/** Units of the q column. Declared, never guessed. */
	qUnits: 'A^-1' | 'nm^-1'
	/** Expected radius of gyration, in the length unit implied by `qUnits`. */
	Rg: number
	/** Absolute window around `Rg` the fit must land within. */
	RgTolerance: number
	I0?: number | null
	I0Tolerance?: number | null
}

interface Case {
	name: string
	meta: Reference
	text: string
}

const here = dirname(fileURLToPath(import.meta.url))
const LOCAL_DIR = join(here, 'local')

/** Every `<name>.dat` in `dir` that has a matching `<name>.json` beside it. */
function casesIn(dir: string, label: string): Case[] {
	if (!existsSync(dir)) return []
	return readdirSync(dir)
		.filter((f) => f.endsWith('.dat'))
		.map((f) => ({ f, stem: f.slice(0, -4) }))
		.filter(({ stem }) => existsSync(join(dir, `${stem}.json`)))
		.map(({ f, stem }) => ({
			name: `${label}/${stem}`,
			meta: JSON.parse(readFileSync(join(dir, `${stem}.json`), 'utf8')),
			text: readFileSync(join(dir, f), 'utf8'),
		}))
}

const cases = [...casesIn(here, 'public'), ...casesIn(LOCAL_DIR, 'local')]

describe('private reference data stays out of the repository', () => {
	// A guard, not a data test: this one always runs. Real experimental data is
	// often confidential, so the ignore rule protecting it must not be able to
	// disappear in a refactor without a test going red.
	it('keeps the local dataset directory gitignored', () => {
		const ignore = readFileSync(join(here, '..', '..', '..', '.gitignore'), 'utf8')
		expect(ignore).toContain('src/test/data/local/')
	})
})

describe.skipIf(cases.length === 0)('reference dataset regression', () => {
	it.each(cases)('$name parses into a usable curve', ({ text, meta }) => {
		const data = parseDat(text, 'reference.dat')
		expect(data).not.toBeNull()
		expect(data!.q.length).toBeGreaterThan(50)
		expect(data!.q.every(Number.isFinite)).toBe(true)
		expect(data!.q.every((q, i) => i === 0 || q > data!.q[i - 1])).toBe(true)

		// q units must be declared rather than sniffed. Diamond B21 emits nm^-1,
		// so a magnitude heuristic would reject perfectly good data - and Rg
		// inherits whichever unit q came in.
		expect(['A^-1', 'nm^-1']).toContain(meta.qUnits)
	})

	it.each(cases)(
		'$name auto-finds a Guinier region inside the validity limit',
		({ text }) => {
			const data = parseDat(text)!
			const region = autoFindGuinierRegion(data)
			expect(region).not.toBeNull()
			const r = computeGuinier(data, region!.start, region!.end)!
			expect(r.qRgMax).toBeLessThanOrEqual(1.3)
		},
	)

	it.each(cases)('$name recovers the expected Rg', ({ text, meta }) => {
		const data = parseDat(text)!
		const region = autoFindGuinierRegion(data)!
		const r = computeGuinier(data, region.start, region.end)!

		expect(Number.isFinite(r.Rg)).toBe(true)
		expect(Math.abs(r.Rg - meta.Rg)).toBeLessThanOrEqual(meta.RgTolerance)
		expect(r.fit.r2).toBeGreaterThan(0.95)
		// The uncertainty must be real and small relative to the value itself.
		expect(r.dRg).toBeGreaterThan(0)
		expect(r.dRg / r.Rg).toBeLessThan(0.1)
	})

	it.each(cases.filter((c) => c.meta.I0 != null))(
		'$name recovers the expected I(0)',
		({ text, meta }) => {
			const data = parseDat(text)!
			const region = autoFindGuinierRegion(data)!
			const r = computeGuinier(data, region.start, region.end)!
			expect(Math.abs(r.I0 - meta.I0!)).toBeLessThanOrEqual(meta.I0Tolerance!)
		},
	)
})
