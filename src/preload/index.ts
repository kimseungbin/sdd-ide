import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type SddIdeApi } from '../shared/ipc'

// Minimal, safe bridge (contextIsolation + sandbox): the renderer gets only these typed
// operations — never direct Node/fs access. The spec-engine (BL-011) and MCP-parity
// operations (BL-050) are exposed here later.
const api: SddIdeApi = {
  versions: process.versions,
  workspace: {
    root: () => ipcRenderer.invoke(IPC.workspaceRoot),
  },
  fs: {
    readDir: (path) => ipcRenderer.invoke(IPC.fsReadDir, path),
    readFile: (path) => ipcRenderer.invoke(IPC.fsReadFile, path),
    writeFile: (path, content) => ipcRenderer.invoke(IPC.fsWriteFile, path, content),
  },
  spec: {
    getSnapshot: () => ipcRenderer.invoke(IPC.specGetSnapshot),
    onChanged: (listener) => {
      const handler = (): void => listener()
      ipcRenderer.on(IPC.specChanged, handler)
      return () => ipcRenderer.removeListener(IPC.specChanged, handler)
    },
  },
}

contextBridge.exposeInMainWorld('sddIde', api)
