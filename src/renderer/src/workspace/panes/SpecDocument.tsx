import { useMemo } from 'react'
import { SpecEditor } from '../../spec-editor/SpecEditor'
import { createIpcBinding } from '../../spec-editor/binding.ipc'

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
      <SpecEditor binding={binding} />
    </div>
  )
}
