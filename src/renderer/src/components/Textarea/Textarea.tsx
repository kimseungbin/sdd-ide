import { cva } from 'class-variance-authority'
import { useRef, type KeyboardEvent, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/*
  Textarea (BL-039) — the app's IME-safe multiline text input primitive.

  - Rule 2: closed style API — `className`/`style` are omitted from the public props.
  - Rule 4: colors/space/radius from tokens (border-border, bg-surface, text-fg, ring-ring…).
  - Rule 5 (make-or-break): Korean IME composition is handled — Enter submits ONLY when not
    mid-composition. Pressing Enter to *commit* a Hangul composition must never send. We guard
    on both the native `isComposing` flag and our own composition tracking; Shift+Enter always
    inserts a newline.
*/
const textareaStyles = cva(
  'w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
)

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'className' | 'style' | 'onSubmit'
> {
  /** Fired on Enter (without Shift) when NOT composing — Korean-IME safe. */
  onSubmit?: () => void
}

export function Textarea({ onSubmit, onKeyDown, ...props }: TextareaProps) {
  const composing = useRef(false)

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      !composing.current
    ) {
      event.preventDefault()
      onSubmit?.()
    }
    onKeyDown?.(event)
  }

  return (
    <textarea
      {...props}
      onKeyDown={handleKeyDown}
      onCompositionStart={() => {
        composing.current = true
      }}
      onCompositionEnd={() => {
        composing.current = false
      }}
      className={cn(textareaStyles())}
    />
  )
}
