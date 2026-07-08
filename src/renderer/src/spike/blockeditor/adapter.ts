/*
  BL-002 spike — shared store adapter (throwaway).

  A deliberately tiny stand-in for the real spec store (D1) + validated mutation API (D2).
  Both editor prototypes (Tiptap, Slate) project their doc model FROM `getBlocks()` and push
  every edit back THROUGH these methods — never mutating block state directly. That is the
  whole point of check #2 (data-model adapter friction): how much glue does each editor need
  to behave as a projection of a block store, with writes funnelled through one API?

  Containment is flattened to a single list here — nesting is not what this spike measures
  (check #2 is about the doc-model ↔ store mapping, not the tree). Each editor instance gets
  its own store via `createSpikeStore()` so the two prototypes stay independent side by side.
*/
export type SpikeBlockType = 'heading' | 'paragraph' | 'deferred-decision'
export type DecisionState = 'open' | 'resolved'

export interface SpikeBlock {
  readonly id: string
  readonly type: SpikeBlockType
  /** Plain-text content of the block. */
  text: string
  /** Only meaningful for `deferred-decision`. */
  state?: DecisionState
}

export interface Mutation {
  readonly seq: number
  readonly op: string
  readonly blockId: string
  readonly summary: string
}

export interface SpikeStore {
  getBlocks(): readonly SpikeBlock[]
  getLog(): readonly Mutation[]
  /** The single write path for text edits (D2). Returns true if it changed anything. */
  setBlockText(id: string, text: string): boolean
  /** The single write path for the custom node's state (D6/D17 custom-block check). */
  setDecisionState(id: string, state: DecisionState): boolean
  subscribe(listener: () => void): () => void
}

const SEED: SpikeBlock[] = [
  { id: 'b-title', type: 'heading', text: '결제 흐름 사양 (Checkout spec)' },
  {
    id: 'b-intro',
    type: 'paragraph',
    text: '여기에 한국어를 입력해 IME 조합을 시험하세요. Type here to test IME.',
  },
  {
    id: 'b-dd',
    type: 'deferred-decision',
    text: 'PG사 선택: 토스 vs 아임포트 (defer)',
    state: 'open',
  },
]

export function createSpikeStore(): SpikeStore {
  const blocks: SpikeBlock[] = SEED.map((b) => ({ ...b }))
  const log: Mutation[] = []
  const listeners = new Set<() => void>()

  const notify = (): void => {
    for (const l of listeners) l()
  }
  const record = (op: string, blockId: string, summary: string): void => {
    log.unshift({ seq: log.length + 1, op, blockId, summary })
  }

  return {
    getBlocks: () => blocks,
    getLog: () => log,
    setBlockText(id, text) {
      const block = blocks.find((b) => b.id === id)
      if (!block || block.text === text) return false
      block.text = text
      record('setBlockText', id, JSON.stringify(text.slice(0, 32)))
      notify()
      return true
    },
    setDecisionState(id, state) {
      const block = blocks.find((b) => b.id === id)
      if (!block || block.type !== 'deferred-decision' || block.state === state) return false
      block.state = state
      record('setDecisionState', id, state)
      notify()
      return true
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
