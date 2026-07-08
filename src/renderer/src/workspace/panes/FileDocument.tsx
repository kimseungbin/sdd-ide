import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { CodeView } from '../../components/CodeView'

/*
  FileDocument (BL-037, DD-10) — a read-first code editor for the open file. Reading/verifying
  what the agent produced is the primary use (D20); editing is an escape hatch behind an explicit
  "Edit" toggle, saved via the fs IPC. Highlighting + editing come from the CodeView primitive
  (CodeMirror 6). One branch of the unified document pane (DocumentPanel); the path is supplied by
  the workspace store (Rule 6).
*/
export function FileDocument({ path }: { path: string }) {
  const [content, setContent] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  // Bumped to remount CodeView (reset the buffer) on load / save / cancel.
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let cancelled = false
    setContent(null)
    setFailed(false)
    setEditing(false)
    window.sddIde.fs
      .readFile(path)
      .then((text) => {
        if (cancelled) return
        setContent(text)
        setDraft(text)
        setRevision((r) => r + 1)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [path])

  const name = path.split('/').pop() ?? path
  const dirty = editing && draft !== content

  const save = async (): Promise<void> => {
    setSaving(true)
    try {
      await window.sddIde.fs.writeFile(path, draft)
      setContent(draft)
      setEditing(false)
      setRevision((r) => r + 1)
    } finally {
      setSaving(false)
    }
  }

  const cancel = (): void => {
    setDraft(content ?? '')
    setEditing(false)
    setRevision((r) => r + 1)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-1">
        <span className="text-xs text-muted">
          {name}
          {dirty ? ' •' : ''}
        </span>
        <div className="flex gap-1">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={cancel} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => void save()} disabled={saving || !dirty}>
                Save
              </Button>
            </>
          ) : (
            content !== null && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )
          )}
        </div>
      </div>

      {failed ? (
        <p className="p-3 text-sm text-muted">Cannot read this file.</p>
      ) : content === null ? (
        <p className="p-3 text-sm text-muted">Loading…</p>
      ) : (
        <div className="min-h-0 flex-1">
          <CodeView
            key={`${path}#${revision}`}
            filename={name}
            value={content}
            editable={editing}
            onChange={setDraft}
            onSave={() => void save()}
          />
        </div>
      )}
    </div>
  )
}
