import { useSyncExternalStore } from 'react'
import { gitStore, type GitState } from './gitStore'

/** The git panel state (status/branches/log/busy/error). Derives from the store (Rule 6). */
export function useGit(): GitState {
  return useSyncExternalStore(gitStore.subscribe, gitStore.getSnapshot)
}
