/*
  Workspace UI state (BL-036/BL-037) — ephemeral view state shared across panes, kept in an
  external store so panes stay projections (Rule 6) instead of lifting load-bearing state into
  a component. Distinct from the spec store (specStore.ts): this is *which file is open*, not
  spec data.
*/
let activeFilePath: string | null = null
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

export const workspaceStore = {
  subscribe(onChange: () => void): () => void {
    listeners.add(onChange)
    return () => {
      listeners.delete(onChange)
    }
  },
  getActiveFile(): string | null {
    return activeFilePath
  },
  setActiveFile(path: string): void {
    if (path === activeFilePath) return
    activeFilePath = path
    notify()
  },
}
