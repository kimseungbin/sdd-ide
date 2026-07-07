/**
 * Core types for the spec engine's typed block tree (BL-010).
 *
 * The store is the source of truth (D1). This models CONTAINMENT only — the
 * nesting tree ("what is this spec made of"). The dependency graph ("what blocks
 * what") is a separate relation over the same ids (D5/P5) and lives elsewhere (BL-013).
 */

export type NodeId = string

export type NodeType =
  | 'spec' // root container for one spec
  | 'requirement'
  | 'design'
  | 'task'
  | 'deferred-decision'
  | 'text' // generic prose block

export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type DecisionState = 'open' | 'resolved'

interface BaseNode {
  readonly id: NodeId
  readonly type: NodeType
  /** Human-facing title/prose. The markdown projection (BL-020) renders from this. */
  title: string
  /** Ordered child ids (containment). Empty for leaves. */
  children: NodeId[]
  /** Parent id; null only for a root node. */
  parentId: NodeId | null
}

export interface SpecNode extends BaseNode {
  readonly type: 'spec'
}
export interface RequirementNode extends BaseNode {
  readonly type: 'requirement'
}
export interface DesignNode extends BaseNode {
  readonly type: 'design'
}
export interface TaskNode extends BaseNode {
  readonly type: 'task'
  status: TaskStatus
}
export interface DeferredDecisionNode extends BaseNode {
  readonly type: 'deferred-decision'
  state: DecisionState
}
export interface TextNode extends BaseNode {
  readonly type: 'text'
}

export type Node =
  | SpecNode
  | RequirementNode
  | DesignNode
  | TaskNode
  | DeferredDecisionNode
  | TextNode

/** Input to createNode. Type-specific fields are optional and validated per type. */
export interface CreateNodeInput {
  type: NodeType
  title?: string
  /** null/undefined creates a new root (top-level spec). */
  parentId?: NodeId | null
  /** Position among siblings; appended if omitted or out of range. */
  index?: number
  /** task only. Defaults to 'todo'. */
  status?: TaskStatus
}

/** Fields updateNode may change. Applying one to the wrong node type is rejected. */
export interface NodePatch {
  title?: string
  status?: TaskStatus // task only
  state?: DecisionState // deferred-decision only
}

// --- Dependency graph (BL-013) ---
// A SEPARATE relation over the same node ids (D5/P5): "what blocks what". Edges are
// records {from, to, type} that cross containment and files freely. Directed from → to.

export type EdgeId = string

/**
 * Four edge types in two behavioral classes (D9):
 *  - HARD (`blocks`, `supersedes`): change what a session is *allowed* to do; never
 *    silently dropped; hard-edge cycles are rejected at write time (BL-014/D24).
 *  - SOFT (`relates`, `informs`): change what a session *should be aware of*; summarizable;
 *    soft cycles are harmless and allowed.
 * Convention: a `blocks` edge from A → B means A blocks B (B waits on A).
 */
export type EdgeType = 'blocks' | 'supersedes' | 'relates' | 'informs'

export interface Edge {
  readonly id: EdgeId
  from: NodeId
  to: NodeId
  type: EdgeType
}

export interface AddEdgeInput {
  from: NodeId
  to: NodeId
  type: EdgeType
}

/** Serializable form of the store — the seam for projection/rehydration (BL-020/022). */
export interface SpecSnapshot {
  version: 1
  rootIds: NodeId[]
  nodes: Node[]
  edges: Edge[]
}
