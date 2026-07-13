import { useEffect, useState } from 'react'
import { Badge, type BadgeProps } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { Input } from '../../components/Input'
import { Menu } from '../../components/Menu'
import { TreeItem } from '../../components/TreeItem'
import { Textarea } from '../../components/Textarea'
import { gitStore } from '../../store/gitStore'
import { useGit } from '../../store/useGit'
import { useActiveDocument } from '../../store/useActiveFile'
import { workspaceStore } from '../../store/workspaceStore'
import type { GitFileStatus, GitStatusCode } from '../../../../shared/git'

/*
  SourceControlPanel (P2) — the Source Control tab of the right rail. A projection of gitStore
  (Rule 6): current branch + a switcher, a commit box, staged/unstaged file groups with hover
  stage/unstage/discard, and a collapsible history. Selecting a file opens its diff in the centre
  Document surface (setActiveDiff). Row-open and the per-row actions are separate affordances: the
  action buttons are an overlay sibling of the row, so clicking them never triggers row-open.
*/

/** Map a porcelain status letter to a Badge tone + the glyph to show. */
function codeMeta(code: GitStatusCode): { letter: string; tone: BadgeProps['tone'] } {
  switch (code) {
    case 'A':
      return { letter: 'A', tone: 'added' }
    case '?':
      return { letter: 'U', tone: 'added' }
    case 'D':
      return { letter: 'D', tone: 'removed' }
    case 'M':
      return { letter: 'M', tone: 'modified' }
    case 'T':
      return { letter: 'T', tone: 'modified' }
    case 'R':
      return { letter: 'R', tone: 'renamed' }
    case 'C':
      return { letter: 'C', tone: 'renamed' }
    default:
      return { letter: code.trim() || '•', tone: 'neutral' }
  }
}

function splitPath(p: string): { name: string; dir: string } {
  const i = p.lastIndexOf('/')
  return i === -1 ? { name: p, dir: '' } : { name: p.slice(i + 1), dir: p.slice(0, i + 1) }
}

