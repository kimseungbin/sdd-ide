import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type SddIdeApi } from '../shared/ipc'
import type { AgentDone, AgentError, AgentTextDelta, AskUserRequest } from '../shared/agent'

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
  agent: {
    send: (turnId, messages) => ipcRenderer.invoke(IPC.agentSend, turnId, messages),
    answerAsk: (answer) => ipcRenderer.send(IPC.agentAnswerAsk, answer),
    onDelta: (listener) => {
      const handler = (_e: unknown, delta: AgentTextDelta): void => listener(delta)
      ipcRenderer.on(IPC.agentDelta, handler)
      return () => ipcRenderer.removeListener(IPC.agentDelta, handler)
    },
    onAsk: (listener) => {
      const handler = (_e: unknown, request: AskUserRequest): void => listener(request)
      ipcRenderer.on(IPC.agentAsk, handler)
      return () => ipcRenderer.removeListener(IPC.agentAsk, handler)
    },
    onDone: (listener) => {
      const handler = (_e: unknown, done: AgentDone): void => listener(done)
      ipcRenderer.on(IPC.agentDone, handler)
      return () => ipcRenderer.removeListener(IPC.agentDone, handler)
    },
    onError: (listener) => {
      const handler = (_e: unknown, error: AgentError): void => listener(error)
      ipcRenderer.on(IPC.agentError, handler)
      return () => ipcRenderer.removeListener(IPC.agentError, handler)
    },
  },
  menu: {
    onOpenSettings: (listener) => {
      const handler = (): void => listener()
      ipcRenderer.on(IPC.menuOpenSettings, handler)
      return () => ipcRenderer.removeListener(IPC.menuOpenSettings, handler)
    },
  },
  credentials: {
    status: (provider) => ipcRenderer.invoke(IPC.credentialsStatus, provider),
    setKey: (provider, key) => ipcRenderer.invoke(IPC.credentialsSetKey, provider, key),
    clearKey: (provider) => ipcRenderer.invoke(IPC.credentialsClearKey, provider),
    secureStorageStatus: () => ipcRenderer.invoke(IPC.credentialsSecureStorageStatus),
  },
}

contextBridge.exposeInMainWorld('sddIde', api)
