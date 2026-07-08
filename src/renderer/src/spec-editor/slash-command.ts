import { Extension, type Editor } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import { Suggestion, type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion'
import { SlashMenu, type SlashItem, type SlashMenuHandle } from './SlashMenu'
import type { SpecBinding } from './binding'

/*
  BL-030/BL-032 — slash-command extension. Typing "/" opens the block-type menu (SlashMenu);
  picking one inserts a NEW store node via the validated path (D2), as a sibling right after the
  current block. The editor re-projects and auto-focuses the new block (SpecEditor's focus-new
  heuristic). Consistent with store-as-truth: structural edits are store mutations, not raw
  ProseMirror surgery.
*/
const ITEMS: SlashItem[] = [
  { title: 'Requirement', type: 'requirement', hint: 'req' },
  { title: 'Design', type: 'design', hint: 'design' },
  { title: 'Task', type: 'task', hint: 'todo' },
  { title: 'Text', type: 'text', hint: 'note' },
  { title: 'Deferred decision', type: 'deferred-decision', hint: 'defer' },
]

/** Insert a new node as the sibling after the block the caret is in (append root if unknown). */
function insertBlock(editor: Editor, binding: SpecBinding, item: SlashItem): void {
  const block = editor.state.selection.$from.node(1)
  const nodeId = (block?.attrs?.nodeId as string | null) ?? null
  const snapshot = binding.getSnapshot()

  if (!snapshot || !nodeId) {
    binding.createNode({ type: item.type, parentId: null })
    return
  }
  const current = snapshot.nodes.find((n) => n.id === nodeId)
  const parentId = current?.parentId ?? null
  const siblings = parentId
    ? (snapshot.nodes.find((n) => n.id === parentId)?.children ?? [])
    : snapshot.rootIds
  binding.createNode({ type: item.type, parentId, index: siblings.indexOf(nodeId) + 1 })
}

function positionAt(el: HTMLElement | null, rect: DOMRect | null | undefined): void {
  if (!el || !rect) return
  el.style.left = `${rect.left}px`
  el.style.top = `${rect.bottom + 4}px`
}

export function createSlashCommand(binding: SpecBinding) {
  return Extension.create({
    name: 'slashCommand',
    addProseMirrorPlugins() {
      return [
        Suggestion<SlashItem>({
          editor: this.editor,
          char: '/',
          items: ({ query }) =>
            ITEMS.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())),
          command: ({ editor, range, props }) => {
            editor.chain().focus().deleteRange(range).run()
            insertBlock(editor, binding, props)
          },
          render: () => {
            let renderer: ReactRenderer | null = null
            let el: HTMLElement | null = null
            return {
              onStart: (props: SuggestionProps<SlashItem>) => {
                renderer = new ReactRenderer(SlashMenu, { props, editor: props.editor })
                const element = renderer.element as HTMLElement
                el = element
                element.style.position = 'fixed'
                element.style.zIndex = '50'
                document.body.appendChild(element)
                positionAt(element, props.clientRect?.())
              },
              onUpdate: (props: SuggestionProps<SlashItem>) => {
                renderer?.updateProps(props)
                positionAt(el, props.clientRect?.())
              },
              onKeyDown: (props: SuggestionKeyDownProps) => {
                if (props.event.key === 'Escape') return true
                return (
                  (renderer?.ref as SlashMenuHandle | undefined)?.onKeyDown(props.event) ?? false
                )
              },
              onExit: () => {
                el?.remove()
                renderer?.destroy()
                el = null
                renderer = null
              },
            }
          },
        }),
      ]
    },
  })
}
