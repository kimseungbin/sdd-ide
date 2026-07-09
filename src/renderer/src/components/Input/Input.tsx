import { cva } from 'class-variance-authority'
import { type InputHTMLAttributes, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'

/*
  Input (BL-051 key entry) — the app's single-line text input primitive.

  - Rule 2: closed style API — `className`/`style` are omitted from the public props; appearance
    is fixed here, callers only pass content/behaviour attributes (incl. native `type`, e.g.
    `type="password"` for secret entry).
  - Rule 3: this is the ONLY place a raw <input> may be used; everywhere else imports <Input>.
  - Rule 4: colours/space/radius from tokens (border-border, bg-surface, text-fg, ring-ring…).
  - Rule 5: Enter submits only when NOT mid-IME-composition (guards Hangul commit).
*/
const inputStyles = cva(
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
)

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'style' | 'onSubmit'
> {
  /** Fired on Enter when NOT composing — IME-safe. */
  onSubmit?: () => void
}

export function Input({ onSubmit, onKeyDown, ...props }: InputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      onSubmit?.()
    }
    onKeyDown?.(event)
  }

  return <input {...props} onKeyDown={handleKeyDown} className={cn(inputStyles())} />
}
