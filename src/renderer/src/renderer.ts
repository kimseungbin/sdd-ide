// Renderer entry for the empty shell (BL-001). No framework yet — the editor
// adapter and UI arrive in M3 (BL-030+). This just confirms the window renders.
const app = document.getElementById('app')
if (app) {
  app.textContent = 'SDD IDE — empty shell (BL-001)'
}
