import { Panel as ResizablePanel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Panel } from '../components/Panel'
import { AgentPanel } from './panes/AgentPanel'
import { EditorPanel } from './panes/EditorPanel'
import { RightRail } from './RightRail'

/*
  WorkspaceShell (BL-035) — the implementation-session workspace (the impl side of the membrane,
  D7). A drag-resizable three-part layout:

    ┌────────────┬────────────┬────────┐
    │            │            │ dir    │
    │   agent    │   editor   │        │
    │  (left)    │  (center)  ├────────┤
    │  1:1 agent:editor       │ spec   │
    └────────────┴────────────┴────────┘
      two equal main panes      right rail

  Right rail = directory + spec, swap/collapse (RightRail). Chat and editor default 1:1. Every
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
    <div className="h-full bg-base p-2">
      <PanelGroup direction="horizontal" autoSaveId="sdd-workspace-v2" className="h-full">
        <ResizablePanel id="agent" order={1} defaultSize={40} minSize={20}>
          <Panel title="Agent" padding="none">
            <AgentPanel />
          </Panel>
        </ResizablePanel>

        <Handle />

        <ResizablePanel id="editor" order={2} defaultSize={40} minSize={20}>
          <Panel title="Editor" padding="none">
            <EditorPanel />
          </Panel>
        </ResizablePanel>

        <Handle />

        <ResizablePanel id="rail" order={3} defaultSize={20} minSize={12}>
          <RightRail />
        </ResizablePanel>
      </PanelGroup>
    </div>
  )
}
