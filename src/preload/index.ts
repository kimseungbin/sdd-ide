import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type SddIdeApi } from '../shared/ipc'

// Minimal, safe bridge (contextIsolation + sandbox): the renderer gets only these typed
// operations — never direct Node/fs access. Spec reads + validated writes (D2) are here;
// MCP-parity operations (BL-050) are exposed later.
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
    updateNode: (id, patch) => ipcRenderer.invoke(IPC.specUpdateNode, id, patch),
    changeNodeType: (id, type) => ipcRenderer.invoke(IPC.specChangeNodeType, id, type),
    createNode: (input) => ipcRenderer.invoke(IPC.specCreateNode, input),
    moveNode: (id, newParentId, index) =>
      ipcRenderer.invoke(IPC.specMoveNode, id, newParentId, index),
    deleteNode: (id) => ipcRenderer.invoke(IPC.specDeleteNode, id),
  },
}

contextBridge.exposeInMainWorld('sddIde', api)
