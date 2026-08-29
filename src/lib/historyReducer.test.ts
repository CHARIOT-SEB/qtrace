import { describe, expect, it } from 'vitest'
import { historyReducer, initialHistoryState } from './historyReducer'
import type { HistoryEntry } from '../types/history'

function entry(id: string): HistoryEntry {
	return {
		id,
		timestamp: 0,
		actionType: 'named_snapshot',
		label: id,
		params: {},
		snapshot: {
			frames: [],
			bufferRange: [0, 0],
			signalRange: [0, 0],
			iMin: 2,
			iMax: 20,
		},
		isNamed: true,
		name: id,
	}
}

/** Build a state holding entries a, b, c with `activeId` pointing at `active`. */
function stateOf(ids: string[], active: string | null) {
	return { entries: ids.map(entry), activeId: active }
}

describe('historyReducer', () => {
	it('appends an entry and makes it active', () => {
		const s = historyReducer(initialHistoryState, {
			type: 'push',
			entry: entry('a'),
		})
		expect(s.entries.map((e) => e.id)).toEqual(['a'])
		expect(s.activeId).toBe('a')
	})

	it('truncates the future when acting from a restored entry', () => {
		const s = historyReducer(stateOf(['a', 'b', 'c'], 'a'), {
			type: 'push',
			entry: entry('d'),
		})
		expect(s.entries.map((e) => e.id)).toEqual(['a', 'd'])
		expect(s.activeId).toBe('d')
	})

	it('keeps the whole timeline when acting from the newest entry', () => {
		const s = historyReducer(stateOf(['a', 'b', 'c'], 'c'), {
			type: 'push',
			entry: entry('d'),
		})
		expect(s.entries.map((e) => e.id)).toEqual(['a', 'b', 'c', 'd'])
	})

	it('appends when the active id is unknown', () => {
		const s = historyReducer(stateOf(['a', 'b'], 'missing'), {
			type: 'push',
			entry: entry('c'),
		})
		expect(s.entries.map((e) => e.id)).toEqual(['a', 'b', 'c'])
	})

	it('moves the active pointer on restore without touching entries', () => {
		const before = stateOf(['a', 'b'], 'b')
		const s = historyReducer(before, { type: 'restore', id: 'a' })
		expect(s.activeId).toBe('a')
		expect(s.entries).toBe(before.entries)
	})

	it('renames an entry and trims whitespace', () => {
		const s = historyReducer(stateOf(['a'], 'a'), {
			type: 'name',
			id: 'a',
			name: '  peak 1  ',
		})
		expect(s.entries[0].name).toBe('peak 1')
		expect(s.entries[0].isNamed).toBe(true)
	})

	it('clears the name when given only whitespace', () => {
		const s = historyReducer(stateOf(['a'], 'a'), {
			type: 'name',
			id: 'a',
			name: '   ',
		})
		expect(s.entries[0].name).toBeUndefined()
		expect(s.entries[0].isNamed).toBe(false)
	})

	it('resets on clear and replaces wholesale on set', () => {
		expect(historyReducer(stateOf(['a'], 'a'), { type: 'clear' })).toEqual(
			initialHistoryState,
		)

		const replaced = historyReducer(stateOf(['a'], 'a'), {
			type: 'set',
			entries: [entry('x'), entry('y')],
			activeId: 'y',
		})
		expect(replaced.entries.map((e) => e.id)).toEqual(['x', 'y'])
		expect(replaced.activeId).toBe('y')
	})
})
