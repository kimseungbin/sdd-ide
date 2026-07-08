import { useMemo } from 'react'
import { Extension, Node, mergeAttributes } from '@tiptap/core'
import {
  EditorContent,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
  type NodeViewProps,
} from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Button } from '../../components/Button'
import { SpikeFrame } from './SpikeFrame'
import { createSpikeStore, type SpikeStore } from './adapter'

/*
  BL-002 spike — Tiptap (ProseMirror family) prototype (throwaway).

  Covers the three checks:
    #1 Korean IME — ProseMirror handles compositionstart/end natively; nothing special here.
       Type Korean into any block (incl. inside the custom node) and watch the store update.
    #2 Adapter friction — the editor holds ONE ProseMirror document. There is no per-block
       write callback: on every `onUpdate` we walk the top-level nodes and reconcile each back
       to the store by a `blockId` attribute we had to graft onto every node type (see BlockId
       extension). That reconcile-the-whole-doc shape is the friction to weigh against Slate.
    #3 Custom block — `deferredDecision` is a real ProseMirror node with a React NodeView that
       renders a state toggle; its editable text still routes through the same reconcile path.
*/

function DeferredDecisionView({ node, updateAttributes, extension }: NodeViewProps) {
  const store = extension.options.store as SpikeStore
  const state = node.attrs.state as 'open' | 'resolved'
  const blockId = node.attrs.blockId as string

  return (
    <NodeViewWrapper className="rounded-md border border-brand/50 bg-base p-2">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted" contentEditable={false}>
        <span className="text-brand">deferred-decision</span>
        <span>· {state}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const next = state === 'open' ? 'resolved' : 'open'
            updateAttributes({ state: next })
            store.setDecisionState(blockId, next)
          }}
        >
          toggle
        </Button>
      </div>
      <NodeViewContent className="outline-none" />
    </NodeViewWrapper>
  )
}

export function TiptapSpike() {
  const store = useMemo(() => createSpikeStore(), [])

  const extensions = useMemo(() => {
    // Grafts a `blockId` onto every block type so we can map doc nodes back to store rows —
    // ProseMirror nodes have no stable identity of their own. This is check #2's friction.
    const BlockId = Extension.create({
      name: 'blockId',
      addGlobalAttributes() {
        return [
          {
            types: ['heading', 'paragraph', 'deferredDecision'],
            attributes: {
              blockId: {
                default: null,
                renderHTML: (attrs) => (attrs.blockId ? { 'data-block-id': attrs.blockId } : {}),
                parseHTML: (el) => el.getAttribute('data-block-id'),
              },
            },
          },
        ]
      },
    })

    const DeferredDecision = Node.create({
      name: 'deferredDecision',
      group: 'block',
      content: 'inline*',
      defining: true,
      addOptions: () => ({ store }),
      addAttributes: () => ({ state: { default: 'open' } }),
      parseHTML: () => [{ tag: 'div[data-type="deferred-decision"]' }],
      renderHTML: ({ HTMLAttributes }) => [
        'div',
        mergeAttributes(HTMLAttributes, { 'data-type': 'deferred-decision' }),
        0,
      ],
      addNodeView: () => ReactNodeViewRenderer(DeferredDecisionView),
    })

    return [StarterKit, BlockId, DeferredDecision]
  }, [store])

  const initialContent = useMemo(
    () => ({
      type: 'doc',
      content: store.getBlocks().map((b) => {
        if (b.type === 'heading') {
          return {
            type: 'heading',
            attrs: { level: 1, blockId: b.id },
            content: [{ type: 'text', text: b.text }],
          }
        }
        if (b.type === 'deferred-decision') {
          return {
            type: 'deferredDecision',
            attrs: { blockId: b.id, state: b.state },
            content: [{ type: 'text', text: b.text }],
          }
        }
        return {
          type: 'paragraph',
          attrs: { blockId: b.id },
          content: [{ type: 'text', text: b.text }],
        }
      }),
    }),
    [store],
  )

  const editor = useEditor({
    extensions,
    content: initialContent,
    onUpdate: ({ editor: instance }) => {
      // No per-block signal: reconcile the whole doc back to the store on every change.
      instance.state.doc.forEach((child) => {
        const id = child.attrs.blockId as string | null
        if (id) store.setBlockText(id, child.textContent)
      })
    },
  })

  return (
    <SpikeFrame title="Tiptap (ProseMirror)" store={store}>
      <EditorContent
        editor={editor}
        className="tiptap-spike flex flex-col gap-2 text-fg [&_.ProseMirror]:outline-none"
      />
    </SpikeFrame>
  )
}
