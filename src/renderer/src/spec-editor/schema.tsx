import { useState, type DragEvent, type ReactNode } from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Button } from '../components/Button'
import type { DecisionState, NodeType, TaskStatus } from '../../../engine'
import type { SpecBinding } from './binding'
import { createSlashCommand } from './slash-command'
import { dropMove } from './structural'
import { drag } from './drag'
import './spec-editor.css'

/*
  BL-030/031/032 — the Tiptap schema for the spec editor. Every store node projects to ONE uniform
  `specBlock`; its React NodeView renders the right presentation per `specType` (spec title,
  requirement/design section labels, task checkbox, deferred-decision card, plain text). Store
  identity (`nodeId`) + projection attrs live on the node, so an edit maps back to a structured
  mutation. Interactive affordances (checkbox, decision toggle) are `contentEditable=false`
  widgets writing through the binding (D2); the editable title is the NodeViewContent, so the
  caret / IME stay in the text. A hover drag handle reorders blocks store-authoritatively: the
  drop computes a target and calls moveNode — no ProseMirror node surgery.
*/
const TASK_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: 'in-progress',
  'in-progress': 'done',
  done: 'todo',
}
const TASK_GLYPH: Record<TaskStatus, string> = { todo: '○', 'in-progress': '◐', done: '✓' }

/** The per-type inner presentation (everything except the shared wrapper + drag handle). */
function blockInner(
  specType: NodeType,
  status: TaskStatus,
  state: DecisionState,
  nodeId: string,
  binding: SpecBinding,
): ReactNode {
  if (specType === 'deferred-decision') {
    return (
      <div className="my-1 rounded-md border border-brand/50 bg-surface p-2">
        <div className="mb-1 flex items-center gap-2 text-xs text-muted" contentEditable={false}>
          <span className="rounded bg-brand/15 px-1.5 font-semibold uppercase tracking-wide text-brand">
            deferred decision
          </span>
          <span>· {state}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              binding.updateNode(nodeId, { state: state === 'open' ? 'resolved' : 'open' })
            }
          >
            {state === 'open' ? 'resolve' : 'reopen'}
          </Button>
        </div>
        <NodeViewContent className="text-fg outline-none" />
      </div>
    )
  }
  if (specType === 'task') {
    return (
      <div className="flex items-start gap-1.5">
        <span contentEditable={false} className="mt-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Task status: ${status}`}
            onClick={() => binding.updateNode(nodeId, { status: TASK_CYCLE[status] })}
          >
            {TASK_GLYPH[status]}
          </Button>
        </span>
        <NodeViewContent
          className={
            status === 'done'
              ? 'flex-1 text-muted line-through outline-none'
              : 'flex-1 outline-none'
          }
        />
      </div>
    )
  }
  if (specType === 'requirement' || specType === 'design') {
    return (
      <div className="mt-1.5 flex items-baseline gap-2">
        <span
          contentEditable={false}
          className="shrink-0 rounded bg-brand/15 px-1.5 text-xs font-semibold uppercase tracking-wide text-brand"
        >
          {specType}
        </span>
        <NodeViewContent className="flex-1 text-base font-semibold outline-none" />
      </div>
    )
  }
  if (specType === 'spec') {
    return <NodeViewContent className="mt-1 text-xl font-bold outline-none" />
  }
  return <NodeViewContent className="text-fg outline-none" />
}

function SpecBlockView({ node, extension }: NodeViewProps) {
  const binding = extension.options.binding as SpecBinding
  const nodeId = node.attrs.nodeId as string
  const specType = node.attrs.specType as NodeType
  const depth = (node.attrs.depth as number | null) ?? 0
  const status = (node.attrs.status as TaskStatus | null) ?? 'todo'
  const state = (node.attrs.state as DecisionState | null) ?? 'open'
  const [dropSide, setDropSide] = useState<'before' | 'after' | null>(null)

  const sideFrom = (event: DragEvent<HTMLElement>): 'before' | 'after' => {
    const rect = event.currentTarget.getBoundingClientRect()
    return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
  }

  const onDragOver = (event: DragEvent<HTMLElement>): void => {
    const dragged = drag.get()
    if (!dragged || dragged === nodeId) return
    event.preventDefault()
    event.stopPropagation()
    setDropSide(sideFrom(event))
  }

  const onDrop = (event: DragEvent<HTMLElement>): void => {
    const dragged = drag.get()
    setDropSide(null)
    if (!dragged || dragged === nodeId) return
    event.preventDefault()
    event.stopPropagation()
    const snapshot = binding.getSnapshot()
    if (!snapshot) return
    const move = dropMove(snapshot, dragged, nodeId, sideFrom(event))
    if (move) binding.moveNode(dragged, move.parentId, move.index)
    drag.end()
  }

  const dropClass =
    dropSide === 'before' ? ' drop-before' : dropSide === 'after' ? ' drop-after' : ''

  return (
    <NodeViewWrapper
      data-depth={depth}
      className={`spec-block group relative${dropClass}`}
      onDragOver={onDragOver}
      onDragLeave={() => setDropSide(null)}
      onDrop={onDrop}
    >
      <span
        aria-hidden
        contentEditable={false}
        draggable
        onDragStart={(event) => {
          drag.start(nodeId)
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/plain', nodeId)
          event.stopPropagation()
        }}
        onDragEnd={() => {
          drag.end()
          setDropSide(null)
        }}
        className="absolute -left-4 top-0.5 hidden cursor-grab select-none text-muted group-hover:block"
      >
        ⠿
      </span>
      {blockInner(specType, status, state, nodeId, binding)}
    </NodeViewWrapper>
  )
}

export function createSpecExtensions(binding: SpecBinding) {
  const attr = (name: string, dataName: string) => ({
    default: null,
    renderHTML: (attrs: Record<string, unknown>) =>
      attrs[name] != null ? { [dataName]: String(attrs[name]) } : {},
    parseHTML: (el: HTMLElement) => el.getAttribute(dataName),
  })

  const SpecBlock = Node.create({
    name: 'specBlock',
    group: 'block',
    content: 'inline*',
    defining: true,
    addOptions: () => ({ binding }),
    addAttributes: () => ({
      nodeId: attr('nodeId', 'data-node-id'),
      specType: attr('specType', 'data-spec-type'),
      depth: attr('depth', 'data-depth'),
      status: attr('status', 'data-status'),
      state: attr('state', 'data-state'),
    }),
    parseHTML: () => [{ tag: 'div[data-spec-block]' }],
    renderHTML: ({ HTMLAttributes }) => [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-spec-block': '' }),
      0,
    ],
    addNodeView: () => ReactNodeViewRenderer(SpecBlockView),
  })

  return [StarterKit, SpecBlock, createSlashCommand(binding)]
}
