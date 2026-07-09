import { useCallback, useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { Input } from '../components/Input'
import { settingsStore } from '../store/settingsStore'
import { useSettingsOpen } from '../store/useSettings'
import type { KeyStatus, ProviderId, SecureStorageStatus } from '../../../shared/agent'

/*
  SettingsDialog (BL-051) — the app's settings surface. Hosts provider credential management (BYOK):
  the key is set here but stored/used only in main (safeStorage), never read back into the renderer.
  Opened from the native menu (Settings… / Cmd+,) or the agent pane's "no provider" notice.
*/
function statusLabel(status: KeyStatus | null): string {
  if (!status) return 'Checking…'
  if (!status.present) return 'Not connected'
  return status.source === 'env' ? 'Connected (environment variable)' : 'Connected (stored)'
}

function ProviderCredentials({ provider, label }: { provider: ProviderId; label: string }) {
  const [status, setStatus] = useState<KeyStatus | null>(null)
  const [storage, setStorage] = useState<SecureStorageStatus | null>(null)
  const [draft, setDraft] = useState('')

  const refresh = useCallback((): void => {
    void window.sddIde.credentials.status(provider).then(setStatus)
  }, [provider])

  useEffect(() => {
    refresh()
    void window.sddIde.credentials.secureStorageStatus().then(setStorage)
  }, [refresh])

  const save = (): void => {
    const key = draft.trim()
    if (key === '') return
    void window.sddIde.credentials.setKey(provider, key).then(() => {
      setDraft('')
      refresh()
    })
  }

  const clear = (): void => {
    void window.sddIde.credentials.clearKey(provider).then(refresh)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-fg">{label}</span>
        <span className="text-xs text-muted">{statusLabel(status)}</span>
      </div>

      {storage === 'plaintext' || storage === 'unavailable' ? (
        <p className="text-xs text-muted">
          ⚠ Secure OS storage is unavailable here — a key can’t be strongly encrypted at rest.
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Input
          type="password"
          value={draft}
          placeholder="sk-ant-…"
          aria-label={`${label} API key`}
          onChange={(event) => setDraft(event.target.value)}
          onSubmit={save}
        />
        <Button size="sm" onClick={save} disabled={draft.trim() === ''}>
          Save
        </Button>
      </div>

      {status?.present ? (
        status.source === 'stored' ? (
          <Button variant="ghost" size="sm" onClick={clear}>
            Remove stored key
          </Button>
        ) : (
          <p className="text-xs text-muted">
            A key is set via the environment; it takes precedence over any stored key.
          </p>
        )
      ) : null}
    </div>
  )
}

export function SettingsDialog() {
  const open = useSettingsOpen()
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? settingsStore.open() : settingsStore.close())}
      title="Settings"
      description="Provider credentials (BYOK). Keys are stored encrypted on this machine and never leave the main process."
    >
      <ProviderCredentials provider="anthropic" label="Anthropic (Claude)" />
    </Dialog>
  )
}
