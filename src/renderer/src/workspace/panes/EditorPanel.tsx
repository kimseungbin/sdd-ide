import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { CodeView } from '../../components/CodeView'
import { useActiveFile } from '../../store/useActiveFile'

/*
  EditorPanel (BL-037, DD-10) — a read-first code editor. Reading/verifying what the agent
  produced is the primary use (D20); editing is an escape hatch behind an explicit "Edit"
  toggle, saved via the fs IPC. Highlighting + editing come from the CodeView primitive
  (CodeMirror 6, JetBrains/Darcula). Derives its file from workspaceStore (Rule 6).
*/
export function EditorPanel() {
  const activeFile = useActiveFile()
  const [content, setContent] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  // Bumped to remount CodeView (reset the buffer) on load / save / cancel.
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (activeFile === null) return
    let cancelled = false
    setContent(null)
    setFailed(false)
    setEditing(false)
    window.sddIde.fs
      .readFile(activeFile)
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
  }, [activeFile])

  if (activeFile === null) {
    return (
      <div className="flex h-full items-center justify-center p-3 text-center text-muted">
        <p className="text-sm">
          Select a file to read.
          <br />
          <span className="text-xs">Read-first; manual edit is an escape hatch (D20)</span>
        </p>
      </div>
    )
  }

  const name = activeFile.split('/').pop() ?? activeFile
  const dirty = editing && draft !== content

  const save = async (): Promise<void> => {
    setSaving(true)
    try {
      await window.sddIde.fs.writeFile(activeFile, draft)
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
            key={`${activeFile}#${revision}`}
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
