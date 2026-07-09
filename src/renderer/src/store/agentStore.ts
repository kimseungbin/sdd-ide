/*
  Agent conversation state (BL-039, real backend). App-owned session state kept in an external
  store so the agent pane stays a projection (Rule 6). This is the implementation-session agent.

  The backend now runs for real: send() dispatches the transcript to main (which owns the provider
  seam + tool loop, D8), and this store folds the streamed events (text deltas, ask_user requests,
  done/error) back into the visible transcript. Errors surface as honest system turns — never fake
  agent output. The plaintext key never reaches the renderer; key entry lives in the panel.
*/
import type { AskUserRequest, ChatMessage, ChatRole } from '../../../shared/agent'

/** A normal text turn. */
export interface TextMessage {
  id: string
  kind: 'text'
  role: ChatRole
  text: string
}

/** A rendered ask_user tool call — a structured question with a closed option set. */
export interface AskMessage {
  id: string
  kind: 'ask'
  callId: string
  request: AskUserRequest
  answered: boolean
  selected: string[]
}

export type AgentMessage = TextMessage | AskMessage

let messages: AgentMessage[] = [
  {
    id: 'seed',
    kind: 'text',
    role: 'system',
    text: 'Implementation session — ask about the code or the structured spec.',
  },
]
let streaming = false
let turnId: string | null = null
let currentAssistantId: string | null = null
let seq = 1

const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

function nextId(): string {
  return `m${seq++}`
}

/** Remove the in-progress assistant bubble if it never received any text. */
function dropEmptyAssistant(): void {
  if (!currentAssistantId) return
  const current = messages.find((m) => m.id === currentAssistantId)
  if (current && current.kind === 'text' && current.text === '') {
    messages = messages.filter((m) => m.id !== currentAssistantId)
  }
  currentAssistantId = null
}

function appendDelta(text: string): void {
  if (!currentAssistantId) {
    currentAssistantId = nextId()
    messages = [...messages, { id: currentAssistantId, kind: 'text', role: 'assistant', text: '' }]
  }
  messages = messages.map((m) =>
    m.id === currentAssistantId && m.kind === 'text' ? { ...m, text: m.text + text } : m,
  )
  notify()
}

function finishTurn(): void {
  dropEmptyAssistant()
  streaming = false
  turnId = null
}

// Wire the main→renderer agent events once, at module load (side effect, like specStore). Guarded
// so tests / Ladle (no preload bridge) don't touch window.sddIde.
if (typeof window !== 'undefined' && window.sddIde?.agent) {
  const agent = window.sddIde.agent
  agent.onDelta((delta) => {
    if (delta.turnId !== turnId) return
    appendDelta(delta.text)
  })
  agent.onAsk((request) => {
    dropEmptyAssistant()
    messages = [
      ...messages,
      { id: nextId(), kind: 'ask', callId: request.callId, request, answered: false, selected: [] },
    ]
    notify()
  })
  agent.onDone((done) => {
    if (done.turnId !== turnId) return
    finishTurn()
    notify()
  })
  agent.onError((error) => {
    if (error.turnId !== turnId) return
    finishTurn()
    messages = [...messages, { id: nextId(), kind: 'text', role: 'system', text: error.message }]
    notify()
  })
}

export const agentStore = {
  subscribe(onChange: () => void): () => void {
    listeners.add(onChange)
    return () => {
      listeners.delete(onChange)
    }
  },
  getSnapshot(): AgentMessage[] {
    return messages
  },
  isStreaming(): boolean {
    return streaming
  },
  send(text: string): void {
    const trimmed = text.trim()
    if (trimmed === '' || streaming) return
    messages = [...messages, { id: nextId(), kind: 'text', role: 'user', text: trimmed }]

    // Only text turns are model-visible; ask cards are UI for internal tool round-trips (which the
    // main loop replays itself). Stateless, like the model API — send the whole transcript.
    const transcript: ChatMessage[] = messages
      .filter((m): m is TextMessage => m.kind === 'text')
      .map((m) => ({ role: m.role, content: m.text }))

    streaming = true
    turnId = crypto.randomUUID()
    currentAssistantId = null
    notify()
    void window.sddIde.agent.send(turnId, transcript)
  },
  answerAsk(callId: string, selected: string[]): void {
    messages = messages.map((m) =>
      m.kind === 'ask' && m.callId === callId ? { ...m, answered: true, selected } : m,
    )
    notify()
    window.sddIde.agent.answerAsk({ callId, selected })
  },
}
