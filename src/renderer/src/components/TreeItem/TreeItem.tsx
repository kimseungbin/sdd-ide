import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/*
  TreeItem (BL-036) — a presentational row for tree/list surfaces. It is a styled `div`
  carrying ARIA tree semantics (role="treeitem"), NOT a <button> — so it needs no styling
  escape hatch and no change to Rule 3's single <button> home, and it gives correct tree
  a11y instead of a pile of buttons.

  - Rule 2: appearance flows only through the closed `selected` variant; no className/style.
  - Rule 4: colors/space/radius come from tokens (text-fg, bg-brand, ring-ring, rounded-md…).
  - Rule 5: focusable and activatable on Enter/Space or click. The containing role="tree"
    owns cross-row navigation (roving tabindex + arrow keys) and passes `tabIndex` per row.
*/
const treeItem = cva(
  'flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm text-fg transition-colors hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  {
    variants: {
      selected: {
        true: 'bg-brand/10 text-brand',
        false: '',
      },
    },
    defaultVariants: { selected: false },
  },
)

export interface TreeItemProps extends VariantProps<typeof treeItem> {
  /** Row content — typically leading indent/glyph spacers + the label. */
  children: ReactNode
  /** Called on click or Enter/Space. */
  onActivate?: () => void
  /** Folders: drives aria-expanded. Omit on leaf rows. */
  expanded?: boolean
  /** Roving tabindex: 0 for the focused row, -1 for the rest. Defaults to 0 (standalone use). */
  tabIndex?: number
  /** ARIA tree position, for a flattened tree. */
  level?: number
  posInSet?: number
  setSize?: number
}

export const TreeItem = forwardRef<HTMLDivElement, TreeItemProps>(function TreeItem(
  { selected, expanded, onActivate, tabIndex = 0, level, posInSet, setSize, children },
  ref,
) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onActivate?.()
    }
  }
  return (
    <div
      ref={ref}
      role="treeitem"
      tabIndex={tabIndex}
      aria-selected={selected ?? undefined}
      aria-expanded={expanded}
      aria-level={level}
      aria-posinset={posInSet}
      aria-setsize={setSize}
      onClick={onActivate}
      onKeyDown={handleKeyDown}
      className={cn(treeItem({ selected }))}
    >
      {children}
    </div>
  )
})
