import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { NodeType } from '../../../engine'

/*
  BL-030/BL-032 — the slash (/) menu: pick a block type to insert. Rendered by the suggestion
  extension (slash-command.ts) via ReactRenderer. Keyboard nav is delegated in through the
  imperative `onKeyDown` handle so arrow/enter work while focus stays in the editor.
*/
export interface SlashItem {
  title: string
  type: NodeType
  hint: string
}

export interface SlashMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean
}

export const SlashMenu = forwardRef<
  SlashMenuHandle,
  { items: SlashItem[]; command: (item: SlashItem) => void }
>(function SlashMenu({ items, command }, ref) {
  const [selected, setSelected] = useState(0)
  useEffect(() => setSelected(0), [items])

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: (event) => {
        if (items.length === 0) return false
        if (event.key === 'ArrowDown') {
          setSelected((s) => (s + 1) % items.length)
          return true
        }
        if (event.key === 'ArrowUp') {
          setSelected((s) => (s - 1 + items.length) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          const item = items[selected]
          if (item) command(item)
          return true
        }
        return false
      },
    }),
    [items, selected, command],
  )

  if (items.length === 0) {
    return (
      <div className="w-56 rounded-md border border-border bg-surface p-2 text-xs text-muted">
        No matching block
      </div>
    )
  }

  return (
    <div
      role="menu"
      className="w-56 overflow-hidden rounded-md border border-border bg-surface py-1 text-sm"
    >
      {items.map((item, index) => (
        <div
          key={item.type}
          role="menuitem"
          tabIndex={-1}
          // mousedown (not click) so the editor selection/range survives the pick
          onMouseDown={(event) => {
            event.preventDefault()
            command(item)
          }}
          onMouseEnter={() => setSelected(index)}
          className={
            index === selected
              ? 'flex cursor-pointer items-baseline gap-2 bg-brand/15 px-3 py-1 text-fg'
              : 'flex cursor-pointer items-baseline gap-2 px-3 py-1 text-fg'
          }
        >
          <span>{item.title}</span>
          <span className="ml-auto text-xs text-muted">{item.hint}</span>
        </div>
      ))}
    </div>
  )
})
