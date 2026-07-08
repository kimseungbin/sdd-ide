import { TiptapSpike } from './TiptapSpike'

/*
  BL-002 spike stories — DD-2 is resolved (→ Tiptap; see FINDINGS.md). The Slate prototype was
  removed once both editors passed the Korean IME check and Tiptap won on schema-validity +
  maturity. What remains is the Tiptap prototype, kept as the seed for the real editor adapter
  (BL-030). Run `npm run ladle` and open this story.
*/
export default {
  title: 'Spike / Block editor (BL-002)',
}

function Checklist() {
  return (
    <div className="mb-3 rounded-md border border-border bg-surface p-3 text-xs text-fg">
      <p className="mb-1 font-semibold">Tiptap prototype — what the spike verified:</p>
      <ol className="ml-4 list-decimal text-muted">
        <li>
          <span className="text-fg">Korean IME:</span> type 한글 in a block, and mid-word press ↑/↓
          or edit another block — composition holds, no dropped/doubled jamo.
        </li>
        <li>
          <span className="text-fg">Store projection:</span> every keystroke reconciles into the
          “Store projection” + “Mutation log” panels below (edits flow through the adapter API).
        </li>
        <li>
          <span className="text-fg">Custom block:</span> the deferred-decision block renders a state
          toggle and stays editable (type Korean inside it too).
        </li>
      </ol>
    </div>
  )
}

export const Tiptap = () => (
  <div className="h-screen bg-base p-4 text-fg">
    <Checklist />
    <div className="h-[calc(100%-6rem)]">
      <TiptapSpike />
    </div>
  </div>
)