function FileRow({
  file,
  side,
  selected,
  onDiscard,
}: {
  file: GitFileStatus
  side: 'staged' | 'unstaged'
  selected: boolean
  onDiscard: (path: string) => void
}) {
  const code = side === 'staged' ? file.index : file.worktree
  const { letter, tone } = codeMeta(code)
  const { name, dir } = splitPath(file.path)
  return (
    <div className="group relative">
      <TreeItem selected={selected} onActivate={() => workspaceStore.setActiveDiff(file.path)}>
        <Badge tone={tone} title={file.path}>
          {letter}
        </Badge>
        <span className="truncate pr-14">
          <span className="text-fg">{name}</span>
          {dir && <span className="text-muted"> {dir}</span>}
        </span>
      </TreeItem>
      <div className="absolute right-1 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex group-focus-within:flex">
        {side === 'staged' ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Unstage ${file.path}`}
            onClick={() => gitStore.unstage([file.path])}
          >
            −
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Stage ${file.path}`}
              onClick={() => gitStore.stage([file.path])}
            >
              +
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Discard ${file.path}`}
              onClick={() => onDiscard(file.path)}
            >
              ⨯
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function Group({
  title,
  files,
  side,
  bulkLabel,
  onBulk,
  activePath,
  onDiscard,
}: {
  title: string
  files: GitFileStatus[]
  side: 'staged' | 'unstaged'
  bulkLabel: string
  onBulk: () => void
  activePath: string | null
  onDiscard: (path: string) => void
}) {
  if (files.length === 0) return null
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-2 text-xs font-medium uppercase tracking-wide text-muted">
        <span>
          {title} <span className="text-muted/70">{files.length}</span>
        </span>
        <Button variant="ghost" size="sm" aria-label={bulkLabel} onClick={onBulk}>
          {side === 'staged' ? '−' : '+'}
        </Button>
      </div>
      {files.map((file) => (
        <FileRow
          key={file.path}
          file={file}
          side={side}
          selected={activePath === file.path}
          onDiscard={onDiscard}
        />
      ))}
    </div>
  )
}

export function SourceControlPanel() {
  const { isRepo, status, branches, log, error } = useGit()
  const activeDoc = useActiveDocument()
  const activePath = activeDoc?.kind === 'diff' ? activeDoc.path : null

  const [message, setMessage] = useState('')
  const [creatingBranch, setCreatingBranch] = useState(false)
  const [newBranch, setNewBranch] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    gitStore.refresh()
  }, [])

  if (isRepo === false) {
    return (
      <div className="flex h-full items-center justify-center p-3 text-center text-muted">
        <p className="text-sm">Not a git repository.</p>
      </div>
    )
  }
  if (isRepo === null || status === null) {
    return <div className="p-3 text-sm text-muted">Loading…</div>
  }

  const staged = status.files.filter((f) => f.index !== ' ' && f.index !== '?')
  const unstaged = status.files.filter((f) => f.worktree !== ' ')
  const clean = staged.length === 0 && unstaged.length === 0
  const canCommit = staged.length > 0 && message.trim().length > 0

  const branchLabel = status.branch ?? (status.detached ? 'detached HEAD' : '(no branch)')

  const submitBranch = (): void => {
    const name = newBranch.trim()
    if (name) gitStore.createBranch(name)
    setNewBranch('')
    setCreatingBranch(false)
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Branch header / switcher + manual refresh */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {creatingBranch ? (
            <Input
              autoFocus
              value={newBranch}
              placeholder="new-branch-name"
              onChange={(e) => setNewBranch(e.target.value)}
              onSubmit={submitBranch}
              onKeyDown={(e) => e.key === 'Escape' && setCreatingBranch(false)}
            />
          ) : (
            <Menu
              trigger={
                <Button variant="ghost" size="sm">
                  ⎇ {branchLabel} ⌄
                </Button>
              }
              items={branches.map((b) => ({
                label: b.name,
                selected: b.current,
                onSelect: () => gitStore.checkout(b.name),
              }))}
              footerItem={{ label: '+ New branch…', onSelect: () => setCreatingBranch(true) }}
            />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Refresh status"
          onClick={() => gitStore.refresh()}
        >
          ↻
        </Button>
      </div>

      {/* Commit box */}
      <div className="flex flex-col gap-2">
        <Textarea
          rows={2}
          value={message}
          placeholder="Commit message…"
          onChange={(e) => setMessage(e.target.value)}
          onSubmit={() => {
            if (canCommit) {
              gitStore.commit(message)
              setMessage('')
            }
          }}
        />
        <Button
          variant="primary"
          size="sm"
          disabled={!canCommit}
          onClick={() => {
            gitStore.commit(message)
            setMessage('')
          }}
        >
          Commit{staged.length > 0 ? ` ✓${staged.length}` : ''}
        </Button>
      </div>

      {error && <p className="text-xs text-removed">{error}</p>}

      {/* File groups */}
      {clean ? (
        <p className="px-2 text-sm text-muted">No changes.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <Group
            title="Staged"
            files={staged}
            side="staged"
            bulkLabel="Unstage all"
            onBulk={() => gitStore.unstage(staged.map((f) => f.path))}
            activePath={activePath}
            onDiscard={setConfirmDiscard}
          />
          <Group
            title="Changes"
            files={unstaged}
            side="unstaged"
            bulkLabel="Stage all"
            onBulk={() => gitStore.stage(unstaged.map((f) => f.path))}
            activePath={activePath}
            onDiscard={setConfirmDiscard}
          />
        </div>
      )}

      {/* History */}
      <div className="mt-auto flex flex-col gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={showHistory}
          onClick={() => setShowHistory((v) => !v)}
        >
          {showHistory ? '▾' : '▸'} History
        </Button>
        {showHistory &&
          (log.length === 0 ? (
            <p className="px-2 text-xs text-muted">No commits yet.</p>
          ) : (
            log.map((c) => (
              <div key={c.sha} className="flex items-baseline gap-2 px-2 py-0.5 text-xs">
                <span className="shrink-0 font-mono text-muted">{c.shortSha}</span>
                <span className="truncate text-fg">{c.subject}</span>
              </div>
            ))
          ))}
      </div>

      <Dialog
        open={confirmDiscard !== null}
        onOpenChange={(open) => !open && setConfirmDiscard(null)}
        title="Discard changes?"
        description={confirmDiscard ? `${confirmDiscard} will be reverted to HEAD.` : undefined}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirmDiscard(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (confirmDiscard) gitStore.discard([confirmDiscard])
              setConfirmDiscard(null)
            }}
          >
            Discard
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
