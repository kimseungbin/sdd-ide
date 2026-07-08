import type { SpecSnapshot } from '../../../engine'

/*
  Renderer-side spec store (BL-038, D30). The real store + engine live in the MAIN process
  (SQLite-backed); this is a thin read-only IPC client. It caches the latest snapshot so
  useSyncExternalStore has a stable synchronous getSnapshot, refreshes on the main store's
  change events, and never mutates (membrane, D7 — the impl session reads the spec only).
*/
let cache: SpecSnapshot | null = null
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

async function refresh(): Promise<void> {
  cache = await window.sddIde.spec.getSnapshot()
  notify()
}

// Re-fetch on any main-side change, and once at startup.
window.sddIde.spec.onChanged(() => {
  void refresh()
})
void refresh()

export const specTreeStore = {
  subscribe(onChange: () => void): () => void {
    listeners.add(onChange)
    return () => {
      listeners.delete(onChange)
    }
  },
  /** Latest snapshot, or null until the first IPC fetch resolves. */
  getSnapshot(): SpecSnapshot | null {
    return cache
  },
}
