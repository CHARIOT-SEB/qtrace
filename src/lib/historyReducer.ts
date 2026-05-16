import type { HistoryEntry } from '../types/history'

export interface HistoryState {
  entries: HistoryEntry[]
  activeId: string | null
}

export const initialHistoryState: HistoryState = { entries: [], activeId: null }

export type HistoryAction =
  | { type: 'push'; entry: HistoryEntry }
  | { type: 'restore'; id: string }
  | { type: 'name'; id: string; name: string }
  | { type: 'clear' }
  | { type: 'set'; entries: HistoryEntry[]; activeId: string | null }

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'push': {
      // If we've restored to a past entry and then act, truncate the future.
      const activeIdx = state.entries.findIndex((e) => e.id === state.activeId)
      const base =
        activeIdx >= 0 && activeIdx < state.entries.length - 1
          ? state.entries.slice(0, activeIdx + 1)
          : state.entries
      return { entries: [...base, action.entry], activeId: action.entry.id }
    }
    case 'restore':
      return { ...state, activeId: action.id }
    case 'name': {
      const trimmed = action.name.trim()
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.id
            ? { ...e, isNamed: trimmed.length > 0, name: trimmed || undefined }
            : e,
        ),
      }
    }
    case 'clear':
      return initialHistoryState
    case 'set':
      return { entries: action.entries, activeId: action.activeId }
  }
}
