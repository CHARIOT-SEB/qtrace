/**
 * Gzip helpers for dataset blobs.
 *
 * Frame arrays are the heavy part of a session - a few hundred SEC frames is
 * tens of megabytes of JSON, and roughly 10x smaller gzipped. CompressionStream
 * is native in every current browser; older Safari falls back to plain JSON so
 * the feature degrades in size rather than breaking.
 */

const GZIP = 'gzip'

export const supportsGzip =
	typeof globalThis.CompressionStream !== 'undefined' &&
	typeof globalThis.DecompressionStream !== 'undefined'

/** File extension matching how `packJson` encoded the payload. */
export const datasetExtension = supportsGzip ? 'json.gz' : 'json'

/** Serialise a value to a Blob, gzipped where the browser supports it. */
export async function packJson(value: unknown): Promise<Blob> {
	const json = JSON.stringify(value)
	if (!supportsGzip) return new Blob([json], { type: 'application/json' })

	const stream = new Blob([json])
		.stream()
		.pipeThrough(new CompressionStream(GZIP))
	return new Response(stream).blob()
}

/** Inverse of `packJson` - detects gzip from the magic bytes, so either form reads back. */
export async function unpackJson<T>(blob: Blob): Promise<T> {
	const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer())
	const isGzipped = head[0] === 0x1f && head[1] === 0x8b

	if (!isGzipped) return JSON.parse(await blob.text()) as T

	if (!supportsGzip) {
		throw new Error('This browser cannot decompress the saved dataset.')
	}
	const stream = blob.stream().pipeThrough(new DecompressionStream(GZIP))
	return JSON.parse(await new Response(stream).text()) as T
}

/** Hex SHA-256 of a string, used to avoid re-uploading identical frame data. */
export async function sha256Hex(text: string): Promise<string> {
	const bytes = new TextEncoder().encode(text)
	const digest = await crypto.subtle.digest('SHA-256', bytes)
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}
