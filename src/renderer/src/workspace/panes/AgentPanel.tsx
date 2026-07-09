import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Textarea } from '../../components/Textarea'
import { agentStore, type AgentMessage, type AskMessage } from '../../store/agentStore'
import { settingsStore } from '../../store/settingsStore'
import { useAgentMessages, useAgentStreaming } from '../../store/useAgentMessages'
import { useSettingsOpen } from '../../store/useSettings'
import type { KeyStatus } from '../../../../shared/agent'

/*
  AgentPanel (BL-039) — the app-owned agent surface: a streaming transcript + composer, plus the
  ask_user tool rendered as structured option cards (the conversational form of the product thesis,
  D2). The backend runs for real through the provider seam in main (D8); the API key is entered
  here but stored/used only in main (BL-051) — the plaintext key never reaches this component.
  Derives from the store (Rule 6); the composer is Korean-IME safe via the Textarea primitive.
*/
const PROVIDER = 'anthropic' as const

function TextRow({ role, text }: { role: string; text: string }) {
  if (role === 'system') {
    return <p className="text-xs text-muted">{text}</p>
  }
  const isUser = role === 'user'
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-md bg-brand/10 px-3 py-2 text-sm text-fg'
            : 'max-w-[85%] rounded-md border border-border px-3 py-2 text-sm text-fg'
        }
      >
        {text}
      </div>
    </div>
  )
}

// The ask_user card: a closed set of options the model asks the human to choose from. Single-select
// answers on click; multi-select accumulates then confirms. Once answered it renders read-only.
function AskCard({ message }: { message: AskMessage }) {
  const { request, answered, selected } = message
  const [picked, setPicked] = useState<string[]>([])

  const togglePick = (label: string): void =>
    setPicked((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]))

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border px-3 py-2">
      {request.header ? (
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {request.header}
        </span>
      ) : null}
      <p className="text-sm text-fg">{request.question}</p>

      {answered ? (
        <p className="text-xs text-muted">You chose: {selected.join(', ') || '—'}</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {request.options.map((option) => (
              <div key={option.label} className="flex flex-col gap-1">
                <Button
                  variant={
                    request.multiSelect && picked.includes(option.label) ? 'primary' : 'ghost'
                  }
                  onClick={() =>
                    request.multiSelect
                      ? togglePick(option.label)
                      : agentStore.answerAsk(request.callId, [option.label])
                  }
                >
                  {option.label}
                </Button>
                {option.description ? (
                  <p className="text-xs text-muted">{option.description}</p>
                ) : null}
              </div>
            ))}
          </div>
          {request.multiSelect ? (
            <Button
              size="sm"
              disabled={picked.length === 0}
              onClick={() => agentStore.answerAsk(request.callId, picked)}
            >
              Submit
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}

function MessageRow({ message }: { message: AgentMessage }) {
  if (message.kind === 'ask') return <AskCard message={message} />
  return <TextRow role={message.role} text={message.text} />
}

// Shown when no key is resolvable (no env var, nothing stored). Credential entry lives in the
// settings surface now (BL-051) — this just routes there.
function NoKeyNotice() {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-muted">No provider connected.</p>
      <Button size="sm" onClick={() => settingsStore.open()}>
        Open Settings
      </Button>
    </div>
  )
}

function Composer() {
  const streaming = useAgentStreaming()
  const [draft, setDraft] = useState('')

  const submit = (): void => {
    if (streaming) return
    agentStore.send(draft)
    setDraft('')
  }

  return (
    <div className="flex items-end gap-2">
      <Textarea
        value={draft}
        rows={2}
        disabled={streaming}
        placeholder={
          streaming
            ? 'Agent is responding…'
            : 'Message the agent…  (Enter to send, Shift+Enter for newline)'
        }
        aria-label="Message the agent"
        onChange={(event) => setDraft(event.target.value)}
        onSubmit={submit}
      />
      <Button onClick={submit} disabled={streaming || draft.trim() === ''}>
        Send
      </Button>
    </div>
  )
}

export function AgentPanel() {
  const messages = useAgentMessages()
  const settingsOpen = useSettingsOpen()
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null)
  const wasSettingsOpen = useRef(settingsOpen)

  const refreshKey = useCallback((): void => {
    void window.sddIde.credentials.status(PROVIDER).then(setKeyStatus)
  }, [])

  useEffect(refreshKey, [refreshKey])

  // The user may have added/removed a key in Settings — re-check when it closes.
  useEffect(() => {
    if (wasSettingsOpen.current && !settingsOpen) refreshKey()
    wasSettingsOpen.current = settingsOpen
  }, [settingsOpen, refreshKey])

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
        {messages.map((message) => (
          <MessageRow key={message.id} message={message} />
        ))}
      </div>
      {keyStatus && !keyStatus.present ? <NoKeyNotice /> : <Composer />}
    </div>
  )
}
