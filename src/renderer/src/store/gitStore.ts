/*
  Git panel state (P2). The git service lives in MAIN (shells out to `git`); this is a thin IPC
  client that caches the working-tree status, branches, and log so panes stay projections (Rule 6).

  Git has no main→renderer change events, so state is pull-based: refresh() runs on mount of the
  Source Control tab, after every mutation (stage/commit/checkout/…), and whenever the window
  regains focus (catches external edits / terminal git). Mutations funnel through run(), which
  flips `busy`, surfaces errors honestly, and re-reads status on success. `rev` bumps on every
  data refresh so git-derived views (the open diff) can re-fetch off a single signal.
*/
import type { GitBranch, GitCommit, GitStatus } from '../../../shared/git'

export interface GitState {
  /** null until the first probe resolves. */
  isRepo: boolean | null
  status: GitStatus | null
  branches: GitBranch[]
  log: GitCommit[]
  busy: boolean
  error: string | null
  /** Bumped on each successful data refresh — a cheap freshness signal for dependent views. */
  rev: number
}

let state: GitState = {
  isRepo: null,
  status: null,
  branches: [],
  log: [],
  busy: false,
  error: null,
  rev: 0,
}
const listeners = new Set<() => void>()

function set(patch: Partial<GitState>): void {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

async function refresh(): Promise<void> {
  const isRepo = await window.sddIde.git.isRepo()
  if (!isRepo) {
    set({ isRepo: false, status: null, branches: [], log: [], rev: state.rev + 1 })
    return
  }
  const [status, branches, log] = await Promise.all([
    window.sddIde.git.status(),
    window.sddIde.git.branches(),
    window.sddIde.git.log(30),
  ])
  set({ isRepo: true, status, branches, log, rev: state.rev + 1 })
}

/** Run a mutation, then re-read status. Errors are captured on the state, never thrown at the UI. */
async function run(action: () => Promise<void>): Promise<void> {
  set({ busy: true, error: null })
  try {
    await action()
    await refresh()
  } catch (err) {
    set({ error: err instanceof Error ? err.message : String(err) })
  } finally {
    set({ busy: false })
  }
}

export const gitStore = {
  subscribe(onChange: () => void): () => void {
    listeners.add(onChange)
    return () => {
      listeners.delete(onChange)
    }
  },
  getSnapshot(): GitState {
    return state
  },
  refresh(): void {
    void refresh()
  },
  stage(paths: string[]): void {
    void run(() => window.sddIde.git.stage(paths))
  },
  unstage(paths: string[]): void {
    void run(() => window.sddIde.git.unstage(paths))
  },
  discard(paths: string[]): void {
    void run(() => window.sddIde.git.discard(paths))
  },
  commit(message: string): void {
    void run(() => window.sddIde.git.commit(message))
  },
  checkout(name: string): void {
    void run(() => window.sddIde.git.checkout(name))
  },
  createBranch(name: string): void {
    void run(() => window.sddIde.git.createBranch(name))
  },
}

// Keep git-derived views fresh when the window regains focus (external edits, terminal git, a
// branch switch in another tool). Only meaningful once a git view has been shown (this module is
// imported lazily by the Source Control tab), so there is no cost until git is first used.
window.addEventListener('focus', () => {
  if (state.isRepo !== false) void refresh()
})
