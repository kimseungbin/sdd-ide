import { WorkspaceShell } from './workspace/WorkspaceShell'

// The renderer's root view is the implementation-session workspace shell (BL-035):
// directory · editor · spec · agent. Built on the BL-033 component foundation.
export function App() {
  return <WorkspaceShell />
}
