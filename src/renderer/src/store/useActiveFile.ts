import { useSyncExternalStore } from 'react'
import { workspaceStore, type ActiveDocument } from './workspaceStore'

/** The open document (file or spec node), or null. Derives from the store (Rule 6). */
export function useActiveDocument(): ActiveDocument {
  return useSyncExternalStore(workspaceStore.subscribe, workspaceStore.getActiveDocument)
}

/** Path of the open file, or null when nothing / a spec is open. For the directory highlight. */
export function useActiveFile(): string | null {
  const doc = useActiveDocument()
  return doc?.kind === 'file' ? doc.path : null
}
