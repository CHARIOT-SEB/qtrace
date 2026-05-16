import { Button, Icon } from '@blueprintjs/core'
import type { HistoryEntry, SessionExport } from '../types/history'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

interface Props {
  entries: HistoryEntry[]
  activeId: string | null
  onRestore: (id: string) => void
  onExport: () => void
  onImport: (data: SessionExport) => void
  onClose: () => void
}

export function HistoryPanel({
  entries,
  activeId,
  onRestore,
  onExport,
  onImport,
  onClose,
}: Props) {
  function handleImportClick() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          onImport(JSON.parse(e.target?.result as string) as SessionExport)
        } catch {
          // ignore malformed JSON
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const reversed = [...entries].reverse()

  return (
    <div className='history-panel'>
      <div className='history-panel-header'>
        <span className='history-panel-title'>Snapshots</span>
        <div style={{ display: 'flex', gap: 2 }}>
          <Button
            minimal
            small
            icon='export'
            onClick={onExport}
            disabled={entries.length === 0}
            title='Export snapshots as JSON'
          />
          <Button
            minimal
            small
            icon='import'
            onClick={handleImportClick}
            title='Import snapshots from JSON'
          />
          <Button minimal small icon='cross' onClick={onClose} />
        </div>
      </div>

      <div className='history-panel-entries'>
        {entries.length === 0 ? (
          <p className='history-empty'>No snapshots saved yet.</p>
        ) : (
          reversed.map((entry) => {
            const isActive = entry.id === activeId
            return (
              <div
                key={entry.id}
                className={[
                  'history-entry',
                  isActive ? 'history-entry--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onRestore(entry.id)}
                title='Click to restore this snapshot'
              >
                <div className='history-entry-top'>
                  <Icon icon='bookmark' size={12} className='history-entry-icon' />
                  <span className='history-entry-label'>{entry.name ?? entry.label}</span>
                </div>
                <div className='history-entry-time'>{formatTime(entry.timestamp)}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
