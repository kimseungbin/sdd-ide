import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/*
  Badge — a small status/label chip (git file status letters, sem change types). Follows the
  CLAUDE.md UI rules like Button/Panel:

  - Rule 2: appearance flows only through the closed `tone`/`size` props; no className/style.
  - Rule 4: colours come from the diff-state tokens (text-added, bg-modified/15…), never raw values.

  `tone` is the semantic colour; the visible letter/word is passed as children (content, not styling)
  so the same chip renders `M` in a status list or `Modified` in a diff header.
*/
const badge = cva(
  'inline-flex items-center justify-center rounded font-medium leading-none whitespace-nowrap',
  {
    variants: {
      tone: {
        added: 'bg-added/15 text-added',
        removed: 'bg-removed/15 text-removed',
        modified: 'bg-modified/15 text-modified',
        renamed: 'bg-renamed/15 text-renamed',
        neutral: 'bg-fg/10 text-muted',
      },
      size: {
        sm: 'h-4 min-w-4 px-1 text-xs',
        md: 'h-5 min-w-5 px-1.5 text-sm',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'sm' },
  },
)

// Public prop vocabulary (Rule 7): the closed tone/size set is the only styling knob.
export interface BadgeProps extends VariantProps<typeof badge> {
  children: ReactNode
  /** Accessible label when the visible glyph is terse (e.g. title="Modified" on an `M`). */
  title?: string
}

export function Badge({ tone, size, children, title }: BadgeProps) {
  return (
    <span className={cn(badge({ tone, size }))} title={title}>
      {children}
    </span>
  )
}
