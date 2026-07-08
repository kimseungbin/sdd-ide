import { useCallback, useEffect, useMemo, useState } from 'react'
import { TreeItem, useTreeKeyboard, type TreeRow } from '../../components/TreeItem'
import { useActiveFile } from '../../store/useActiveFile'
import { workspaceStore } from '../../store/workspaceStore'
import type { DirEntry } from '../../../../shared/ipc'

/*
  DirectoryPanel (BL-036) — a read-only project file tree over the workspace root. Listing runs
  in the main process (the renderer is sandboxed); this pane only reads. Selecting a file sets
  shared active-file state that the editor pane (BL-037) projects.

  ARIA tree (role="tree"/"treeitem"), not buttons. Keyboard nav is the shared useTreeKeyboard
  hook (also used by the spec tree); this panel owns the data + expand/focus state and renders
  rows flattened (indent by depth) so nav order matches DOM order. Subdirectories lazy-load.
*/
interface VisibleRow {
  entry: DirEntry
  depth: number
  parentPath: string | null
  open: boolean
  posInSet: number
  setSize: number
}

function buildRows(
  roots: DirEntry[] | null,
  expanded: ReadonlySet<string>,
  childrenByPath: Readonly<Record<string, DirEntry[]>>,
): VisibleRow[] {
  const rows: VisibleRow[] = []
  const walk = (entries: DirEntry[], depth: number, parentPath: string | null): void => {
    entries.forEach((entry, index) => {
      const open = entry.isDirectory && expanded.has(entry.path)
      rows.push({ entry, depth, parentPath, open, posInSet: index + 1, setSize: entries.length })
      if (open) {
        const kids = childrenByPath[entry.path]
        if (kids) walk(kids, depth + 1, entry.path)
      }
    })
  }
  walk(roots ?? [], 0, null)
  return rows
}

export function DirectoryPanel() {
  const activeFile = useActiveFile()
  const [roots, setRoots] = useState<DirEntry[] | null>(null)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const [childrenByPath, setChildrenByPath] = useState<Record<string, DirEntry[]>>({})
  const [focusedPath, setFocusedPath] = useState<string | null>(null)

  const rows = useMemo(
    () => buildRows(roots, expanded, childrenByPath),
    [roots, expanded, childrenByPath],
  )

  const loadChildren = useCallback((path: string): void => {
    window.sddIde.fs
      .readDir(path)
      .then((kids) => setChildrenByPath((prev) => ({ ...prev, [path]: kids })))
      .catch(() => setChildrenByPath((prev) => ({ ...prev, [path]: [] })))
  }, [])

  const expand = useCallback(
    (path: string): void => {
      setExpanded((prev) => {
        if (prev.has(path)) return prev
        const next = new Set(prev)
        next.add(path)
        return next
      })
      if (childrenByPath[path] === undefined) loadChildren(path)
    },
    [childrenByPath, loadChildren],
  )

  const collapse = useCallback((path: string): void => {
    setExpanded((prev) => {
      if (!prev.has(path)) return prev
      const next = new Set(prev)
      next.delete(path)
      return next
    })
  }, [])

  const treeRows: TreeRow[] = useMemo(
    () =>
      rows.map((row) => ({
        id: row.entry.path,
        isExpandable: row.entry.isDirectory,
        open: row.open,
        parentId: row.parentPath,
      })),
    [rows],
  )
  const { onKeyDown, registerRow, tabIndexFor } = useTreeKeyboard({
    rows: treeRows,
    focusedId: focusedPath,
    setFocusedId: setFocusedPath,
    expand,
    collapse,
  })

  // Load the workspace root's entries once.
  useEffect(() => {
    let cancelled = false
    window.sddIde.workspace
      .root()
      .then((root) => window.sddIde.fs.readDir(root))
      .then((entries) => {
        if (cancelled) return
        setRoots(entries)
        if (entries.length > 0) setFocusedPath(entries[0].path)
      })
      .catch(() => {
        if (!cancelled) setRoots([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const activate = (row: VisibleRow): void => {
    setFocusedPath(row.entry.path)
    if (row.entry.isDirectory) {
      if (expanded.has(row.entry.path)) collapse(row.entry.path)
      else expand(row.entry.path)
    } else {
      workspaceStore.setActiveFile(row.entry.path)
    }
  }

  if (roots === null) return <p className="text-sm text-muted">Loading…</p>
  if (roots.length === 0) return <p className="text-sm text-muted">Empty project.</p>

  return (
    <div
      role="tree"
      aria-label="Project files"
      className="flex flex-col gap-0.5"
      onKeyDown={onKeyDown}
    >
      {rows.map((row) => (
        <TreeItem
          key={row.entry.path}
          ref={(el) => registerRow(row.entry.path, el)}
          tabIndex={tabIndexFor(row.entry.path)}
          selected={row.entry.isDirectory ? undefined : activeFile === row.entry.path}
          expanded={row.entry.isDirectory ? row.open : undefined}
          level={row.depth + 1}
          posInSet={row.posInSet}
          setSize={row.setSize}
          onActivate={() => activate(row)}
        >
          {Array.from({ length: row.depth }, (_, depthIndex) => (
            <span key={depthIndex} aria-hidden className="w-3 shrink-0" />
          ))}
          {row.entry.isDirectory ? (
            <span aria-hidden className="w-3 shrink-0 text-muted">
              {row.open ? '▾' : '▸'}
            </span>
          ) : (
            <span aria-hidden className="w-3 shrink-0" />
          )}
          <span>{row.entry.name}</span>
        </TreeItem>
      ))}
    </div>
  )
}
