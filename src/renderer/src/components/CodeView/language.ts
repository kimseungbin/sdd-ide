import type { Extension } from '@codemirror/state'

/**
 * Pick a CodeMirror language extension from a filename, or null for plain text.
 * Grammars are imported on demand (dynamic import → its own chunk) so the ~5 language
 * packages stay out of the initial renderer bundle and load only when a file of that
 * type is opened. Async as a result; CodeView swaps the grammar in via a Compartment.
 */
export async function languageFor(filename: string): Promise<Extension | null> {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ts':
    case 'tsx': {
      const { javascript } = await import('@codemirror/lang-javascript')
      return javascript({ typescript: true, jsx: ext === 'tsx' })
    }
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs': {
      const { javascript } = await import('@codemirror/lang-javascript')
      return javascript({ jsx: ext === 'jsx' })
    }
    case 'html':
    case 'htm': {
      const { html } = await import('@codemirror/lang-html')
      return html()
    }
    case 'css': {
      const { css } = await import('@codemirror/lang-css')
      return css()
    }
    case 'json': {
      const { json } = await import('@codemirror/lang-json')
      return json()
    }
    case 'md':
    case 'markdown': {
      const { markdown } = await import('@codemirror/lang-markdown')
      return markdown()
    }
    default:
      return null
  }
}
