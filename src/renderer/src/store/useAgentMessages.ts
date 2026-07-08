import { useSyncExternalStore } from 'react'
import { agentStore, type AgentMessage } from './agentStore'

/** The agent conversation transcript. Derives from the store (Rule 6). */
export function useAgentMessages(): AgentMessage[] {
  return useSyncExternalStore(agentStore.subscribe, agentStore.getSnapshot)
}
