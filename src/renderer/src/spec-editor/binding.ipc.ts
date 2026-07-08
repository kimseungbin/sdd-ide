/*
  BL-030 — the app binding: reads from the renderer snapshot cache, writes over IPC to the
  main-process engine (Caller A, D2). Kept separate from `binding.ts` because it touches
  `window.sddIde` + the IPC specStore (side effects on import), which must not load in tests/Ladle.
*/
import { specTreeStore } from '../store/specStore'
import type { SpecBinding } from './binding'

export function createIpcBinding(): SpecBinding {
  const spec = window.sddIde.spec
  return {
    getSnapshot: () => specTreeStore.getSnapshot(),
    subscribe: (listener) => specTreeStore.subscribe(listener),
    updateNode: (id, patch) => void spec.updateNode(id, patch),
    createNode: (input) => void spec.createNode(input),
    moveNode: (id, newParentId, index) => void spec.moveNode(id, newParentId, index),
    deleteNode: (id) => void spec.deleteNode(id),
  }
}
