import { useState } from 'react'
import { Button } from './components/Button'
import { WorkspaceShell } from './workspace/WorkspaceShell'
import { SpecAuthoring } from './spec-editor/SpecAuthoring'

/*
  Two session surfaces, separated by the membrane (D7): the impl-session workspace (read-only
  toward the spec) and the spec-authoring editor (the write path, BL-030). This top bar is a
  provisional selector — the real session model (roles, isolation) is M5 (BL-053/BL-054).
*/
type View = 'workspace' | 'spec'

export function App() {
  const [view, setView] = useState<View>('workspace')
  return (
    <div className="flex h-screen flex-col bg-base">
      <nav
        aria-label="Session"
        className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1"
      >
        <Button
          variant={view === 'workspace' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setView('workspace')}
        >
          Workspace
        </Button>
        <Button
          variant={view === 'spec' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setView('spec')}
        >
          Spec authoring
        </Button>
      </nav>
      <div className="min-h-0 flex-1">
        {view === 'workspace' ? <WorkspaceShell /> : <SpecAuthoring />}
      </div>
    </div>
  )
}
