import { BrowserWindow, ipcMain } from 'electron'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { IPC, type DirEntry } from '../shared/ipc'
import type { MainSpecStore } from './specStore'

/*
  Main-process handlers for the fs IPC (BL-036). The renderer is sandboxed with no filesystem
  access, so all reads happen here. Reads are constrained to the workspace root — a path that
  resolves outside the root is rejected (traversal guard).
*/
const ROOT = process.cwd()
const HIDDEN = new Set(['node_modules'])

function assertInRoot(target: string): string {
  const abs = resolve(target)
  if (abs !== ROOT && !abs.startsWith(ROOT + sep)) {
    throw new Error(`Path escapes the workspace root: ${target}`)
  }
  return abs
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.workspaceRoot, (): string => ROOT)

  ipcMain.handle(IPC.fsReadDir, async (_event, path: string): Promise<DirEntry[]> => {
    const dir = assertInRoot(path)
    const entries = await readdir(dir, { withFileTypes: true })
    return entries
      .filter((entry) => !entry.name.startsWith('.') && !HIDDEN.has(entry.name))
      .map((entry) => ({
        name: entry.name,
        path: resolve(dir, entry.name),
        isDirectory: entry.isDirectory(),
      }))
      .sort((a, b) => Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name))
  })

  ipcMain.handle(IPC.fsReadFile, async (_event, path: string): Promise<string> => {
    return readFile(assertInRoot(path), 'utf8')
  })

  ipcMain.handle(IPC.fsWriteFile, async (_event, path: string, content: string): Promise<void> => {
    await writeFile(assertInRoot(path), content, 'utf8')
  })
}

// Read-only spec access for the renderer (the store + engine live in main, D30). Mutations are
// NOT exposed here — the impl-session workspace is read-only toward the spec (membrane, D7).
export function registerSpecIpc(store: MainSpecStore): void {
  ipcMain.handle(IPC.specGetSnapshot, () => store.getSnapshot())
  store.subscribe(() => {
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.specChanged)
  })
}
