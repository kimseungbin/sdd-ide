import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * Proves the D8 orchestration path: the app layer can spawn CLI subprocesses
 * (provider CLIs, Claude Code, etc.) from the main process. The Electron binary
 * runs as plain Node via ELECTRON_RUN_AS_NODE. Returns trimmed stdout.
 *
 * This is a smoke-test seam for BL-001, not the real orchestration layer (BL-052).
 */
export async function runNode(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(process.execPath, args, {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  })
  return stdout.trim()
}
