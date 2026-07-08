import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TreeItem, useTreeKeyboard, type TreeRow } from '../../components/TreeItem'
import { useSpecTree } from '../../store/useSpecTree'
import { useActiveDocument } from '../../store/useActiveFile'
import { workspaceStore } from '../../store/workspaceStore'
import type { Node, NodeId, TaskStatus } from '../../../../engine'

/*
  SpecPanel (BL-038, BL-030) — the spec outline/navigator. Projects the spec forest (from the
  main-process SQLite store, D30) as a drill-down tree, reusing the containment tree pattern
  (TreeItem + useTreeKeyboard). Derives entirely from the store (Rule 6). It is a *summary*:
  activating a node opens the spec as a document in the unified document pane (the way the
  directory tree opens a file), where it can be read/edited.

  Scope is still the whole forest — narrowing to the relevant scoped slice (DD-9) waits on the
  scoped-context builder (BL-040).
*/
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'todo',
  'in-progress': 'in progress',
  done: 'done',
}

interface SpecRow {
  node: Node
  depth: number
  parentId: NodeId | null
  open: boolean
  expandable: boolean
  posInSet: number
  setSize: number
}

function buildRows(
  rootIds: NodeId[],
  byId: Map<NodeId, Node>,
  expanded: ReadonlySet<string>,
): SpecRow[] {
  const rows: SpecRow[] = []
  const walk = (ids: NodeId[], depth: number, parentId: NodeId | null): void => {
    ids.forEach((id, index) => {
      const node = byId.get(id)
      if (!node) return
      const expandable = node.children.length > 0
      const open = expandable && expanded.has(id)
      rows.push({
        node,
        depth,
        parentId,
        open,
        expandable,
        posInSet: index + 1,
        setSize: ids.length,
      })
      if (open) walk(node.children, depth + 1, id)
    })
  }
  walk(rootIds, 0, null)
  return rows
}

export function SpecPanel() {
  const snapshot = useSpecTree()
  const activeDoc = useActiveDocument()
  const rootIds = useMemo(() => snapshot?.rootIds ?? [], [snapshot])
  const byId = useMemo(
    () => new Map((snapshot?.nodes ?? []).map((node) => [node.id, node])),
    [snapshot],
  )

  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const [focusedId, setFocusedId] = useState<NodeId | null>(null)
  const initialized = useRef(false)

  // Expand the roots + focus the first row once, when the snapshot first arrives.
  useEffect(() => {
    if (!initialized.current && rootIds.length > 0) {
      initialized.current = true
      setExpanded(new Set(rootIds))
      setFocusedId(rootIds[0])
    }
  }, [rootIds])

  const rows = useMemo(() => buildRows(rootIds, byId, expanded), [rootIds, byId, expanded])

  const expand = useCallback((id: string): void => {
    setExpanded((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const collapse = useCallback((id: string): void => {
    setExpanded((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const treeRows: TreeRow[] = useMemo(
    () =>
      rows.map((row) => ({
        id: row.node.id,
        isExpandable: row.expandable,
        open: row.open,
        parentId: row.parentId,
      })),
    [rows],
  )
  const { onKeyDown, registerRow, tabIndexFor } = useTreeKeyboard({
    rows: treeRows,
    focusedId,
    setFocusedId,
    expand,
    collapse,
  })

  if (snapshot === null) return <p className="text-sm text-muted">Loading…</p>
  if (rootIds.length === 0) return <p className="text-sm text-muted">No spec loaded.</p>

  return (
    <div role="tree" aria-label="Spec" className="flex flex-col gap-0.5" onKeyDown={onKeyDown}>
      {rows.map((row) => (
        <TreeItem
          key={row.node.id}
          ref={(el) => registerRow(row.node.id, el)}
          tabIndex={tabIndexFor(row.node.id)}
          selected={activeDoc?.kind === 'spec' && activeDoc.nodeId === row.node.id}
          expanded={row.expandable ? row.open : undefined}
          level={row.depth + 1}
          posInSet={row.posInSet}
          setSize={row.setSize}
          onActivate={() => {
            setFocusedId(row.node.id)
            workspaceStore.setActiveSpec(row.node.id)
            if (row.expandable) {
              if (row.open) collapse(row.node.id)
              else expand(row.node.id)
            }
          }}
        >
          {Array.from({ length: row.depth }, (_, depthIndex) => (
            <span key={depthIndex} aria-hidden className="w-3 shrink-0" />
          ))}
          {row.expandable ? (
            <span aria-hidden className="w-3 shrink-0 text-muted">
              {row.open ? '▾' : '▸'}
            </span>
          ) : (
            <span aria-hidden className="w-3 shrink-0" />
          )}
          <span
            className={
              row.node.type === 'task' && row.node.status === 'done'
                ? 'text-muted line-through'
                : undefined
            }
          >
            {row.node.title || '(untitled)'}
          </span>
          {row.node.type === 'task' && (
            <span className="ml-auto shrink-0 text-xs uppercase tracking-wide text-muted">
              {STATUS_LABEL[row.node.status]}
            </span>
          )}
        </TreeItem>
      ))}
    </div>
  )
}
