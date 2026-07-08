import { useCallback, useMemo } from 'react'
import {
  createEditor,
  Node as SlateNode,
  Transforms,
  type BaseEditor,
  type Descendant,
} from 'slate'
import {
  Editable,
  ReactEditor,
  Slate,
  useSlateStatic,
  withReact,
  type RenderElementProps,
} from 'slate-react'
import { withHistory, type HistoryEditor } from 'slate-history'
import { Button } from '../../components/Button'
import { SpikeFrame } from './SpikeFrame'
import { createSpikeStore } from './adapter'

/*
  BL-002 spike — Slate prototype (throwaway).

  Covers the three checks:
    #1 Korean IME — the historical risk (Slate's beta status, D18). slate-react handles
       composition itself; type Korean into any block and confirm block/cursor state does not
       break mid-composition. This is the make-or-break check.
    #2 Adapter friction — Slate's value already IS an array of block elements, each carrying its
       own `id`. Reconciling to the store is a direct 1:1 walk (no grafted identity, no custom
       node schema) — the lower-friction claim to weigh against Tiptap's whole-doc reconcile.
    #3 Custom block — `deferred-decision` is just an element `type`; rendered with a state toggle
       via renderElement. No node-schema ceremony.
*/

type SpikeText = { text: string }
type SpikeElement =
  | { type: 'heading'; id: string; children: SpikeText[] }
  | { type: 'paragraph'; id: string; children: SpikeText[] }
  | { type: 'deferred-decision'; id: string; state: 'open' | 'resolved'; children: SpikeText[] }

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: SpikeElement
    Text: SpikeText
  }
}

function DeferredDecisionElement({ element, attributes, children }: RenderElementProps) {
  const editor = useSlateStatic()
  const el = element as Extract<SpikeElement, { type: 'deferred-decision' }>
  return (
    <div {...attributes} className="rounded-md border border-brand/50 bg-base p-2">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted" contentEditable={false}>
        <span className="text-brand">deferred-decision</span>
        <span>· {el.state}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const next = el.state === 'open' ? 'resolved' : 'open'
            const path = ReactEditor.findPath(editor, element)
            Transforms.setNodes(editor, { state: next }, { at: path })
          }}
        >
          toggle
        </Button>
      </div>
      {children}
    </div>
  )
}

export function SlateSpike() {
  const store = useMemo(() => createSpikeStore(), [])
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])

  const initialValue = useMemo<Descendant[]>(
    () =>
      store.getBlocks().map((b) =>
        b.type === 'deferred-decision'
          ? {
              type: 'deferred-decision',
              id: b.id,
              state: b.state ?? 'open',
              children: [{ text: b.text }],
            }
          : { type: b.type, id: b.id, children: [{ text: b.text }] },
      ),
    [store],
  )

  const renderElement = useCallback((props: RenderElementProps) => {
    const el = props.element as SpikeElement
    if (el.type === 'deferred-decision') return <DeferredDecisionElement {...props} />
    if (el.type === 'heading')
      return (
        <h1 {...props.attributes} className="text-lg font-semibold text-fg">
          {props.children}
        </h1>
      )
    return (
      <p {...props.attributes} className="text-fg">
        {props.children}
      </p>
    )
  }, [])

  const onChange = useCallback(() => {
    // Value is already a block list: walk top-level elements and sync each to the store.
    for (const node of editor.children) {
      const el = node as SpikeElement
      store.setBlockText(el.id, SlateNode.string(node))
      if (el.type === 'deferred-decision') store.setDecisionState(el.id, el.state)
    }
  }, [editor, store])

  return (
    <SpikeFrame title="Slate" store={store}>
      <Slate editor={editor} initialValue={initialValue} onChange={onChange}>
        <Editable renderElement={renderElement} className="flex flex-col gap-2 outline-none" />
      </Slate>
    </SpikeFrame>
  )
}
