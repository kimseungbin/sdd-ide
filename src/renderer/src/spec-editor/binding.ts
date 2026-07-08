/*
  BL-030 — the editor's binding to the spec store. Dependency inversion so `SpecEditor` never
  knows whether it is talking to the real main-process store over IPC (the app, see binding.ipc)
  or an in-renderer engine (Ladle / tests, below). Reads come from a snapshot source; writes are
  structured mutations on the single validated path (D2) — the editor never touches store state.

  This module stays free of `window`/IPC imports so it is safe to load in tests and Ladle; the
  IPC backing lives in `binding.ipc.ts`.
*/
import {
  createSpecEngine,
  type CreateNodeInput,
  type NodeId,
  type NodePatch,
  type NodeType,
  type SpecEngine,
  type SpecSnapshot,
} from '../../../engine'

export interface SpecBinding {
  /** Latest snapshot, or null before the first load resolves. */
  getSnapshot(): SpecSnapshot | null
  subscribe(listener: () => void): () => void
  // Writes — validated mutations only (D2). Fire-and-forget; the snapshot re-derives on change.
  updateNode(id: NodeId, patch: NodePatch): void
  changeNodeType(id: NodeId, type: NodeType): void
  createNode(input: CreateNodeInput): void
  moveNode(id: NodeId, newParentId: NodeId | null, index?: number): void
  deleteNode(id: NodeId): void
}

/** Ladle / test binding: an in-renderer engine is both the source and the sink. */
export function createEngineBinding(engine: SpecEngine): SpecBinding {
  return {
    getSnapshot: () => engine.toSnapshot(),
    subscribe: (listener) => engine.subscribe(listener),
    updateNode: (id, patch) => void engine.updateNode(id, patch),
    changeNodeType: (id, type) => void engine.changeNodeType(id, type),
    createNode: (input) => void engine.createNode(input),
    moveNode: (id, newParentId, index) => engine.moveNode(id, newParentId, index),
    deleteNode: (id) => engine.deleteNode(id),
  }
}

/** Convenience for stories/tests: a fresh engine seeded via the given seeder. */
export function createSeededEngineBinding(seed: (engine: SpecEngine) => void): SpecBinding {
  const engine = createSpecEngine()
  seed(engine)
  return createEngineBinding(engine)
}
