import { Button, Icon } from '@blueprintjs/core'
import type { HistoryEntry, SessionExport } from '../types/history'
import {
	Panel,
	PanelBackdrop,
	PanelHeader,
	PanelTitle,
	PanelHeaderActions,
	PanelEntries,
	EmptyNotice,
	Entry,
	EntryTop,
	EntryIcon,
	EntryLabel,
	EntryTime,
} from './HistoryPanel.styles'

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
  onImport,
  onExport,
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
    <>
    <PanelBackdrop onClick={onClose} />
    <Panel>
      <PanelHeader>
        <PanelTitle>Snapshots</PanelTitle>
        <PanelHeaderActions>
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
        </PanelHeaderActions>
      </PanelHeader>

      <PanelEntries>
        {entries.length === 0 ? (
          <EmptyNotice>No snapshots saved yet.</EmptyNotice>
        ) : (
          reversed.map((entry) => {
            const isActive = entry.id === activeId
            return (
              <Entry
                key={entry.id}
                $isActive={isActive}
                onClick={() => onRestore(entry.id)}
                title='Click to restore this snapshot'
              >
                <EntryTop>
                  <EntryIcon>
                    <Icon icon='bookmark' size={12} />
                  </EntryIcon>
                  <EntryLabel $isActive={isActive}>{entry.name ?? entry.label}</EntryLabel>
                </EntryTop>
                <EntryTime>{formatTime(entry.timestamp)}</EntryTime>
              </Entry>
            )
          })
        )}
      </PanelEntries>
    </Panel>
    </>
  )
}
