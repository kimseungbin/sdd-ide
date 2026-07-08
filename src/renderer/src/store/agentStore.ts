/*
  Agent conversation state (BL-039). App-owned session state kept in an external store so the
  agent pane stays a projection (Rule 6). This is the implementation-session (impl-role) agent.

  The backend is NOT wired yet: real provider calls (BYOK, D8), the MCP mutation path, and
  orchestration/role-gating are M5 (BL-050/BL-051/BL-052). Until then, sending appends the
  user's turn and an honest system notice — no fake agent output.
*/
export type AgentRole = 'user' | 'agent' | 'system'

export interface AgentMessage {
  id: string
  role: AgentRole
  text: string
}

let messages: AgentMessage[] = [
  {
    id: 'seed',
    role: 'system',
    text: 'Implementation session — read and verify against the spec. Agent backend not connected yet (BYOK + MCP orchestration land in M5).',
  },
]
let nextId = 1
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
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
  send(text: string): void {
    const trimmed = text.trim()
    if (trimmed === '') return
    messages = [
      ...messages,
      { id: `m${nextId++}`, role: 'user', text: trimmed },
      {
        id: `m${nextId++}`,
        role: 'system',
        text: 'Not connected to a provider yet — see BL-050 / BL-051 / BL-052 (M5).',
      },
    ]
    notify()
  },
}
