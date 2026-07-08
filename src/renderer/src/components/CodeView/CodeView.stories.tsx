import type { Story } from '@ladle/react'
import { CodeView } from './CodeView'

export default { title: 'Components / CodeView' }

const SAMPLE = `import { useState } from 'react'

// A tiny counter — JetBrains/Darcula highlighting.
export function Counter() {
  const [n, setN] = useState(0)
  return <button onClick={() => setN(n + 1)}>{n}</button>
}
`

export const ReadOnly: Story = () => (
  <div style={{ height: 260 }}>
    <CodeView filename="Counter.tsx" value={SAMPLE} />
  </div>
)

// The edit escape hatch (D20): same component with `editable`.
export const Editable: Story = () => (
  <div style={{ height: 260 }}>
    <CodeView filename="Counter.tsx" value={SAMPLE} editable />
  </div>
)
