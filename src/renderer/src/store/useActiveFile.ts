import { useSyncExternalStore } from 'react'
import { workspaceStore } from './workspaceStore'

/** Path of the file open in the editor pane, or null. Derives from the store (Rule 6). */
export function useActiveFile(): string | null {
  return useSyncExternalStore(workspaceStore.subscribe, workspaceStore.getActiveFile)
}
