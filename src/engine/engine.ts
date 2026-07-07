/**
 * The spec engine — the single validated mutation path (D2/P2) over the typed
 * block tree (BL-010, BL-011).
 *
 * Invariants enforced here:
 *  - Truth changes ONLY through these methods (D2). Queries return clones, so callers
 *    physically cannot mutate the store off-path.
 *  - Containment is acyclic: a node can never be moved into its own subtree.
 */
import { SpecEngineError } from './errors'
import { createNodeId } from './ids'
import type {
  CreateNodeInput,
  Node,
  NodeId,
  NodePatch,
  SpecSnapshot,
} from './types'

export interface SpecEngine {
  // --- queries (return clones; never live references) ---
  getNode(id: NodeId): Node | undefined
  getChildren(id: NodeId): Node[]
  getRoots(): Node[]
  /** The node plus all its descendants, in depth-first order. */
  getSubtree(id: NodeId): Node[]
  toSnapshot(): SpecSnapshot

  // --- mutations (validated) ---
  createNode(input: CreateNodeInput): Node
  updateNode(id: NodeId, patch: NodePatch): Node
  moveNode(id: NodeId, newParentId: NodeId | null, index?: number): void
  deleteNode(id: NodeId): void

  // --- reactivity (Rule 6: UI derives from the store) ---
  subscribe(listener: () => void): () => void
}

function buildNode(input: CreateNodeInput): Node {
  const base = {
    id: createNodeId(input.type),
    title: input.title ?? '',
    children: [] as NodeId[],
    parentId: null as NodeId | null,
  }
  switch (input.type) {
    case 'task':
      return { ...base, type: 'task', status: input.status ?? 'todo' }
    case 'deferred-decision':
      return { ...base, type: 'deferred-decision', state: 'open' }
    case 'spec':
      return { ...base, type: 'spec' }
    case 'requirement':
      return { ...base, type: 'requirement' }
    case 'design':
      return { ...base, type: 'design' }
    case 'text':
      return { ...base, type: 'text' }
    default: {
      const exhaustive: never = input.type
      throw new SpecEngineError('INVALID_TYPE', `Unknown node type "${String(exhaustive)}"`)
    }
  }
}

function clone(node: Node): Node {
  return { ...node, children: [...node.children] }
}

function insertAt(arr: NodeId[], id: NodeId, index?: number): void {
  if (index === undefined || index < 0 || index >= arr.length) arr.push(id)
  else arr.splice(index, 0, id)
}

export function createSpecEngine(snapshot?: SpecSnapshot): SpecEngine {
  const nodes = new Map<NodeId, Node>()
  const rootIds: NodeId[] = []
  const listeners = new Set<() => void>()

  if (snapshot) {
    for (const n of snapshot.nodes) nodes.set(n.id, clone(n))
    rootIds.push(...snapshot.rootIds)
  }

  const notify = (): void => {
    for (const listener of listeners) listener()
  }

  /** Live internal reference — for mutation only. */
  const getLive = (id: NodeId): Node => {
    const node = nodes.get(id)
    if (!node) throw new SpecEngineError('NODE_NOT_FOUND', `No node with id "${id}"`)
    return node
  }

  const siblingsOf = (parentId: NodeId | null): NodeId[] =>
    parentId === null ? rootIds : getLive(parentId).children

  const detach = (node: Node): void => {
    const arr = siblingsOf(node.parentId)
    const i = arr.indexOf(node.id)
    if (i >= 0) arr.splice(i, 1)
  }

  const collectSubtree = (id: NodeId): NodeId[] => {
    const out: NodeId[] = []
    const walk = (nid: NodeId): void => {
      out.push(nid)
      for (const child of getLive(nid).children) walk(child)
    }
    walk(id)
    return out
  }

  return {
    getNode(id) {
      const node = nodes.get(id)
      return node ? clone(node) : undefined
    },

    getChildren(id) {
      return getLive(id).children.map((cid) => clone(getLive(cid)))
    },

    getRoots() {
      return rootIds.map((id) => clone(getLive(id)))
    },

    getSubtree(id) {
      return collectSubtree(id).map((nid) => clone(getLive(nid)))
    },

    toSnapshot() {
      return {
        version: 1,
        rootIds: [...rootIds],
        nodes: [...nodes.values()].map(clone),
      }
    },

    createNode(input) {
      const parentId = input.parentId ?? null
      if (parentId !== null) getLive(parentId) // parent must exist
      const node = buildNode(input)
      node.parentId = parentId
      nodes.set(node.id, node)
      insertAt(siblingsOf(parentId), node.id, input.index)
      notify()
      return clone(node)
    },

    updateNode(id, patch) {
      const node = getLive(id)
      if (patch.status !== undefined && node.type !== 'task') {
        throw new SpecEngineError('INVALID_PATCH', `status applies only to task nodes, not "${node.type}"`)
      }
      if (patch.state !== undefined && node.type !== 'deferred-decision') {
        throw new SpecEngineError('INVALID_PATCH', `state applies only to deferred-decision nodes, not "${node.type}"`)
      }
      if (patch.title !== undefined) node.title = patch.title
      if (patch.status !== undefined && node.type === 'task') node.status = patch.status
      if (patch.state !== undefined && node.type === 'deferred-decision') node.state = patch.state
      notify()
      return clone(node)
    },

    moveNode(id, newParentId, index) {
      const node = getLive(id)
      if (newParentId !== null) {
        getLive(newParentId) // must exist
        // Reject moving a node into itself or into its own descendant.
        let cursor: NodeId | null = newParentId
        while (cursor !== null) {
          if (cursor === id) {
            throw new SpecEngineError('CYCLE', 'A node cannot be moved into itself or its own descendant')
          }
          cursor = nodes.get(cursor)?.parentId ?? null
        }
      }
      detach(node)
      node.parentId = newParentId
      insertAt(siblingsOf(newParentId), id, index)
      notify()
    },

    deleteNode(id) {
      const node = getLive(id)
      const ids = collectSubtree(id)
      detach(node)
      for (const nid of ids) nodes.delete(nid)
      notify()
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
