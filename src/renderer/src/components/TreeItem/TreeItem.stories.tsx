import type { Story } from '@ladle/react'
import { TreeItem, type TreeItemProps } from './TreeItem'

export default { title: 'Components / TreeItem' }

export const States: Story = () => (
  <div role="tree" style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 240 }}>
    <TreeItem expanded={false}>
      <span aria-hidden style={{ width: 12 }}>
        ▸
      </span>
      <span>src</span>
    </TreeItem>
    <TreeItem expanded>
      <span aria-hidden style={{ width: 12 }}>
        ▾
      </span>
      <span>components</span>
    </TreeItem>
    <TreeItem selected>
      <span aria-hidden style={{ width: 12 }} />
      <span>Button.tsx</span>
    </TreeItem>
    <TreeItem>
      <span aria-hidden style={{ width: 12 }} />
      <span>index.ts</span>
    </TreeItem>
  </div>
)

// Playground documents the prop vocabulary (Rule 7): the only styling knob is the closed
// `selected` variant — no free-form className/style.
export const Playground: Story<TreeItemProps & { label: string }> = ({ label, ...args }) => (
  <div role="tree" style={{ width: 240 }}>
    <TreeItem {...args}>
      <span>{label}</span>
    </TreeItem>
  </div>
)
Playground.args = {
  label: 'Button.tsx',
  selected: false,
}
Playground.argTypes = {
  selected: { control: { type: 'boolean' } },
}
