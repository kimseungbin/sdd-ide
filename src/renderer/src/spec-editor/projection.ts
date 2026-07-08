/*
  BL-030 — projection: spec store snapshot -> editor document (D1/D2, D18 → Tiptap).

  The editor's doc model is a *projection* of the store, never the source of truth (AC #3).
  This module is the pure, one-way mapping: snapshot → an ordered list of blocks → a Tiptap
  document. Every node projects to ONE uniform `specBlock` (its NodeView renders the right
  affordance per type), carrying its store `nodeId` so edits map back to a structured mutation
  (AC #1/#2). Containment is flattened to a depth-tagged list; the depth attr drives visual
  indentation, and structural editing (nest/reorder) issues moves against the store (BL-031).
*/
import type { DecisionState, NodeId, NodeType, SpecSnapshot, TaskStatus } from '../../../engine'

export interface SpecBlock {
  nodeId: NodeId
  type: NodeType
  /** Containment depth (0 = root), for visual indent. */
  depth: number
  title: string
  status?: TaskStatus
  state?: DecisionState
}

/** Depth-first flatten of the containment tree into an ordered block list. */
export function snapshotToBlocks(snapshot: SpecSnapshot): SpecBlock[] {
  const byId = new Map(snapshot.nodes.map((n) => [n.id, n]))
  const out: SpecBlock[] = []
  const walk = (ids: NodeId[], depth: number): void => {
    for (const id of ids) {
      const node = byId.get(id)
      if (!node) continue
      out.push({
        nodeId: node.id,
        type: node.type,
        depth,
        title: node.title,
        status: node.type === 'task' ? node.status : undefined,
        state: node.type === 'deferred-decision' ? node.state : undefined,
      })
      walk(node.children, depth + 1)
    }
  }
  walk(snapshot.rootIds, 0)
  return out
}

/** One block → one uniform `specBlock` Tiptap node (JSON). Empty title → no text node. */
function blockToNode(block: SpecBlock): Record<string, unknown> {
  return {
    type: 'specBlock',
    attrs: {
      nodeId: block.nodeId,
      specType: block.type,
      depth: block.depth,
      status: block.type === 'task' ? (block.status ?? 'todo') : null,
      state: block.type === 'deferred-decision' ? (block.state ?? 'open') : null,
    },
    content: block.title ? [{ type: 'text', text: block.title }] : [],
  }
}

/** Snapshot → a Tiptap `doc` JSON node. */
export function snapshotToDoc(snapshot: SpecSnapshot): Record<string, unknown> {
  const blocks = snapshotToBlocks(snapshot)
  const content = blocks.map(blockToNode)
  // A ProseMirror doc must be non-empty; fall back to an empty paragraph.
  return { type: 'doc', content: content.length > 0 ? content : [{ type: 'paragraph' }] }
}

/*
  Structural signature — everything about the projection EXCEPT title text. The editor rebuilds
  its document only when this changes (node added/removed/moved/reordered, status/state flipped),
  never on a title keystroke. That's what keeps the caret stable and IME composition intact while
  typing: a title edit round-trips to the store but does not trigger a doc rebuild (echo).
*/
export function structuralSignature(snapshot: SpecSnapshot | null): string {
  if (!snapshot) return ''
  return snapshotToBlocks(snapshot)
    .map((b) => `${b.nodeId}:${b.type}:${b.depth}:${b.status ?? ''}:${b.state ?? ''}`)
    .join('|')
}
