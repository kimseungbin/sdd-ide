import { describe, it, expect } from 'vitest'
import { parseBranches, parseLog, parseStatus } from './gitParse'

const NUL = '\0'

describe('parseStatus', () => {
  // Captured verbatim from `git status --porcelain=v1 -z -b` on a repo with one file per state.
  const raw = [
    '## main',
    'D  gone.txt',
    ' M keep.txt',
    'R  renamed.txt',
    'rename-me.txt',
    'AM staged-new.txt',
    '?? untracked.txt',
    '',
  ].join(NUL)

  const status = parseStatus(raw)

  it('reads the branch from the -b header', () => {
    expect(status.branch).toBe('main')
    expect(status.detached).toBe(false)
  })

  it('parses each XY code and path', () => {
    expect(status.files).toEqual([
      { path: 'gone.txt', index: 'D', worktree: ' ' },
      { path: 'keep.txt', index: ' ', worktree: 'M' },
      { path: 'renamed.txt', index: 'R', worktree: ' ', origPath: 'rename-me.txt' },
      { path: 'staged-new.txt', index: 'A', worktree: 'M' },
      { path: 'untracked.txt', index: '?', worktree: '?' },
    ])
  })

  it('pairs a rename with its original path (the trailing NUL token)', () => {
    const rename = status.files.find((f) => f.index === 'R')
    expect(rename?.path).toBe('renamed.txt')
    expect(rename?.origPath).toBe('rename-me.txt')
  })

  it('handles an unborn branch header', () => {
    expect(parseStatus('## No commits yet on main\0').branch).toBe('main')
  })

  it('flags a detached HEAD', () => {
    const s = parseStatus('## HEAD (no branch)\0')
    expect(s.branch).toBeNull()
    expect(s.detached).toBe(true)
  })

  it('strips the upstream suffix from the branch name', () => {
    expect(parseStatus('## main...origin/main [ahead 1]\0').branch).toBe('main')
  })
})

describe('parseBranches', () => {
  it('marks the current branch from the HEAD field', () => {
    const raw = ['*\0main', ' \0feature/x', ' \0fix/auth'].join('\n')
    expect(parseBranches(raw)).toEqual([
      { name: 'main', current: true },
      { name: 'feature/x', current: false },
      { name: 'fix/auth', current: false },
    ])
  })
})

describe('parseLog', () => {
  it('splits NUL-separated commit fields', () => {
    const raw = ['abc123def\0abc123d\0feat: thing\0Jane\x002 hours ago'].join('\n')
    expect(parseLog(raw)).toEqual([
      {
        sha: 'abc123def',
        shortSha: 'abc123d',
        subject: 'feat: thing',
        author: 'Jane',
        relativeDate: '2 hours ago',
      },
    ])
  })
})
