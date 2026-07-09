/*
  The agent-surface contract (BL-039 real backend, BL-051). Neutral, provider-agnostic types
  shared by main (the agent loop + provider seam), preload (bridge), and renderer (agent pane).

  Nothing here assumes a specific vendor (D8 / P7): the app owns the conversation, the tool loop,
  and the `ask_user` tool; a Provider implementation (Anthropic first) plugs in behind the seam
  in main. No Claude-specific field leaks into this file — that's what keeps BL-051 honest.
*/

/** A turn in the visible transcript. Tool round-trips (ask_user) are internal to the loop. */
export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: ChatRole
  content: string
}

/** Provider identity — the seam key. Add ids as concrete providers land (openai, ollama…). */
export type ProviderId = 'anthropic'

// ── ask_user: the first app-owned tool ──────────────────────────────────────────────────────
// A structured question the model poses to the human — a closed set of options, not free text.
// This is the conversational form of the product thesis (D2): constrained, validated choice with
// no styling/text escape hatch. Also the natural surface for deferred-decision resolution (D6)
// and hard-edge confirmation (D23 / BL-056).

export interface AskUserOption {
  label: string
  description?: string
}

/** Emitted main→renderer when the model calls ask_user; the loop blocks until answered. */
export interface AskUserRequest {
  /** Correlates the render request with its answer. */
  callId: string
  question: string
  header?: string
  options: AskUserOption[]
  multiSelect: boolean
}

/** The human's answer, sent renderer→main to unblock the loop. `selected` holds option labels. */
export interface AskUserAnswer {
  callId: string
  selected: string[]
}

// ── streaming events (main→renderer), scoped to one send() turn by `turnId` ──────────────────
export interface AgentTextDelta {
  turnId: string
  text: string
}

export interface AgentError {
  turnId: string
  message: string
}

export interface AgentDone {
  turnId: string
}

// ── credentials (BYOK, D8 / BL-051) ─────────────────────────────────────────────────────────
/** How the active key was resolved — surfaced so the UI can explain state honestly. */
export type KeyStatus = { present: false } | { present: true; source: 'env' | 'stored' }

/** safeStorage health. `unavailable`/`plaintext` (Linux basic_text) mean at-rest encryption is weak. */
export type SecureStorageStatus = 'ok' | 'plaintext' | 'unavailable'
