/*
  The git-integration contract. Neutral types shared by main (the `git` shell-out service),
  preload (bridge), and renderer (the Source Control tab). Git ops that `sem` doesn't cover —
  status / staging / commit / branch / log / line-diff — live here; the entity diff is `sem` (see
  ./sem). The store (specs) is separate and never touches git (D30); this is purely the code side.
*/

/** A porcelain status letter for one side (index or worktree). `' '` = unchanged. */
export type GitStatusCode = ' ' | 'M' | 'T' | 'A' | 'D' | 'R' | 'C' | 'U' | '?' | '!'

/** One changed path. `index` is the staged (X) side, `worktree` the unstaged (Y) side; a file can
 *  be non-blank on both (staged, then edited again). Untracked files read as `?`/`?`. */
export interface GitFileStatus {
  /** Root-relative path (the new path for renames). */
  path: string
  index: GitStatusCode
  worktree: GitStatusCode
  /** Original path, present for renames/copies (`R`/`C`). */
  origPath?: string
}

export interface GitStatus {
  /** Current branch, or `null` when detached / on an unborn branch. */
  branch: string | null
  detached: boolean
  files: GitFileStatus[]
}

export interface GitCommit {
  sha: string
  shortSha: string
  subject: string
  author: string
  /** Human-relative date, e.g. "2 hours ago". */
  relativeDate: string
}

export interface GitBranch {
  name: string
  current: boolean
}
