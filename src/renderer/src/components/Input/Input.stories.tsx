import type { Story } from '@ladle/react'
import { useState } from 'react'
import { Input, type InputProps } from './Input'

export default { title: 'Components / Input' }

export const Text: Story = () => {
  const [value, setValue] = useState('')
  return (
    <Input
      value={value}
      placeholder="Type here…"
      aria-label="Example"
      onChange={(event) => setValue(event.target.value)}
    />
  )
}

export const Password: Story = () => {
  const [value, setValue] = useState('')
  return (
    <Input
      type="password"
      value={value}
      placeholder="sk-ant-…"
      aria-label="API key"
      onChange={(event) => setValue(event.target.value)}
    />
  )
}

// Playground documents the full prop vocabulary (CLAUDE.md Rule 7) — a closed set, no
// free-form styling input.
export const Playground: Story<InputProps> = (args) => <Input {...args} />
Playground.args = {
  placeholder: 'Placeholder',
  type: 'text',
  disabled: false,
}
Playground.argTypes = {
  type: { options: ['text', 'password'], control: { type: 'radio' } },
}
