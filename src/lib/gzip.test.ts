import { describe, expect, it } from 'vitest'
import { datasetExtension, packJson, sha256Hex, supportsGzip, unpackJson } from './gzip'
import { makeSecRun } from '../test/fixtures'

describe('packJson / unpackJson', () => {
	it('round-trips a value', async () => {
		const value = { a: 1, b: [1, 2, 3], c: 'text' }
		expect(await unpackJson(await packJson(value))).toEqual(value)
	})

	it('round-trips SEC frames without losing precision', async () => {
		const frames = makeSecRun({ frames: 5 })
		const back = await unpackJson<typeof frames>(await packJson(frames))
		expect(back).toEqual(frames)
		expect(back[0].q[0]).toBe(frames[0].q[0])
	})

	it('compresses frame data substantially', async () => {
		const frames = makeSecRun({ frames: 20 })
		const raw = JSON.stringify(frames).length
		const packed = (await packJson(frames)).size
		expect(packed).toBeLessThan(raw / 2)
	})

	it('writes a gzip magic-number header where supported', async () => {
		const blob = await packJson({ hello: 'world' })
		const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer())
		expect(supportsGzip).toBe(true)
		expect([head[0], head[1]]).toEqual([0x1f, 0x8b])
		expect(datasetExtension).toBe('json.gz')
	})

	it('reads back uncompressed JSON, so old plain blobs still open', async () => {
		const plain = new Blob([JSON.stringify({ legacy: true })], {
			type: 'application/json',
		})
		expect(await unpackJson(plain)).toEqual({ legacy: true })
	})
})

describe('sha256Hex', () => {
	it('matches the known digest of an empty string', async () => {
		expect(await sha256Hex('')).toBe(
			'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
		)
	})

	it('is stable and 64 hex characters wide', async () => {
		const a = await sha256Hex('qtrace')
		expect(a).toMatch(/^[0-9a-f]{64}$/)
		expect(await sha256Hex('qtrace')).toBe(a)
	})

	it('changes when the data changes, which is what dedupe relies on', async () => {
		const frames = makeSecRun({ frames: 3 })
		const first = await sha256Hex(JSON.stringify(frames))
		frames[0].I[0] += 1e-9
		expect(await sha256Hex(JSON.stringify(frames))).not.toBe(first)
	})
})
