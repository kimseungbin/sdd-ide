/*
  The main↔renderer IPC contract (BL-036, BL-020). Shared by main (handlers), preload (bridge),
  and renderer (window.sddIde typing). Covers filesystem reads and read-only access to the spec
  store (which lives in main, D30); the MCP (BL-050) surface will extend it over time.
*/
import type { SpecSnapshot } from '../engine'

export interface DirEntry {
  name: string
  /** Absolute path. */
  path: string
  isDirectory: boolean
}

export interface SddIdeApi {
  versions: NodeJS.ProcessVersions
  workspace: {
    /** Absolute path of the workspace root. */
    root(): Promise<string>
  }
  fs: {
    /** List a directory's entries (directories first). Root-scoped. */
    readDir(path: string): Promise<DirEntry[]>
    /** Read a UTF-8 text file. Root-scoped. */
    readFile(path: string): Promise<string>
    /** Write a UTF-8 text file (the editor's edit/save escape hatch, D20). Root-scoped. */
    writeFile(path: string, content: string): Promise<void>
  }
  spec: {
    /** Read-only snapshot of the spec store (the store lives in main, D30). */
    getSnapshot(): Promise<SpecSnapshot>
    /** Subscribe to store changes; returns an unsubscribe. */
    onChanged(listener: () => void): () => void
  }
}

export const IPC = {
  workspaceRoot: 'workspace:root',
  fsReadDir: 'fs:readDir',
  fsReadFile: 'fs:readFile',
  fsWriteFile: 'fs:writeFile',
  specGetSnapshot: 'spec:getSnapshot',
  specChanged: 'spec:changed',
} as const
