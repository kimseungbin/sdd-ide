import type { Story } from '@ladle/react'
import { useState } from 'react'
import { Button } from '../Button'
import { Menu } from './Menu'

export default { title: 'Components / Menu' }

// Mirrors the branch switcher: a list with the current item checked + a "New branch…" footer.
export const BranchSwitcher: Story = () => {
  const [current, setCurrent] = useState('main')
  const branches = ['main', 'feature/git-panel', 'fix/auth']
  return (
    <div style={{ padding: 40 }}>
      <Menu
        trigger={
          <Button variant="ghost" size="sm">
            ⎇ {current} ⌄
          </Button>
        }
        items={branches.map((name) => ({
          label: name,
          selected: name === current,
          onSelect: () => setCurrent(name),
        }))}
        footerItem={{ label: '+ New branch…', onSelect: () => setCurrent('new-branch') }}
      />
    </div>
  )
}
