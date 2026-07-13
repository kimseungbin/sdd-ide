import * as RadixMenu from '@radix-ui/react-dropdown-menu'
import type { ReactNode } from 'react'

/*
  Menu — a dropdown/popover menu built on the Radix DropdownMenu headless primitive (keyboard nav,
  focus management, typeahead, ARIA) with our own closed-API presentation (CLAUDE.md Rule 1/2).

  - Rule 2: no className/style passthrough — appearance is fixed here; callers pass a `trigger`
    element and a typed `items` list (content + behaviour, not styling).
  - Rule 4: surface/border/text/selection from tokens (bg-surface, border-border, text-fg…).

  First used by the branch switcher; general enough for future context menus. A `selected` item
  shows a leading check; `footerItem` renders under a separator (e.g. "New branch…").
*/
export interface MenuItem {
  label: string
  onSelect: () => void
  /** Shows a leading check and marks the item current (e.g. the active branch). */
  selected?: boolean
}

export interface MenuProps {
  /** The element that opens the menu (e.g. a Button). Must be a single focusable node. */
  trigger: ReactNode
  items: MenuItem[]
  /** Optional action under a separator at the bottom (e.g. "New branch…"). */
  footerItem?: MenuItem
  /** Menu edge aligned to the trigger. Defaults to start. */
  align?: 'start' | 'end'
}

const itemClass =
  'flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-sm text-fg outline-none data-[highlighted]:bg-brand/10 data-[highlighted]:text-brand'

function Row({ item }: { item: MenuItem }) {
  return (
    <RadixMenu.Item className={itemClass} onSelect={item.onSelect}>
      <span className="w-3 shrink-0 text-brand">{item.selected ? '✓' : ''}</span>
      <span className="truncate">{item.label}</span>
    </RadixMenu.Item>
  )
}

export function Menu({ trigger, items, footerItem, align = 'start' }: MenuProps) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align={align}
          sideOffset={4}
          className="z-50 flex min-w-40 flex-col gap-0.5 rounded-md border border-border bg-surface p-1 shadow-lg focus:outline-none"
        >
          {items.map((item) => (
            <Row key={item.label} item={item} />
          ))}
          {footerItem && (
            <>
              <RadixMenu.Separator className="my-1 h-px bg-border" />
              <Row item={footerItem} />
            </>
          )}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  )
}
