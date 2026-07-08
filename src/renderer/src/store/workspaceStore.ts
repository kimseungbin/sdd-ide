/*
  Workspace UI state (BL-036/BL-037/BL-030) — ephemeral view state shared across panes, kept in
  an external store so panes stay projections (Rule 6) instead of lifting load-bearing state into
  a component. Distinct from the spec store (specStore.ts): this is *what document is open*, not
  spec data.

  The document pane is unified: the open document is either a file (→ code editor) or a spec node
  (→ spec editor). The directory tree opens files; the spec tree opens spec docs — one surface,
  two navigators.
*/
import type { NodeId } from '../../../engine'

export type ActiveDocument =
  { kind: 'file'; path: string } | { kind: 'spec'; nodeId: NodeId } | null

let activeDocument: ActiveDocument = null
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
  getActiveDocument(): ActiveDocument {
    return activeDocument
  },
  setActiveFile(path: string): void {
    if (activeDocument?.kind === 'file' && activeDocument.path === path) return
    activeDocument = { kind: 'file', path }
    notify()
  },
  setActiveSpec(nodeId: NodeId): void {
    if (activeDocument?.kind === 'spec' && activeDocument.nodeId === nodeId) return
    activeDocument = { kind: 'spec', nodeId }
    notify()
  },
}
