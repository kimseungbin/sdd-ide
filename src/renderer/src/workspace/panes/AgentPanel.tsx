import { useState } from 'react'
import { Button } from '../../components/Button'
import { Textarea } from '../../components/Textarea'
import { agentStore, type AgentMessage } from '../../store/agentStore'
import { useAgentMessages } from '../../store/useAgentMessages'

/*
  AgentPanel (BL-039) — the app-owned agent surface: a conversation transcript + composer. It
  is NOT an embedded vendor CLI; the app owns orchestration, the membrane, and role gating
  (BYOK, provider-agnostic, D8). The backend is stubbed until M5 — no fake agent output.
  Derives from the store (Rule 6); the composer is Korean-IME safe via the Textarea primitive.
*/
function MessageRow({ message }: { message: AgentMessage }) {
  if (message.role === 'system') {
    return <p className="text-xs text-muted">{message.text}</p>
  }
  const isUser = message.role === 'user'
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-md bg-brand/10 px-3 py-2 text-sm text-fg'
            : 'max-w-[85%] rounded-md border border-border px-3 py-2 text-sm text-fg'
        }
      >
        {message.text}
      </div>
    </div>
  )
}

export function AgentPanel() {
  const messages = useAgentMessages()
  const [draft, setDraft] = useState('')

  const submit = (): void => {
    agentStore.send(draft)
    setDraft('')
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
        {messages.map((message) => (
          <MessageRow key={message.id} message={message} />
        ))}
      </div>
      <div className="flex items-end gap-2">
        <Textarea
          value={draft}
          rows={2}
          placeholder="Message the agent…  (Enter to send, Shift+Enter for newline)"
          aria-label="Message the agent"
          onChange={(event) => setDraft(event.target.value)}
          onSubmit={submit}
        />
        <Button onClick={submit} disabled={draft.trim() === ''}>
          Send
        </Button>
      </div>
    </div>
  )
}
