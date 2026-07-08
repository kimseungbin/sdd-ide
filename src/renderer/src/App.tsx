import { WorkspaceShell } from './workspace/WorkspaceShell'

// The renderer's root view is the workspace shell (BL-035): directory · document · spec · agent.
// The document pane shows whatever is open — a file (code) or the spec (editor) — so there's no
// separate "authoring mode"; the spec is just another document. Built on the BL-033 foundation.
export function App() {
  return <WorkspaceShell />
}
