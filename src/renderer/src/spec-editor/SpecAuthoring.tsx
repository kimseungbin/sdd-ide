import { useMemo } from 'react'
import { Panel } from '../components/Panel'
import { SpecEditor } from './SpecEditor'
import { createIpcBinding } from './binding.ipc'

/*
  BL-030 — the spec-authoring surface: the *write* side of the membrane (D7), deliberately
  separate from the impl-session workspace (which stays read-only toward the spec). The editor
  projects the main-process store and routes every edit through the validated IPC mutation path
  (D2). A provisional top-level switch (App) selects between the two surfaces until the real
  session model lands (M5/BL-053).
*/
export function SpecAuthoring() {
  const binding = useMemo(() => createIpcBinding(), [])
  return (
    <div className="h-full p-2">
      <Panel title="Spec — authoring">
        <SpecEditor binding={binding} />
      </Panel>
    </div>
  )
}
