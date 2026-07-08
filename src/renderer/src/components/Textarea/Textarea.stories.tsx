import type { Story } from '@ladle/react'
import { useState } from 'react'
import { Textarea, type TextareaProps } from './Textarea'

export default { title: 'Components / Textarea' }

// The IME check: type Korean (e.g. 안녕) and press Enter to COMMIT the composition — it must
// NOT submit. Enter only submits committed text; Shift+Enter always inserts a newline.
export const ImeSafeSubmit: Story = () => {
  const [log, setLog] = useState<string[]>([])
  const [value, setValue] = useState('')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 360 }}>
      <Textarea
        value={value}
        rows={3}
        placeholder="Type here — Enter submits, Shift+Enter = newline"
        onChange={(event) => setValue(event.target.value)}
        onSubmit={() => {
          setLog((prev) => [...prev, value])
          setValue('')
        }}
      />
      <div style={{ fontSize: 12 }}>Submitted: {log.join(' | ') || '(nothing yet)'}</div>
    </div>
  )
}

export const Playground: Story<TextareaProps> = (args) => <Textarea {...args} />
Playground.args = {
  placeholder: 'Message…',
  rows: 3,
  disabled: false,
}
