import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

/*
  JetBrains/Darcula theme for the code pane (DD-10). Every colour is a `var(--cm-*)` token from
  styles/theme.css — no hardcoded hex here (Rule 4). Chrome (background, gutter, selection,
  caret) + a Lezer HighlightStyle for syntax.
*/
const chrome = EditorView.theme(
  {
    '&': {
      color: 'var(--cm-fg)',
      backgroundColor: 'var(--cm-bg)',
      height: '100%',
      fontSize: 'var(--cm-font-size)',
    },
    '.cm-content': {
      caretColor: 'var(--cm-caret)',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--cm-caret)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'var(--cm-selection)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--cm-bg)',
      color: 'var(--cm-gutter)',
      border: 'none',
    },
    '.cm-activeLine': { backgroundColor: 'var(--cm-active-line)' },
    '.cm-activeLineGutter': { backgroundColor: 'var(--cm-active-line)' },
    '.cm-scroller': { fontFamily: 'inherit' },
  },
  { dark: true },
)

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.controlKeyword, t.operatorKeyword], color: 'var(--cm-keyword)' },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--cm-string)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--cm-number)' },
  { tag: [t.lineComment, t.blockComment, t.docComment], color: 'var(--cm-comment)', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: 'var(--cm-function)' },
  { tag: [t.typeName, t.className, t.namespace, t.definition(t.typeName)], color: 'var(--cm-type)' },
  { tag: [t.propertyName, t.attributeName], color: 'var(--cm-property)' },
  { tag: [t.tagName, t.angleBracket], color: 'var(--cm-tag)' },
  { tag: [t.meta, t.documentMeta, t.processingInstruction], color: 'var(--cm-comment)' },
  { tag: t.invalid, color: 'var(--cm-invalid)' },
])

export const jetbrainsTheme = [chrome, syntaxHighlighting(highlight)]
