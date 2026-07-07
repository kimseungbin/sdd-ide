import type { Story } from '@ladle/react'
import { Button, type ButtonProps } from './Button'

export default { title: 'Components / Button' }

export const Variants: Story = () => (
  <div style={{ display: 'flex', gap: 12 }}>
    <Button variant="primary">Primary</Button>
    <Button variant="ghost">Ghost</Button>
  </div>
)

export const Sizes: Story = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
  </div>
)

export const Disabled: Story = () => <Button disabled>Disabled</Button>

// Playground documents the full prop vocabulary (CLAUDE.md Rule 7): every knob
// is a control, and there is no free-form styling input — only the closed variants.
export const Playground: Story<ButtonProps & { children: string }> = (args) => (
  <Button {...args} />
)
Playground.args = {
  children: 'Click me',
  variant: 'primary',
  size: 'md',
  disabled: false,
}
Playground.argTypes = {
  variant: { options: ['primary', 'ghost'], control: { type: 'radio' } },
  size: { options: ['sm', 'md'], control: { type: 'radio' } },
}
