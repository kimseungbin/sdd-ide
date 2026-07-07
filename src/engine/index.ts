export { createSpecEngine, type SpecEngine } from './engine'
export { HARD_EDGE_TYPES, SOFT_EDGE_TYPES, isHardEdge } from './edges'
export { SpecEngineError, type SpecEngineErrorCode } from './errors'
export type {
  AddEdgeInput,
  CreateNodeInput,
  DecisionState,
  DeferredDecisionNode,
  DesignNode,
  Edge,
  EdgeId,
  EdgeType,
  Node,
  NodeId,
  NodePatch,
  NodeType,
  RequirementNode,
  SpecNode,
  SpecSnapshot,
  TaskNode,
  TaskStatus,
  TextNode,
} from './types'
