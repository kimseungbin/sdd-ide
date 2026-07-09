import { lazy, Suspense, useMemo } from 'react'
import { createIpcBinding } from '../../spec-editor/binding.ipc'

// The Tiptap stack is heavy and only needed once a spec is open — load it as its own chunk.
const SpecEditor = lazy(() =>
  import('../../spec-editor/SpecEditor').then((m) => ({ default: m.SpecEditor })),
)

/*
  SpecDocument (BL-030) — the spec branch of the unified document pane: the spec as an editable
  rich document (a projection of the main-process store, edits via the validated IPC path, D2).
  The spec tree navigates here the way the directory tree navigates to a file. Editing is the
  human's job; agent-session role isolation (the D7 membrane) is enforced separately (M5).
*/
export function SpecDocument() {
  const binding = useMemo(() => createIpcBinding(), [])
  return (
    <div className="h-full overflow-auto p-3">
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <SpecEditor binding={binding} />
      </Suspense>
    </div>
  )
}
