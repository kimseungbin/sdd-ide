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
  side: 'before' | 'after' | 'child'
}

/*
  Drag-down-and-right to nest (Notion-style, BL-031): in a target's lower half, a cursor pushed
  right past this many px from the block's left edge nests the dragged block as the target's child
  instead of dropping it as a following sibling. The threshold clears the gutter (grip + chevron,
  ~2.1rem) so an ordinary vertical drag never trips it.
*/
const NEST_INDENT_PX = 40
interface Active {
  draggedId: NodeId
  editor: Editor
  binding: SpecBinding
  target: Target | null
  /** The source block (dimmed while dragging) and the floating ghost that follows the cursor. */
  source: HTMLElement
  ghost: HTMLElement
  offsetX: number
  offsetY: number
}

let active: Active | null = null

function clearIndicator(): void {
  active?.target?.dom.classList.remove('drop-before', 'drop-after', 'drop-child')
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
  // The ghost tracks the cursor at the same grab offset.
  active.ghost.style.transform = `translate(${event.clientX - active.offsetX}px, ${event.clientY - active.offsetY}px)`
  clearIndicator()
  const hit = blockAt(active.editor, event.clientX, event.clientY)
  if (!hit || hit.id === active.draggedId) {
    active.target = null
    return
  }
  const rect = hit.dom.getBoundingClientRect()
  // Top half → sibling before. Lower half → sibling after, unless the cursor is pushed right past
  // the nest threshold, which nests the block under the target instead (drag-down-and-right).
  let side: 'before' | 'after' | 'child'
  if (event.clientY < rect.top + rect.height / 2) side = 'before'
  else side = event.clientX - rect.left > NEST_INDENT_PX ? 'child' : 'after'
  hit.dom.classList.add(`drop-${side}`)
  active.target = { id: hit.id, dom: hit.dom, side }
}

function onUp(): void {
  if (!active) return
  const { draggedId, binding, target, ghost, source } = active
  clearIndicator()
  ghost.remove()
  source.classList.remove('dragging')
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

/** Begin dragging a block by its grip. Call from the grip's onPointerDown, passing its block DOM. */
export function startBlockDrag(
  draggedId: NodeId,
  editor: Editor,
  binding: SpecBinding,
  source: HTMLElement,
  startX: number,
  startY: number,
): void {
  if (active) return
  const rect = source.getBoundingClientRect()
  const ghost = source.cloneNode(true) as HTMLElement
  ghost.classList.add('spec-drag-ghost')
  ghost.classList.remove('dragging')
  ghost.style.width = `${rect.width}px`
  ghost.style.transform = `translate(${rect.left}px, ${rect.top}px)`
  document.body.appendChild(ghost)
  source.classList.add('dragging')

  active = {
    draggedId,
    editor,
    binding,
    target: null,
    source,
    ghost,
    offsetX: startX - rect.left,
    offsetY: startY - rect.top,
  }
  document.body.style.userSelect = 'none' // don't select text while dragging
  document.body.style.cursor = 'grabbing' // visible feedback that a drag is in progress
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}
