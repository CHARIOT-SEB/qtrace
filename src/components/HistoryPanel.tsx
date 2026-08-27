import { Button, ButtonVariant, Icon, Spinner } from '@blueprintjs/core'
import type { HistoryEntry, SessionExport } from '../types/history'
import type { CloudSnapshot } from '../lib/api/snapshots'
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
	SectionLabel,
	SectionDivider,
	EntryActions,
	SignedOutNotice,
} from './HistoryPanel.styles'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  })
}

export interface CloudPanelProps {
  isConfigured: boolean
  isSignedIn: boolean
  items: CloudSnapshot[]
  isLoading: boolean
  isBusy: boolean
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  /** Upload an existing session snapshot to the account. */
  onUpload: (entry: HistoryEntry) => void
}

interface Props {
  entries: HistoryEntry[]
  activeId: string | null
  onRestore: (id: string) => void
  onExport: () => void
  onImport: (data: SessionExport) => void
  onClose: () => void
  cloud: CloudPanelProps
}

export function HistoryPanel({
  entries,
  activeId,
  onRestore,
  onImport,
  onExport,
  onClose,
  cloud,
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
  const showCloudSection = cloud.isConfigured

  return (
    <>
    <PanelBackdrop onClick={onClose} />
    <Panel>
      <PanelHeader>
        <PanelTitle>Snapshots</PanelTitle>
        <PanelHeaderActions>
          <Button
            variant={ButtonVariant.MINIMAL}
            small
            icon='export'
            onClick={onExport}
            disabled={entries.length === 0}
            title='Export snapshots as JSON'
          />
          <Button
            variant={ButtonVariant.MINIMAL}
            small
            icon='import'
            onClick={handleImportClick}
            title='Import snapshots from JSON'
          />
          <Button variant={ButtonVariant.MINIMAL} small icon='cross' onClick={onClose} />
        </PanelHeaderActions>
      </PanelHeader>

      <PanelEntries>
        {showCloudSection && (
          <>
            <SectionLabel>
              <Icon icon='cloud' size={11} />
              Saved to account
              {cloud.isLoading && <Spinner size={10} />}
            </SectionLabel>

            {!cloud.isSignedIn ? (
              <SignedOutNotice>
                Sign in to keep snapshots beyond this session and reopen them on
                another machine.
              </SignedOutNotice>
            ) : cloud.items.length === 0 && !cloud.isLoading ? (
              <SignedOutNotice>
                Nothing saved to your account yet.
              </SignedOutNotice>
            ) : (
              cloud.items.map((item) => (
                <Entry
                  key={item.id}
                  $isActive={false}
                  onClick={() => cloud.onRestore(item.id)}
                  title='Click to open this saved snapshot'
                >
                  <EntryTop>
                    <EntryIcon>
                      <Icon icon='cloud' size={12} />
                    </EntryIcon>
                    <EntryLabel $isActive={false}>{item.name}</EntryLabel>
                    <EntryActions>
                      <Button
                        variant={ButtonVariant.MINIMAL}
                        small
                        icon='trash'
                        title='Delete from account'
                        disabled={cloud.isBusy}
                        onClick={(e) => {
                          e.stopPropagation()
                          cloud.onDelete(item.id)
                        }}
                      />
                    </EntryActions>
                  </EntryTop>
                  <EntryTime>
                    {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
                    {item.frameCount != null && ` · ${item.frameCount} frames`}
                  </EntryTime>
                </Entry>
              ))
            )}

            <SectionDivider />
            <SectionLabel>
              <Icon icon='history' size={11} />
              This session
            </SectionLabel>
          </>
        )}

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
                  {cloud.isSignedIn && entry.isNamed && (
                    <EntryActions>
                      <Button
                        variant={ButtonVariant.MINIMAL}
                        small
                        icon='cloud-upload'
                        title='Save to my account'
                        disabled={cloud.isBusy}
                        onClick={(e) => {
                          e.stopPropagation()
                          cloud.onUpload(entry)
                        }}
                      />
                    </EntryActions>
                  )}
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
