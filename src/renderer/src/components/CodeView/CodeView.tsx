import { useEffect, useRef } from 'react'
import { Compartment, EditorState } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { bracketMatching, indentOnInput } from '@codemirror/language'
import { jetbrainsTheme } from './theme'
import { languageFor } from './language'

/*
  CodeView (BL-037, DD-10) — the code pane's editor, wrapping CodeMirror 6 (JetBrains/Darcula
  theme). Read-first: `editable` defaults to false (a viewer). Presentation is owned here; the
  public API is a closed prop set (no className/style escape hatch, Rule 2). Colours come from
  tokens via the theme (Rule 4). Give it a `key` per file so switching files remounts cleanly.
*/
export interface CodeViewProps {
  value: string
  filename: string
  /** Read-first: false = read-only viewer (default); true = the edit escape hatch (D20). */
  editable?: boolean
  onChange?: (value: string) => void
  onSave?: () => void
}

export function CodeView({ value, filename, editable = false, onChange, onSave }: CodeViewProps) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const editableComp = useRef(new Compartment())

  // Latest props behind a ref, so the mount-once editor reads the initial doc/filename and never
  // calls stale onChange/onSave closures — without listing them as effect deps.
  const props = useRef({ value, filename, editable, onChange, onSave })
  props.current = { value, filename, editable, onChange, onSave }

  useEffect(() => {
    if (!host.current) return
    const { value: doc, filename: name, editable: initialEditable } = props.current
    const state = EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        history(),
        bracketMatching(),
        indentOnInput(),
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              props.current.onSave?.()
              return true
            },
          },
          indentWithTab,
          ...historyKeymap,
          ...defaultKeymap,
        ]),
        jetbrainsTheme,
        languageFor(name) ?? [],
        editableComp.current.of([
          EditorView.editable.of(initialEditable),
          EditorState.readOnly.of(!initialEditable),
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) props.current.onChange?.(update.state.doc.toString())
        }),
      ],
    })
    const editor = new EditorView({ state, parent: host.current })
    view.current = editor
    return () => {
      editor.destroy()
      view.current = null
    }
  }, [])

  // Toggle read-only ↔ editable without losing the doc.
  useEffect(() => {
    view.current?.dispatch({
      effects: editableComp.current.reconfigure([
        EditorView.editable.of(editable),
        EditorState.readOnly.of(!editable),
      ]),
    })
    if (editable) view.current?.focus()
  }, [editable])

  return <div ref={host} className="h-full overflow-hidden" />
}
