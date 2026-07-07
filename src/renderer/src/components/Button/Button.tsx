import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/*
  Reference component for the UI rules (CLAUDE.md).

  - Rule 1: general + expandable — grow by adding named variants below, never by
    letting callers pass raw styles.
  - Rule 2: closed styling API — appearance is set ONLY through the `variant`/`size`
    props. `className` and `style` are intentionally omitted from the public props
    (type-level enforcement of "no escape hatch"). Tailwind classes stay internal
    to this file.
  - Rule 3: this is the ONLY place a raw <button> element may be used; everywhere
    else must import <Button>.
  - Rule 4: styles reference design tokens (bg-brand, rounded-md…), never raw values.
*/
const button = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-fg hover:opacity-90',
        ghost: 'bg-transparent text-brand hover:bg-brand/10',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

// Public prop vocabulary (CLAUDE.md Rule 7). Native button attributes are allowed
// EXCEPT className/style — those are removed so styling can only flow through variants.
export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style'>,
    VariantProps<typeof button> {
  /** Render as the child element (e.g. an anchor) while keeping Button styling. */
  asChild?: boolean
}

export function Button({ variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  // cn() de-dupes conflicting utilities as variants grow (internal safety net, not a
  // public className escape hatch — Rule 2 still holds).
  return <Comp className={cn(button({ variant, size }))} {...props} />
}
