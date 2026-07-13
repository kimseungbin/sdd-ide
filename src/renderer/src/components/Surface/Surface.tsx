import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/*
  Surface — the material primitive every container region is built from (Panel,
  rails, the command palette, dialogs). It generalizes the hardcoded
  `bg-surface border-border` box in Panel into a closed `material` vocabulary.

  Follows the CLAUDE.md UI rules:
  - Rule 1/2: appearance flows ONLY through the closed `material`/`padding`/`radius`
    variants — no className/style escape hatch. Grow it by adding a named material,
    never by letting callers pass raw styles.
  - Rule 4: every material's colours/blur/shadow come from the `--glass-*` and
    `--color-*` tokens in theme.css (the `.material-*` classes), never raw values here.
  - Rule 5: glass materials fall back to the solid surface under
    `prefers-reduced-transparency` (handled at the token layer in theme.css).

  Material guidance (from Apple's Liquid Glass): glass is for the *navigation layer*
  that floats above content — rails, toolbars, palettes, dialogs — never the content
  layer (the editor stays `solid`), and never glass-on-glass. The variant names
  encode that intent; picking `glass` for a content pane is the smell to avoid.
*/
const surface = cva('', {
  variants: {
    material: {
      // Opaque editor/content surface — the default; the content layer stays solid.
      solid: 'material-solid',
      // Frosted navigation-layer glass — rails, toolbars, panel headers.
      glass: 'material-glass',
      // More present glass for transient floating chrome — command palette, popovers.
      glassStrong: 'material-glass-strong',
    },
    radius: {
      none: '',
      md: 'rounded-md',
    },
    padding: {
      none: '',
      normal: 'p-3',
    },
  },
  defaultVariants: { material: 'solid', radius: 'md', padding: 'none' },
})

// Public prop vocabulary (Rule 7). No className/style — styling is the closed variant set.
export interface SurfaceProps extends VariantProps<typeof surface> {
  children?: ReactNode
}

export function Surface({ material, radius, padding, children }: SurfaceProps) {
  return <div className={cn(surface({ material, radius, padding }))}>{children}</div>
}
