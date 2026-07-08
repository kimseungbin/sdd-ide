import type { Story } from '@ladle/react'
import { Panel, type PanelProps } from './Panel'

export default { title: 'Components / Panel' }

export const Padding: Story = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, height: 220 }}>
    <Panel title="Normal padding">Content sits inside the pane with token spacing.</Panel>
    <Panel title="No padding" padding="none">
      <div style={{ padding: 0 }}>Full-bleed content (e.g. a code editor).</div>
    </Panel>
  </div>
)

// Playground documents the full prop vocabulary (CLAUDE.md Rule 7): the only styling knob
// is the closed `padding` variant — there is no free-form className/style input.
export const Playground: Story<PanelProps & { children: string }> = (args) => (
  <div style={{ height: 200 }}>
    <Panel {...args} />
  </div>
)
Playground.args = {
  title: 'Spec',
  children: 'A titled, accessible region.',
  padding: 'normal',
}
Playground.argTypes = {
  padding: { options: ['normal', 'none'], control: { type: 'radio' } },
}
