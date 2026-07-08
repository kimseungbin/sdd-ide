/*
  BL-031 — block drag-to-reorder, pointer-based (NOT HTML5 drag-and-drop). ProseMirror installs
  its own native drag handlers on the editor DOM, and HTML5 DnD inside a contentEditable is
  unreliable, so we drag with pointer events instead: PM leaves pointermove/up on `window` alone.
  The drop target is hit-tested with elementFromPoint, the indicator is toggled imperatively on
  the target's DOM, and the drop issues a validated moveNode (D2) — store-authoritative, no
  ProseMirror node surgery.
*/
import type { NodeId } from '../../../engine'
import type { SpecBinding } from './binding'
import { dropMove } from './structural'

interface Target {
  el: HTMLElement
  id: NodeId
  side: 'before' | 'after'
}
interface Active {
  draggedId: NodeId
  binding: SpecBinding
  target: Target | null
}

let active: Active | null = null

function clearIndicator(): void {
  active?.target?.el.classList.remove('drop-before', 'drop-after')
}

function onMove(event: PointerEvent): void {
  if (!active) return
  const hit = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null
  const block = hit?.closest('.spec-block[data-node-id]') as HTMLElement | null
  clearIndicator()
  const id = block?.getAttribute('data-node-id') as NodeId | undefined
  if (!block || !id || id === active.draggedId) {
    active.target = null
    return
  }
  const rect = block.getBoundingClientRect()
  const side: 'before' | 'after' = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
  block.classList.add(side === 'before' ? 'drop-before' : 'drop-after')
  active.target = { el: block, id, side }
}

function onUp(): void {
  if (!active) return
  const { draggedId, binding, target } = active
  clearIndicator()
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  document.body.style.userSelect = ''
  active = null
  if (!target) return
  const snapshot = binding.getSnapshot()
  if (!snapshot) return
  const move = dropMove(snapshot, draggedId, target.id, target.side)
  if (move) binding.moveNode(draggedId, move.parentId, move.index)
}

/** Begin dragging a block by its grip. Call from the grip's onPointerDown. */
export function startBlockDrag(draggedId: NodeId, binding: SpecBinding): void {
  if (active) return
  active = { draggedId, binding, target: null }
  document.body.style.userSelect = 'none' // don't select text while dragging
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}
