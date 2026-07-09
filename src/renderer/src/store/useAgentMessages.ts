import { useSyncExternalStore } from 'react'
import { agentStore, type AgentMessage } from './agentStore'

/** The agent conversation transcript. Derives from the store (Rule 6). */
export function useAgentMessages(): AgentMessage[] {
  return useSyncExternalStore(agentStore.subscribe, agentStore.getSnapshot)
}

/** Whether a turn is in flight — drives the composer's disabled/streaming state. */
export function useAgentStreaming(): boolean {
  return useSyncExternalStore(agentStore.subscribe, agentStore.isStreaming)
}
