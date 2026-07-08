import { Extension, Node, mergeAttributes } from '@tiptap/core'
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Button } from '../components/Button'
import type { SpecBinding } from './binding'

/*
  BL-030 — the Tiptap schema for the spec editor. StarterKit gives headings/paragraphs/text;
  we graft the store identity (`nodeId`, plus `depth`/`specType`/`status` for projection) onto
  every block so edits map back to a structured mutation, and add `specDecision` as a first-class
  validated node (the deferred-decision block, D6) rendered with a state toggle that writes through
  the binding (D2). `createSpecExtensions(binding)` closes over the binding so the NodeView can
  mutate without prop-drilling.
*/

function SpecDecisionView({ node, extension }: NodeViewProps) {
  const binding = extension.options.binding as SpecBinding
  const state = node.attrs.state as 'open' | 'resolved'
  const nodeId = node.attrs.nodeId as string

  return (
    <NodeViewWrapper className="my-1 rounded-md border border-brand/50 bg-surface p-2">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted" contentEditable={false}>
        <span className="text-brand">deferred-decision</span>
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
    </NodeViewWrapper>
  )
}

export function createSpecExtensions(binding: SpecBinding) {
  // Store identity + projection attrs, grafted onto every block type (ProseMirror nodes have no
  // native identity). `nodeId` is what maps an edited block back to its store row.
  const SpecIdentity = Extension.create({
    name: 'specIdentity',
    addGlobalAttributes() {
      const attr = (name: string, dataName: string) => ({
        default: null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs[name] != null ? { [dataName]: String(attrs[name]) } : {},
        parseHTML: (el: HTMLElement) => el.getAttribute(dataName),
      })
      return [
        {
          types: ['heading', 'paragraph', 'specDecision'],
          attributes: {
            nodeId: attr('nodeId', 'data-node-id'),
            depth: attr('depth', 'data-depth'),
            specType: attr('specType', 'data-spec-type'),
            status: attr('status', 'data-status'),
          },
        },
      ]
    },
  })

  const SpecDecision = Node.create({
    name: 'specDecision',
    group: 'block',
    content: 'inline*',
    defining: true,
    addOptions: () => ({ binding }),
    addAttributes: () => ({ state: { default: 'open' } }),
    parseHTML: () => [{ tag: 'div[data-type="spec-decision"]' }],
    renderHTML: ({ HTMLAttributes }) => [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'spec-decision' }),
      0,
    ],
    addNodeView: () => ReactNodeViewRenderer(SpecDecisionView),
  })

  return [StarterKit, SpecIdentity, SpecDecision]
}
