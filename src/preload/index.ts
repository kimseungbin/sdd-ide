import { contextBridge } from 'electron'

// Minimal, safe bridge. The real spec-engine surface (BL-011) and MCP-parity
// operations (BL-050) get exposed here later; for the shell we only prove the
// contextIsolation wiring works.
contextBridge.exposeInMainWorld('sddIde', {
  versions: process.versions,
})
