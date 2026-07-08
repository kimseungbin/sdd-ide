import { Panel as ResizablePanel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Panel } from '../components/Panel'
import { AgentPanel } from './panes/AgentPanel'
import { EditorPanel } from './panes/EditorPanel'
import { LeftRail } from './LeftRail'

/*
  WorkspaceShell (BL-035) — the implementation-session workspace (the impl side of the membrane,
  D7). A drag-resizable three-part layout:

    ┌────────┬────────────┬────────────┐
    │ dir    │            │            │
    │        │   agent    │   editor   │
    ├────────┤  (center)  │  (right)   │
    │ spec   │       1:1 agent:editor  │
    └────────┴────────────┴────────────┘
      left rail       two equal main panes

  Left rail = directory + spec, swap/collapse (LeftRail). Chat and editor default 1:1. Every
  divider is drag-resizable; sizes persist via autoSaveId (localStorage). Layout uses page-level
  composition + the third-party resize primitive; our own components keep their closed APIs.
*/
function Handle() {
  return (
    <PanelResizeHandle className="group flex w-2 shrink-0 items-center justify-center">
      <div className="h-8 w-1 rounded-full bg-border transition-colors group-hover:bg-brand" />
    </PanelResizeHandle>
  )
}

export function WorkspaceShell() {
  return (
    <div className="h-screen bg-base p-2">
      <PanelGroup direction="horizontal" autoSaveId="sdd-workspace" className="h-full">
        <ResizablePanel id="rail" order={1} defaultSize={20} minSize={12}>
          <LeftRail />
        </ResizablePanel>

        <Handle />

        <ResizablePanel id="agent" order={2} defaultSize={40} minSize={20}>
          <Panel title="Agent" padding="none">
            <AgentPanel />
          </Panel>
        </ResizablePanel>

        <Handle />

        <ResizablePanel id="editor" order={3} defaultSize={40} minSize={20}>
          <Panel title="Editor" padding="none">
            <EditorPanel />
          </Panel>
        </ResizablePanel>
      </PanelGroup>
    </div>
  )
}
