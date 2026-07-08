/**
 * The spec engine — the single validated mutation path (D2/P2) over the typed
 * block tree (BL-010, BL-011).
 *
 * Invariants enforced here:
 *  - Truth changes ONLY through these methods (D2). Queries return clones, so callers
 *    physically cannot mutate the store off-path.
 *  - Containment is acyclic: a node can never be moved into its own subtree.
 */
import { isHardEdge } from './edges'
import { SpecEngineError } from './errors'
import { createEdgeId, createNodeId } from './ids'
import type {
  AddEdgeInput,
  CreateNodeInput,
  Edge,
  EdgeId,
  EdgeType,
  Node,
  NodeId,
  NodePatch,
  NodeType,
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
  /** Change a node's type in place (id/title/children/parent preserved); resets type-specific fields. */
  changeNodeType(id: NodeId, type: NodeType): Node
  moveNode(id: NodeId, newParentId: NodeId | null, index?: number): void
  deleteNode(id: NodeId): void

  // --- dependency graph (D5/D9): a separate relation, same single write path (D2) ---
  addEdge(input: AddEdgeInput): Edge
  removeEdge(id: EdgeId): void
  getEdges(): Edge[]
  getOutgoingEdges(id: NodeId): Edge[]
  getIncomingEdges(id: NodeId): Edge[]
  /** Direct in-degree (fan-in), optionally by type. Soft/derived signal (D23/O17). */
  getInDegree(id: NodeId, type?: EdgeType): number
  /** Node ids reachable from `id` following hard edges (D12 importance floor). */
  getHardReachable(id: NodeId): NodeId[]

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

function cloneEdge(edge: Edge): Edge {
  return { ...edge }
}

export function createSpecEngine(snapshot?: SpecSnapshot): SpecEngine {
  const nodes = new Map<NodeId, Node>()
  const rootIds: NodeId[] = []
  const edges = new Map<EdgeId, Edge>()
  const listeners = new Set<() => void>()

  if (snapshot) {
    for (const n of snapshot.nodes) nodes.set(n.id, clone(n))
    rootIds.push(...snapshot.rootIds)
    for (const e of snapshot.edges) edges.set(e.id, cloneEdge(e))
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

  /** Node ids reachable from `start` following outgoing hard edges (excludes `start`). */
  const hardReachableFrom = (start: NodeId): Set<NodeId> => {
    const seen = new Set<NodeId>()
    const stack: NodeId[] = []
    for (const e of edges.values()) if (e.from === start && isHardEdge(e.type)) stack.push(e.to)
    while (stack.length > 0) {
      const cur = stack.pop() as NodeId
      if (seen.has(cur)) continue
      seen.add(cur)
      for (const e of edges.values()) if (e.from === cur && isHardEdge(e.type)) stack.push(e.to)
    }
    return seen
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
        edges: [...edges.values()].map(cloneEdge),
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
        throw new SpecEngineError(
          'INVALID_PATCH',
          `status applies only to task nodes, not "${node.type}"`,
        )
      }
      if (patch.state !== undefined && node.type !== 'deferred-decision') {
        throw new SpecEngineError(
          'INVALID_PATCH',
          `state applies only to deferred-decision nodes, not "${node.type}"`,
        )
      }
      if (patch.title !== undefined) node.title = patch.title
      if (patch.status !== undefined && node.type === 'task') node.status = patch.status
      if (patch.state !== undefined && node.type === 'deferred-decision') node.state = patch.state
      notify()
      return clone(node)
    },

    changeNodeType(id, type) {
      const node = getLive(id)
      if (node.type === type) return clone(node)
      const base = {
        id: node.id,
        title: node.title,
        children: [...node.children],
        parentId: node.parentId,
      }
      let next: Node
      switch (type) {
        case 'task':
          next = { ...base, type: 'task', status: 'todo' }
          break
        case 'deferred-decision':
          next = { ...base, type: 'deferred-decision', state: 'open' }
          break
        case 'spec':
          next = { ...base, type: 'spec' }
          break
        case 'requirement':
          next = { ...base, type: 'requirement' }
          break
        case 'design':
          next = { ...base, type: 'design' }
          break
        case 'text':
          next = { ...base, type: 'text' }
          break
        default: {
          const exhaustive: never = type
          throw new SpecEngineError('INVALID_TYPE', `Unknown node type "${String(exhaustive)}"`)
        }
      }
      nodes.set(id, next)
      notify()
      return clone(next)
    },

    moveNode(id, newParentId, index) {
      const node = getLive(id)
      if (newParentId !== null) {
        getLive(newParentId) // must exist
        // Reject moving a node into itself or into its own descendant.
        let cursor: NodeId | null = newParentId
        while (cursor !== null) {
          if (cursor === id) {
            throw new SpecEngineError(
              'CYCLE',
              'A node cannot be moved into itself or its own descendant',
            )
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
      const ids = new Set(collectSubtree(id))
      detach(node)
      for (const nid of ids) nodes.delete(nid)
      // Prune dangling edges touching any deleted node.
      for (const [eid, e] of edges) {
        if (ids.has(e.from) || ids.has(e.to)) edges.delete(eid)
      }
      notify()
    },

    addEdge({ from, to, type }) {
      getLive(from) // both endpoints must exist
      getLive(to)
      if (from === to) {
        throw new SpecEngineError('SELF_EDGE', 'An edge cannot connect a node to itself')
      }
      for (const e of edges.values()) {
        if (e.from === from && e.to === to && e.type === type) {
          throw new SpecEngineError(
            'DUPLICATE_EDGE',
            `A ${type} edge from "${from}" to "${to}" already exists`,
          )
        }
      }
      // Hard-edge cycles are deadlocks — reject at write time (BL-014/D24). Soft cycles are allowed.
      if (isHardEdge(type) && (to === from || hardReachableFrom(to).has(from))) {
        throw new SpecEngineError(
          'CYCLE',
          `A ${type} edge from "${from}" to "${to}" would create a hard-dependency cycle`,
        )
      }
      const edge: Edge = { id: createEdgeId(type), from, to, type }
      edges.set(edge.id, edge)
      notify()
      return cloneEdge(edge)
    },

    removeEdge(id) {
      if (!edges.has(id)) {
        throw new SpecEngineError('EDGE_NOT_FOUND', `No edge with id "${id}"`)
      }
      edges.delete(id)
      notify()
    },

    getEdges() {
      return [...edges.values()].map(cloneEdge)
    },

    getOutgoingEdges(id) {
      return [...edges.values()].filter((e) => e.from === id).map(cloneEdge)
    },

    getIncomingEdges(id) {
      return [...edges.values()].filter((e) => e.to === id).map(cloneEdge)
    },

    getInDegree(id, type) {
      let count = 0
      for (const e of edges.values()) {
        if (e.to === id && (type === undefined || e.type === type)) count += 1
      }
      return count
    },

    getHardReachable(id) {
      getLive(id)
      return [...hardReachableFrom(id)]
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
