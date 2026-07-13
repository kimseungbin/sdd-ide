import { cva, type VariantProps } from 'class-variance-authority'
import { useId, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/*
  Panel — a titled container region; the building block of the workspace shell (BL-035).
  Follows the CLAUDE.md UI rules like Button:

  - Rule 2: appearance flows only through the closed `padding` variant; no className/style.
  - Rule 4: colours/space/radius come from tokens (border-border, bg-surface, text-muted…).
  - Rule 5: renders an accessible labelled region (role="region" + aria-labelledby).

  `actions` adds optional header-right controls (e.g. a rail section's collapse/swap buttons);
  `collapsed` renders header-only (the body is hidden) for a collapsed rail section.
*/
const content = cva('min-h-0 flex-1 overflow-auto text-sm text-fg', {
  variants: {
    // Full-bleed panes (e.g. a code editor) opt out of inner padding.
    padding: {
      none: '',
      normal: 'p-3',
    },
  },
  defaultVariants: { padding: 'normal' },
})

/*
  The panel's outer shell material. `solid` is the default (content panes, e.g. the
  document editor — the content layer stays opaque). `glass` is for the navigation
  layer that floats above content — the right-rail navigators — mirroring Apple's
  Liquid Glass rule. Both select the shared `.material-*` classes from theme.css
  (the single material vocabulary, also used by Surface); never glass-on-glass.
*/
const shell = cva('flex h-full min-h-0 flex-col overflow-hidden rounded-md', {
  variants: {
    material: {
      solid: 'material-solid',
      glass: 'material-glass',
    },
  },
  defaultVariants: { material: 'solid' },
})

// Public prop vocabulary (Rule 7). No className/style — styling is the closed variant set.
export interface PanelProps extends VariantProps<typeof content>, VariantProps<typeof shell> {
  /** Header label; also names the region for assistive tech (Rule 5). */
  title: string
  children?: ReactNode
  /** Optional header-right controls (content, not styling). */
  actions?: ReactNode
  /** Header-only when true — the body is hidden (a collapsed rail section). */
  collapsed?: boolean
}

export function Panel({
  title,
  padding,
  material,
  children,
  actions,
  collapsed = false,
}: PanelProps) {
  const headingId = useId()
  return (
    <section role="region" aria-labelledby={headingId} className={cn(shell({ material }))}>
      <header
        id={headingId}
        className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted"
      >
        <span className="truncate">{title}</span>
        {actions && <span className="flex shrink-0 items-center gap-0.5">{actions}</span>}
      </header>
      {!collapsed && <div className={cn(content({ padding }))}>{children}</div>}
    </section>
  )
}
