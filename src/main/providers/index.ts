/*
  Provider registry — the lookup point for the seam. Resolve a Provider by its neutral id; the
  agent loop asks for one and never learns which concrete implementation it got. New providers
  register here (one line) — additive, no call-site changes (BL-051).
*/
import type { ProviderId } from '../../shared/agent'
import { anthropicProvider } from './anthropic'
import type { Provider } from './types'

const providers: Record<ProviderId, Provider> = {
  anthropic: anthropicProvider,
}

export function getProvider(id: ProviderId): Provider {
  return providers[id]
}

export type { Provider } from './types'
