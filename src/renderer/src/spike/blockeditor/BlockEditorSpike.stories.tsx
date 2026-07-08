import { TiptapSpike } from './TiptapSpike'
import { SlateSpike } from './SlateSpike'

/*
  BL-002 spike stories (throwaway) — run `npm run ladle` and open this story.

  The make-or-break test is human-in-the-loop: type Korean with a real IME and judge.
*/
export default {
  title: 'Spike / Block editor (BL-002)',
}

function Checklist() {
  return (
    <div className="mb-3 rounded-md border border-border bg-surface p-3 text-xs text-fg">
      <p className="mb-1 font-semibold">BL-002 — type into each editor to compare:</p>
      <ol className="ml-4 list-decimal text-muted">
        <li>
          <span className="text-fg">Korean IME (make-or-break):</span> type 한글 in a block, and
          also mid-word press ↑/↓ or edit another block. Composition must not break or drop
          characters.
        </li>
        <li>
          <span className="text-fg">Adapter friction:</span> every keystroke should reconcile into
          the “Store projection” + “Mutation log” panels below each editor.
        </li>
        <li>
          <span className="text-fg">Custom block:</span> the deferred-decision block renders a state
          toggle and stays editable (type Korean inside it too).
        </li>
      </ol>
    </div>
  )
}

export const SideBySide = () => (
  <div className="h-screen bg-base p-4 text-fg">
    <Checklist />
    <div className="grid h-[calc(100%-6rem)] grid-cols-2 gap-4">
      <TiptapSpike />
      <SlateSpike />
    </div>
  </div>
)

export const Tiptap = () => (
  <div className="h-screen bg-base p-4">
    <TiptapSpike />
  </div>
)

export const Slate = () => (
  <div className="h-screen bg-base p-4">
    <SlateSpike />
  </div>
)
