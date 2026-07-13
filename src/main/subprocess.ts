import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface RunOptions {
  /** Working directory for the child process. Defaults to the main-process cwd. */
  cwd?: string
  /** Environment for the child. Defaults to the parent environment. */
  env?: NodeJS.ProcessEnv
}

/**
 * Spawn a CLI subprocess and return its trimmed stdout. Rejects (with stderr on
 * the error) when the process exits non-zero. Used by the git and `sem` shell-out
 * services — diffs and logs can be large, so the output buffer is generous.
 */
export async function run(cmd: string, args: string[], opts: RunOptions = {}): Promise<string> {
  const { stdout } = await execFileAsync(cmd, args, {
    cwd: opts.cwd,
    env: opts.env ?? process.env,
    maxBuffer: 32 * 1024 * 1024,
  })
  return stdout.trim()
}

/**
 * Proves the D8 orchestration path: the app layer can spawn CLI subprocesses
 * (provider CLIs, Claude Code, etc.) from the main process. The Electron binary
 * runs as plain Node via ELECTRON_RUN_AS_NODE. Returns trimmed stdout.
 *
 * This is a smoke-test seam for BL-001, not the real orchestration layer (BL-052).
 */
export async function runNode(args: string[]): Promise<string> {
  return run(process.execPath, args, {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  })
}
