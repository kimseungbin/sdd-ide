import * as RadixDialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { Button } from '../Button'

/*
  Dialog — a modal surface, built on the Radix Dialog headless behavior primitive (focus trap,
  escape/scrim dismissal, ARIA) with our own closed-API presentation (CLAUDE.md Rule 1/2).

  - Rule 2: no className/style passthrough — appearance is fixed here; callers pass content + the
    controlled `open`/`onOpenChange` and a `title`.
  - Rule 4: scrim/surface/border/text from tokens (bg-base, --glass-*, text-fg…).

  Surface is glass (the .material-glass token set): a modal floats above content, which is
  glass's proper home (Apple's Liquid Glass — the navigation/overlay layer, not the content
  layer). The scrim is a light dim (not opaque) so the editor stays visible, frosted, through
  the glass — that translucency is the point; a heavy scrim would hide it and defeat the glass.
*/
export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Accessible title (also the visible heading). */
  title: string
  /** Optional supporting line under the title. */
  description?: string
  children?: ReactNode
}

export function Dialog({ open, onOpenChange, title, description, children }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-base/40" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="material-glass fixed left-1/2 top-1/2 flex w-[28rem] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-md p-4 focus:outline-none"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <RadixDialog.Title className="text-sm font-medium text-fg">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="text-xs text-muted">
                  {description}
                </RadixDialog.Description>
              ) : null}
            </div>
            <RadixDialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close">
                ✕
              </Button>
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
