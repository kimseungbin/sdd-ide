/*
  BL-031 — block drag-to-reorder, pointer-based (NOT HTML5 DnD, which fights ProseMirror inside a
  contentEditable). The drop target is resolved through ProseMirror itself — `posAtCoords` → the
  specBlock at that position → its `nodeId` — rather than DOM attributes, so it doesn't depend on
  the NodeView forwarding data attrs. The drop issues a validated moveNode (D2): store-authoritative,
  no ProseMirror node surgery.
*/
import type { Editor } from '@tiptap/core'
import type { NodeId } from '../../../engine'
import type { SpecBinding } from './binding'
import { dropMove } from './structural'

interface Target {
  id: NodeId
  dom: HTMLElement
  side: 'before' | 'after'
}
interface Active {
  draggedId: NodeId
  editor: Editor
  binding: SpecBinding
  target: Target | null
}

let active: Active | null = null

function clearIndicator(): void {
  active?.target?.dom.classList.remove('drop-before', 'drop-after')
}

/** The top-level specBlock under the given viewport point, if any. */
function blockAt(editor: Editor, x: number, y: number): { id: NodeId; dom: HTMLElement } | null {
  const view = editor.view
  const at = view.posAtCoords({ left: x, top: y })
  if (!at) return null
  const $pos = view.state.doc.resolve(at.pos)
  if ($pos.depth < 1) return null
  const block = $pos.node(1)
  const id = block?.attrs?.nodeId as NodeId | null
  if (!id || block.type.name !== 'specBlock') return null
  const dom = view.nodeDOM($pos.before(1))
  return dom instanceof HTMLElement ? { id, dom } : null
}

function onMove(event: PointerEvent): void {
  if (!active) return
  clearIndicator()
  const hit = blockAt(active.editor, event.clientX, event.clientY)
  if (!hit || hit.id === active.draggedId) {
    active.target = null
    return
  }
  const rect = hit.dom.getBoundingClientRect()
  const side: 'before' | 'after' = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
  hit.dom.classList.add(side === 'before' ? 'drop-before' : 'drop-after')
  active.target = { id: hit.id, dom: hit.dom, side }
}

function onUp(): void {
  if (!active) return
  const { draggedId, binding, target } = active
  clearIndicator()
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  active = null
  if (!target) return
  const snapshot = binding.getSnapshot()
  if (!snapshot) return
  const move = dropMove(snapshot, draggedId, target.id, target.side)
  if (move) binding.moveNode(draggedId, move.parentId, move.index)
}

/** Begin dragging a block by its grip. Call from the grip's onPointerDown. */
export function startBlockDrag(draggedId: NodeId, editor: Editor, binding: SpecBinding): void {
  if (active) return
  active = { draggedId, editor, binding, target: null }
  document.body.style.userSelect = 'none' // don't select text while dragging
  document.body.style.cursor = 'grabbing' // visible feedback that a drag is in progress
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}
