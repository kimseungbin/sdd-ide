import type { Extension } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'

/** Pick a CodeMirror language extension from a filename, or null for plain text. */
export function languageFor(filename: string): Extension | null {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ts':
    case 'tsx':
      return javascript({ typescript: true, jsx: ext === 'tsx' })
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return javascript({ jsx: ext === 'jsx' })
    case 'html':
    case 'htm':
      return html()
    case 'css':
      return css()
    case 'json':
      return json()
    case 'md':
    case 'markdown':
      return markdown()
    default:
      return null
  }
}
