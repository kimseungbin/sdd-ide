import { useCallback, useRef, type KeyboardEvent } from 'react'

/*
  useTreeKeyboard (BL-036/BL-038) — the ARIA-tree keyboard behavior, extracted so every tree
  surface (directory, spec, …) shares one implementation instead of copy-pasting it (Rule 1).

  The panel owns the data + expand/focus STATE and passes a flattened row model; this hook owns
  roving tabindex + arrow-key navigation: one Tab stop for the whole tree, ↑↓ move, → open/
  descend, ← close/ascend, Home/End. Activation (Enter/Space/click) stays on TreeItem.
*/
export interface TreeRow {
  id: string
  isExpandable: boolean
  /** Directories/branches only: whether currently open. */
  open: boolean
  parentId: string | null
}

interface Params {
  rows: TreeRow[]
  focusedId: string | null
  setFocusedId: (id: string) => void
  expand: (id: string) => void
  collapse: (id: string) => void
}

export interface TreeKeyboard {
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  registerRow: (id: string, el: HTMLDivElement | null) => void
  tabIndexFor: (id: string) => number
}

export function useTreeKeyboard({ rows, focusedId, setFocusedId, expand, collapse }: Params): TreeKeyboard {
  const refs = useRef(new Map<string, HTMLDivElement>())

  const registerRow = useCallback((id: string, el: HTMLDivElement | null): void => {
    if (el) refs.current.set(id, el)
    else refs.current.delete(id)
  }, [])

  const moveFocus = useCallback(
    (id: string): void => {
      setFocusedId(id)
      refs.current.get(id)?.focus()
    },
    [setFocusedId],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>): void => {
      if (focusedId === null) return
      const index = rows.findIndex((row) => row.id === focusedId)
      if (index === -1) return
      const row = rows[index]

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          if (index < rows.length - 1) moveFocus(rows[index + 1].id)
          break
        case 'ArrowUp':
          event.preventDefault()
          if (index > 0) moveFocus(rows[index - 1].id)
          break
        case 'Home':
          event.preventDefault()
          if (rows.length > 0) moveFocus(rows[0].id)
          break
        case 'End':
          event.preventDefault()
          if (rows.length > 0) moveFocus(rows[rows.length - 1].id)
          break
        case 'ArrowRight':
          event.preventDefault()
          if (!row.isExpandable) break
          if (!row.open) expand(row.id)
          else if (index < rows.length - 1 && rows[index + 1].parentId === row.id) moveFocus(rows[index + 1].id)
          break
        case 'ArrowLeft':
          event.preventDefault()
          if (row.isExpandable && row.open) collapse(row.id)
          else if (row.parentId) moveFocus(row.parentId)
          break
        default:
          break
      }
    },
    [focusedId, rows, moveFocus, expand, collapse],
  )

  const tabIndexFor = useCallback((id: string): number => (id === focusedId ? 0 : -1), [focusedId])

  return { onKeyDown, registerRow, tabIndexFor }
}
