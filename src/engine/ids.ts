import type { NodeId, NodeType } from './types'

/**
 * Minimal global-id generator. Ids are stable and globally unique so dependency
 * edges (BL-013) and PR traceability (BL-062) can reference them. The full scheme
 * — including projection-embeddable anchors — is formalized in BL-012.
 */
export function createNodeId(type: NodeType): NodeId {
  return `${type}-${globalThis.crypto.randomUUID()}`
}
