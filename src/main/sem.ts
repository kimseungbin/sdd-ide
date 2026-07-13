import { ipcMain } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { IPC } from '../shared/ipc'
import type { SemDiff } from '../shared/sem'
import { parseSemDiff } from './semParse'
import { run } from './subprocess'

/*
  The main-process `sem` service (P3). Runs `sem diff --format json` and returns the entity-level
  diff of the working tree vs HEAD. `sem` ships as the @ataraxy-labs/sem npm package whose bin is a
  Node launcher (bin/sem.js) that resolves the platform binary; we run it with our own Node runtime
  (the Electron binary via ELECTRON_RUN_AS_NODE) rather than a global `sem` on PATH, so it works
  without the user having node/sem installed. cwd = the workspace root, so it diffs this repo.
*/
const ROOT = process.cwd()
const SEM_JS = join(ROOT, 'node_modules', '@ataraxy-labs', 'sem', 'bin', 'sem.js')

async function diff(): Promise<SemDiff> {
  if (!existsSync(SEM_JS)) {
    throw new Error('sem is not installed (@ataraxy-labs/sem missing from node_modules)')
  }
  const out = await run(process.execPath, [SEM_JS, 'diff', '--format', 'json'], {
    cwd: ROOT,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  })
  return parseSemDiff(out)
}

export function registerSemIpc(): void {
  ipcMain.handle(IPC.semDiff, () => diff())
}
