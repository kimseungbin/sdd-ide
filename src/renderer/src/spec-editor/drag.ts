/*
  BL-031 — transient drag state for block reordering. Which store node is being dragged, shared
  between block NodeViews (the drag source and the drop target are different components). Kept as a
  plain module value, not React state: it changes on dragstart/dragend only and never needs to
  trigger a render (the drop indicator is local state on the hovered block).
*/
import type { NodeId } from '../../../engine'

let dragged: NodeId | null = null

export const drag = {
  start(id: NodeId): void {
    dragged = id
  },
  end(): void {
    dragged = null
  },
  get(): NodeId | null {
    return dragged
  },
}
