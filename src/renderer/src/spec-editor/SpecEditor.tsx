import { useEffect, useMemo, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import type { NodeId, SpecSnapshot } from '../../../engine'
import { createSpecExtensions } from './schema'
import { snapshotToDoc, structuralSignature } from './projection'
import { indentTarget, outdentTarget, previousBlockId, siblingAfter } from './structural'
import type { SpecBinding } from './binding'

/*
  BL-030 — the editor adapter. The Tiptap document is a *projection* of the store (never truth,
  AC #3): it's built from a snapshot, and every edit becomes a validated mutation on the store's
  single write path via the binding (AC #2), keyed by each block's `nodeId` (AC #1).

  Echo discipline (why typing stays smooth / IME-safe, AC #4):
   - A title keystroke → debounced `updateNode(id, {title})`. The store changes and notifies, but
     a title is NOT part of the structural signature, so we do NOT rebuild the doc — the caret and
     any in-flight IME composition are left untouched.
   - The doc is rebuilt (setContent) ONLY when the structural signature changes: a node added /
     removed / moved / reordered, or a task status / decision state flipped — i.e. an external or
     discrete change where a caret reset is fine.
*/
const EMPTY_SNAPSHOT: SpecSnapshot = { version: 1, rootIds: [], nodes: [], edges: [] }
const TITLE_DEBOUNCE_MS = 250

/** Put the caret inside the block for `nodeId` (used after a slash-insert re-projects). */
function focusBlock(editor: Editor, nodeId: NodeId): void {
  let target: number | null = null
  editor.state.doc.descendants((node, pos) => {
    if (target === null && node.type.name === 'specBlock' && node.attrs.nodeId === nodeId) {
      target = pos + node.nodeSize - 1 // just inside the end of the block's content
    }
    return target === null
  })
  if (target !== null) editor.chain().setTextSelection(target).focus().run()
}

export function SpecEditor({ binding }: { binding: SpecBinding }) {
  const extensions = useMemo(() => createSpecExtensions(binding), [binding])
  const mountSnap = useMemo(() => binding.getSnapshot(), [binding])

  // The signature the editor's current content represents; the store titles we last knew (to
  // diff edits against); and the debounced write-back queue.
  const sigRef = useRef(structuralSignature(mountSnap))
  const storeTitles = useRef(new Map<NodeId, string>())
  const knownIds = useRef(new Set<NodeId>(mountSnap?.nodes.map((n) => n.id)))
  const pending = useRef(new Map<NodeId, string>())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // After a structural mutation, which block should get the caret once it re-projects.
  const focusAfterSync = useRef<NodeId | null>(null)

  const flush = useRef(() => {
    for (const [id, title] of pending.current) binding.updateNode(id, { title })
    pending.current.clear()
    timer.current = null
  })

  const editor = useEditor({
    extensions,
    content: snapshotToDoc(mountSnap ?? EMPTY_SNAPSHOT),
    editorProps: {
      // Structural keys operate on the STORE (D2), not the ProseMirror doc — the reprojection
      // reflects the move and the caret follows via focusAfterSync / the focus-new heuristic.
      handleKeyDown: (view, event) => {
        if (event.isComposing) return false // let the IME own composition keystrokes
        const sel = view.state.selection
        const block = sel.$from.node(1)
        const nodeId = (block?.attrs?.nodeId as NodeId | null) ?? null
        const snap = binding.getSnapshot()
        if (!snap) return false

        if (event.key === 'Tab') {
          if (nodeId) {
            const target = event.shiftKey ? outdentTarget(snap, nodeId) : indentTarget(snap, nodeId)
            if (target) {
              focusAfterSync.current = nodeId
              binding.moveNode(nodeId, target.parentId, target.index)
            }
          }
          return true // always swallow Tab (never move focus out of the editor)
        }

        if (event.key === 'Enter' && !event.shiftKey) {
          const current = nodeId ? snap.nodes.find((n) => n.id === nodeId) : undefined
          const type = current?.type === 'task' ? 'task' : 'text'
          const { parentId, index } = siblingAfter(snap, nodeId)
          binding.createNode({ type, parentId, index })
          return true // prevent the default split (would duplicate the block's nodeId)
        }

        if (event.key === 'Backspace') {
          if (!sel.empty || sel.$from.parentOffset !== 0 || !nodeId) return false
          const current = snap.nodes.find((n) => n.id === nodeId)
          const emptyLeaf = block?.content.size === 0 && (current?.children.length ?? 0) === 0
          if (emptyLeaf) {
            focusAfterSync.current = previousBlockId(snap, nodeId)
            binding.deleteNode(nodeId)
          }
          return true // at block start: swallow to avoid cross-block content merges
        }

        return false
      },
    },
    onUpdate: ({ editor: instance }) => {
      instance.state.doc.forEach((child) => {
        const id = child.attrs.nodeId as NodeId | null
        if (!id) return
        const text = child.textContent
        if (storeTitles.current.get(id) !== text) {
          pending.current.set(id, text)
          storeTitles.current.set(id, text) // optimistic: don't re-queue on the echo
        }
      })
      if (pending.current.size > 0) {
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(flush.current, TITLE_DEBOUNCE_MS)
      }
    },
  })

  // Seed known titles, then rebuild the doc on structural (not title) changes from the store.
  useEffect(() => {
    if (mountSnap) for (const n of mountSnap.nodes) storeTitles.current.set(n.id, n.title)

    const sync = (): void => {
      const snap = binding.getSnapshot()
      if (snap) for (const n of snap.nodes) storeTitles.current.set(n.id, n.title)
      const nextIds = new Set<NodeId>(snap?.nodes.map((n) => n.id))
      const added = [...nextIds].filter((id) => !knownIds.current.has(id))
      knownIds.current = nextIds
      const sig = structuralSignature(snap)
      if (sig !== sigRef.current) {
        sigRef.current = sig
        editor?.commands.setContent(snapshotToDoc(snap ?? EMPTY_SNAPSHOT), { emitUpdate: false })
        if (editor) {
          // A move/delete names its target; else a single freshly-created node gets the caret.
          const explicit = focusAfterSync.current
          focusAfterSync.current = null
          if (explicit) focusBlock(editor, explicit)
          else if (added.length === 1) focusBlock(editor, added[0])
        }
      }
    }

    const unsub = binding.subscribe(sync)
    sync() // catch a snapshot that resolved between mount and subscribe
    return unsub
  }, [binding, editor, mountSnap])

  // Don't lose the last debounced edit on unmount.
  useEffect(() => {
    const flushFn = flush.current
    return () => {
      if (timer.current) clearTimeout(timer.current)
      flushFn()
    }
  }, [])

  return <EditorContent editor={editor} className="spec-editor text-fg" />
}
