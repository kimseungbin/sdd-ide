import type { GitBranch, GitCommit, GitFileStatus, GitStatus, GitStatusCode } from '../shared/git'

/*
  Pure parsers for git's porcelain output — no electron, no subprocess, so they're unit-testable in
  isolation (git.ts wires these to the shell-out + IPC layer). Each takes the raw stdout of a
  specific `git` invocation and returns typed data.
*/

const NUL = '\0'

/**
 * Parse `git status --porcelain=v1 -z -b`. Entries are NUL-separated `XY<space>path`; a rename/copy
 * entry is followed by an extra NUL-token carrying the original path. The `-b` branch header
 * (`## <branch>[...upstream]`) comes first.
 */
export function parseStatus(raw: string): GitStatus {
  const tokens = raw.split(NUL)
  let branch: string | null = null
  let detached = false
  const files: GitFileStatus[] = []

  let i = 0
  if (tokens[i]?.startsWith('## ')) {
    const header = tokens[i].slice(3)
    if (header.startsWith('HEAD (no branch)')) {
      detached = true
    } else {
      // "main", "main...origin/main [ahead 1]", or "No commits yet on main" (unborn branch).
      const unborn = header.match(/^No commits yet on (.+)$/)
      branch = unborn ? unborn[1] : header.split('...')[0]
    }
    i++
  }

  for (; i < tokens.length; i++) {
    const entry = tokens[i]
    if (!entry) continue
    const index = entry[0] as GitStatusCode
    const worktree = entry[1] as GitStatusCode
    const file: GitFileStatus = { path: entry.slice(3), index, worktree }
    if (index === 'R' || index === 'C' || worktree === 'R' || worktree === 'C') {
      file.origPath = tokens[++i]
    }
    files.push(file)
  }
  return { branch, detached, files }
}

/** Parse `git branch --format=%(HEAD)%00%(refname:short)` — `*` in the HEAD field marks current. */
export function parseBranches(raw: string): GitBranch[] {
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [head, name] = line.split(NUL)
      return { name, current: head === '*' }
    })
}

/** Parse `git log --format=%H%x00%h%x00%s%x00%an%x00%cr` (NUL-separated fields, one commit/line). */
export function parseLog(raw: string): GitCommit[] {
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sha, shortSha, subject, author, relativeDate] = line.split(NUL)
      return { sha, shortSha, subject, author, relativeDate }
    })
}
