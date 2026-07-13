import { ipcMain } from 'electron'
import { IPC } from '../shared/ipc'
import type { GitBranch, GitCommit, GitStatus } from '../shared/git'
import { parseBranches, parseLog, parseStatus } from './gitParse'
import { run } from './subprocess'

/*
  The main-process git service (P1 of the git panel). Shells out to the system `git` for the
  operations `sem` doesn't cover — status / staging / commit / branch / log / line-diff. All
  commands run with cwd = the workspace root; paths from the renderer are passed as argv after a
  `--` separator (no shell), so they can't be interpreted as options or injected. Errors reject
  with git's stderr in the message, which crosses IPC to the renderer as-is.
*/
const ROOT = process.cwd()

async function git(args: string[]): Promise<string> {
  return run('git', args, { cwd: ROOT })
}

async function isRepo(): Promise<boolean> {
  try {
    return (await git(['rev-parse', '--is-inside-work-tree'])) === 'true'
  } catch {
    return false
  }
}

async function status(): Promise<GitStatus> {
  return parseStatus(await git(['status', '--porcelain=v1', '-z', '-b']))
}

async function stage(paths: string[]): Promise<void> {
  await git(['add', '--', ...paths])
}

async function unstage(paths: string[]): Promise<void> {
  await git(['restore', '--staged', '--', ...paths])
}

/** Revert selected changes back to HEAD. Tracked paths are restored (index + worktree); untracked
 *  paths among the selection are removed. Classified via status so neither command errors on the
 *  wrong kind of path. */
async function discard(paths: string[]): Promise<void> {
  const { files } = await status()
  const untracked = new Set(
    files.filter((f) => f.index === '?' && f.worktree === '?').map((f) => f.path),
  )
  const tracked = paths.filter((p) => !untracked.has(p))
  const toClean = paths.filter((p) => untracked.has(p))
  if (tracked.length) {
    await git(['restore', '--staged', '--worktree', '--source=HEAD', '--', ...tracked])
  }
  if (toClean.length) await git(['clean', '-fq', '--', ...toClean])
}

async function commit(message: string): Promise<void> {
  await git(['commit', '-m', message])
}

async function currentBranch(): Promise<string | null> {
  return (await git(['branch', '--show-current'])) || null
}

async function branches(): Promise<GitBranch[]> {
  return parseBranches(await git(['branch', '--format=%(HEAD)%00%(refname:short)']))
}

async function checkout(name: string): Promise<void> {
  await git(['switch', name])
}

async function createBranch(name: string): Promise<void> {
  await git(['switch', '-c', name])
}

async function log(limit = 50): Promise<GitCommit[]> {
  try {
    return parseLog(
      await git(['log', '-n', String(limit), '--format=%H%x00%h%x00%s%x00%an%x00%cr']),
    )
  } catch {
    return [] // unborn branch: no commits yet
  }
}

/** Unified `git diff` of the working tree vs HEAD for one file — the line-diff fallback source. */
async function diff(path: string): Promise<string> {
  return git(['diff', 'HEAD', '--', path])
}

export function registerGitIpc(): void {
  ipcMain.handle(IPC.gitIsRepo, () => isRepo())
  ipcMain.handle(IPC.gitStatus, () => status())
  ipcMain.handle(IPC.gitStage, (_e, paths: string[]) => stage(paths))
  ipcMain.handle(IPC.gitUnstage, (_e, paths: string[]) => unstage(paths))
  ipcMain.handle(IPC.gitDiscard, (_e, paths: string[]) => discard(paths))
  ipcMain.handle(IPC.gitCommit, (_e, message: string) => commit(message))
  ipcMain.handle(IPC.gitCurrentBranch, () => currentBranch())
  ipcMain.handle(IPC.gitBranches, () => branches())
  ipcMain.handle(IPC.gitCheckout, (_e, name: string) => checkout(name))
  ipcMain.handle(IPC.gitCreateBranch, (_e, name: string) => createBranch(name))
  ipcMain.handle(IPC.gitLog, (_e, limit?: number) => log(limit))
  ipcMain.handle(IPC.gitDiff, (_e, path: string) => diff(path))
}
