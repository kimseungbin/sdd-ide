import { useActiveDocument } from '../../store/useActiveFile'
import { FileDocument } from './FileDocument'
import { SpecDocument } from './SpecDocument'

/*
  DocumentPanel (BL-030) — the unified document surface. Shows whichever document is open: a file
  (→ code editor) or the spec (→ spec editor). Derives entirely from the workspace store (Rule 6);
  the directory + spec trees are its two navigators. Replaces the old file-only editor pane — the
  spec is a first-class document here, not a separate app mode.
*/
export function DocumentPanel() {
  const doc = useActiveDocument()

  if (doc === null) {
    return (
      <div className="flex h-full items-center justify-center p-3 text-center text-muted">
        <p className="text-sm">
          Select a file or a spec node.
          <br />
          <span className="text-xs">Files open read-first; the spec opens as an editable doc</span>
        </p>
      </div>
    )
  }

  return doc.kind === 'file' ? <FileDocument path={doc.path} /> : <SpecDocument />
}
