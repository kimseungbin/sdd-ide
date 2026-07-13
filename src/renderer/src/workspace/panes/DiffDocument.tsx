import { lazy, Suspense, useEffect, useState } from 'react'
import { Badge, type BadgeProps } from '../../components/Badge'
import { TreeItem } from '../../components/TreeItem'
import { useGit } from '../../store/useGit'
import type { SemChange, SemChangeType } from '../../../../shared/sem'

// CodeMirror is heavy — reuse the code pane's split chunk for the drill-in slices.
const CodeView = lazy(() =>
  import('../../components/CodeView').then((m) => ({ default: m.CodeView })),
)

/*
  DiffDocument (P3) — the code-side entity diff for one changed file, the mirror of the spec's
  structural diff. Outline + drill-in: a summary bar over a collapsed list of changed entities
  (functions/classes/methods); expanding one reveals its before/after, straight from sem's
  beforeContent/afterContent. Cosmetic-only changes (structuralChange === false) are dimmed. Files
  sem can't parse (non-code, binary, unsupported) fall back to a plain unified line diff from git.
  One branch of the unified DocumentPanel; the path comes from the workspace store (Rule 6).
*/

const CHANGE_META: Record<SemChangeType, { letter: string; tone: BadgeProps['tone'] }> = {
  added: { letter: 'A', tone: 'added' },
  modified: { letter: 'M', tone: 'modified' },
  deleted: { letter: 'D', tone: 'removed' },
  renamed: { letter: 'R', tone: 'renamed' },
  moved: { letter: 'M', tone: 'renamed' },
  reordered: { letter: '↕', tone: 'neutral' },
}

type DiffState =
  | { mode: 'loading' }
  | { mode: 'entities'; changes: SemChange[] }
  | { mode: 'line'; text: string }
  | { mode: 'empty' }
  | { mode: 'error'; message: string }

function Slice({ label, value, filename }: { label: string; value: string; filename: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <div className="h-48 overflow-hidden rounded-md border border-border">
        <Suspense fallback={<p className="p-2 text-xs text-muted">Loading…</p>}>
          <CodeView filename={filename} value={value} editable={false} />
        </Suspense>
      </div>
    </div>
  )
}

function EntityRow({ change, filename }: { change: SemChange; filename: string }) {
  const [open, setOpen] = useState(false)
  const meta = CHANGE_META[change.changeType]
  const cosmetic = change.structuralChange === false
  return (
    <div className="flex flex-col">
      <TreeItem expanded={open} onActivate={() => setOpen((o) => !o)}>
        <span className="w-3 shrink-0 text-muted">{open ? '▾' : '▸'}</span>
        <Badge tone={meta.tone} title={change.changeType}>
          {meta.letter}
        </Badge>
        <span className="truncate">
          <span className="text-muted">{change.entityType} </span>
          <span className={cosmetic ? 'text-muted' : 'text-fg'}>{change.entityName}</span>
          {cosmetic && <span className="text-muted"> · cosmetic</span>}
        </span>
      </TreeItem>
      {open && (
        <div className="flex flex-col gap-2 py-2 pl-6">
          {change.beforeContent != null && (
            <Slice label="Before" value={change.beforeContent} filename={filename} />
          )}
          {change.afterContent != null && (
            <Slice label="After" value={change.afterContent} filename={filename} />
          )}
          {change.beforeContent == null && change.afterContent == null && (
            <p className="text-xs text-muted">No content for this change.</p>
          )}
        </div>
      )}
    </div>
  )
}

/** Plain unified line diff, coloured by +/- prefix — the fallback for files sem can't parse. */
function LineDiff({ text }: { text: string }) {
  return (
    <div className="overflow-auto font-mono text-xs leading-relaxed">
      {text.split('\n').map((line, i) => {
        const tone =
          line.startsWith('+') && !line.startsWith('+++')
            ? 'text-added'
            : line.startsWith('-') && !line.startsWith('---')
              ? 'text-removed'
              : line.startsWith('@@')
                ? 'text-renamed'
                : 'text-muted'
        return (
          <div key={i} className={tone}>
            {line || ' '}
          </div>
        )
      })}
    </div>
  )
}

export function DiffDocument({ path }: { path: string }) {
  const [state, setState] = useState<DiffState>({ mode: 'loading' })
  const filename = path.split('/').pop() ?? path
  // Re-fetch when git state changes (stage/commit/checkout, window-focus refresh) so the open diff
  // stays live — e.g. it flips to "No changes" once the file is committed. First fetch is on mount.
  const { rev } = useGit()

  // Show the loading state only when the *file* changes — a background rev refresh updates in place.
  useEffect(() => {
    setState({ mode: 'loading' })
  }, [path])

  useEffect(() => {
    let cancelled = false
    window.sddIde.sem
      .diff()
      .then(async (diff) => {
        if (cancelled) return
        const changes = diff.changes.filter((c) => c.filePath === path)
        if (changes.length > 0) {
          setState({ mode: 'entities', changes })
          return
        }
        // sem produced no entities for this file — fall back to a plain line diff.
        const text = await window.sddIde.git.diff(path)
        if (cancelled) return
        setState(text.trim() ? { mode: 'line', text } : { mode: 'empty' })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ mode: 'error', message: err instanceof Error ? err.message : String(err) })
        }
      })
    return () => {
      cancelled = true
    }
  }, [path, rev])

  const counts =
    state.mode === 'entities'
      ? state.changes.reduce(
          (acc, c) => {
            if (c.changeType === 'added') acc.added++
            else if (c.changeType === 'deleted') acc.deleted++
            else if (c.changeType === 'renamed' || c.changeType === 'moved') acc.renamed++
            else acc.modified++
            return acc
          },
          { added: 0, modified: 0, deleted: 0, renamed: 0 },
        )
      : null

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-1 text-xs">
        <span className="text-muted">{filename}</span>
        {counts && (
          <span className="flex gap-2">
            {counts.added > 0 && <span className="text-added">+{counts.added}</span>}
            {counts.modified > 0 && <span className="text-modified">~{counts.modified}</span>}
            {counts.deleted > 0 && <span className="text-removed">−{counts.deleted}</span>}
            {counts.renamed > 0 && <span className="text-renamed">⟳{counts.renamed}</span>}
          </span>
        )}
        {state.mode === 'line' && <span className="text-muted">line diff</span>}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {state.mode === 'loading' && <p className="text-sm text-muted">Computing diff…</p>}
        {state.mode === 'error' && <p className="text-sm text-removed">{state.message}</p>}
        {state.mode === 'empty' && <p className="text-sm text-muted">No changes in this file.</p>}
        {state.mode === 'line' && <LineDiff text={state.text} />}
        {state.mode === 'entities' && (
          <div className="flex flex-col gap-0.5">
            {state.changes.map((c) => (
              <EntityRow key={c.entityId} change={c} filename={filename} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
