import { useEffect, useMemo, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { NodeId, SpecSnapshot } from '../../../engine'
import { createSpecExtensions } from './schema'
import { snapshotToDoc, structuralSignature } from './projection'
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

export function SpecEditor({ binding }: { binding: SpecBinding }) {
  const extensions = useMemo(() => createSpecExtensions(binding), [binding])
  const mountSnap = useMemo(() => binding.getSnapshot(), [binding])

  // The signature the editor's current content represents; the store titles we last knew (to
  // diff edits against); and the debounced write-back queue.
  const sigRef = useRef(structuralSignature(mountSnap))
  const storeTitles = useRef(new Map<NodeId, string>())
  const pending = useRef(new Map<NodeId, string>())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flush = useRef(() => {
    for (const [id, title] of pending.current) binding.updateNode(id, { title })
    pending.current.clear()
    timer.current = null
  })

  const editor = useEditor({
    extensions,
    content: snapshotToDoc(mountSnap ?? EMPTY_SNAPSHOT),
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
      const sig = structuralSignature(snap)
      if (sig !== sigRef.current) {
        sigRef.current = sig
        editor?.commands.setContent(snapshotToDoc(snap ?? EMPTY_SNAPSHOT), { emitUpdate: false })
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
