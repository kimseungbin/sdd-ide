/*
  BL-031 — structural moves as pure functions over a snapshot. The editor is store-authoritative:
  Tab/Shift-Tab/Enter/Backspace don't do ProseMirror surgery, they compute a target and issue a
  validated engine mutation (moveNode/createNode/deleteNode, D2). Keeping the math here makes it
  unit-testable and keeps the keyboard handler thin.
*/
import type { NodeId, SpecSnapshot } from '../../../engine'
import { snapshotToBlocks } from './projection'

function siblingsOf(snapshot: SpecSnapshot, parentId: NodeId | null): NodeId[] {
  return parentId
    ? (snapshot.nodes.find((n) => n.id === parentId)?.children ?? [])
    : snapshot.rootIds
}

export interface MoveTarget {
  parentId: NodeId | null
  index: number
}

/** Insert position for a new sibling right after `nodeId` (append to root if unknown). */
export function siblingAfter(snapshot: SpecSnapshot, nodeId: NodeId | null): MoveTarget {
  const current = nodeId ? snapshot.nodes.find((n) => n.id === nodeId) : undefined
  if (!current) return { parentId: null, index: snapshot.rootIds.length }
  const siblings = siblingsOf(snapshot, current.parentId)
  return { parentId: current.parentId, index: siblings.indexOf(current.id) + 1 }
}

/** Tab: nest under the previous sibling (as its last child). Null if there's no previous sibling. */
export function indentTarget(snapshot: SpecSnapshot, nodeId: NodeId): MoveTarget | null {
  const current = snapshot.nodes.find((n) => n.id === nodeId)
  if (!current) return null
  const siblings = siblingsOf(snapshot, current.parentId)
  const i = siblings.indexOf(nodeId)
  if (i <= 0) return null
  const prev = siblings[i - 1]
  return { parentId: prev, index: siblingsOf(snapshot, prev).length }
}

/** Shift-Tab: move up to the grandparent, right after the parent. Null if already a root. */
export function outdentTarget(snapshot: SpecSnapshot, nodeId: NodeId): MoveTarget | null {
  const current = snapshot.nodes.find((n) => n.id === nodeId)
  if (!current || current.parentId === null) return null
  const parent = snapshot.nodes.find((n) => n.id === current.parentId)
  if (!parent) return null
  const grandSiblings = siblingsOf(snapshot, parent.parentId)
  return { parentId: parent.parentId, index: grandSiblings.indexOf(parent.id) + 1 }
}

/** The block immediately before `nodeId` in depth-first order (for caret focus after a delete). */
export function previousBlockId(snapshot: SpecSnapshot, nodeId: NodeId): NodeId | null {
  const blocks = snapshotToBlocks(snapshot)
  const i = blocks.findIndex((b) => b.nodeId === nodeId)
  return i > 0 ? blocks[i - 1].nodeId : null
}
