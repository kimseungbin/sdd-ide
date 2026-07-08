import { useSyncExternalStore } from 'react'
import { specTreeStore } from './specStore'
import type { SpecSnapshot } from '../../../engine'

/**
 * Read-only projection of the spec forest from the main-process store (D30), or null until the
 * first IPC fetch resolves. Derives from the store (Rule 6).
 */
export function useSpecTree(): SpecSnapshot | null {
  return useSyncExternalStore(specTreeStore.subscribe, specTreeStore.getSnapshot)
}
