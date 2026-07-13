import type { Story } from '@ladle/react'
import { Badge, type BadgeProps } from './Badge'

export default { title: 'Components / Badge' }

const TONES = ['added', 'removed', 'modified', 'renamed', 'neutral'] as const

// The tones map to git/sem change states; the glyph is content (here the porcelain letter).
const LETTER: Record<(typeof TONES)[number], string> = {
  added: 'A',
  removed: 'D',
  modified: 'M',
  renamed: 'R',
  neutral: 'U',
}

export const Tones: Story = () => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    {TONES.map((tone) => (
      <Badge key={tone} tone={tone}>
        {LETTER[tone]}
      </Badge>
    ))}
  </div>
)

export const Sizes: Story = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <Badge tone="modified" size="sm">
      M
    </Badge>
    <Badge tone="modified" size="md">
      Modified
    </Badge>
  </div>
)

// Playground documents the full prop vocabulary (Rule 7): tone + size are the only styling knobs.
export const Playground: Story<BadgeProps & { children: string }> = (args) => <Badge {...args} />
Playground.args = { children: 'M', tone: 'modified', size: 'sm' }
Playground.argTypes = {
  tone: { options: TONES, control: { type: 'radio' } },
  size: { options: ['sm', 'md'], control: { type: 'radio' } },
}
