import { useSyncExternalStore } from 'react'
import { settingsStore } from './settingsStore'

/** Whether the settings surface is open. Derives from the store (Rule 6). */
export function useSettingsOpen(): boolean {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.isOpen)
}
