import { useState, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { Panel } from '../components/Panel'
import { DirectoryPanel } from './panes/DirectoryPanel'
import { SourceControlPanel } from './panes/SourceControlPanel'
import { SpecPanel } from './panes/SpecPanel'

/*
  RightRail (BL-035, extended by the git panel) — a tabbed navigator: Directory / Source Control /
  Spec, one visible at a time so each gets the full rail height (the Source Control tab needs room
  for status + commit box + history). The active tab persists across sessions. Tabs live in the
  Panel header; the active tab reads as `variant="primary"`, the rest as ghost.
*/
type RailKey = 'dir' | 'git' | 'spec'

const TABS: { key: RailKey; title: string; short: string; render: () => ReactNode }[] = [
  { key: 'dir', title: 'Directory', short: 'Files', render: () => <DirectoryPanel /> },
  { key: 'git', title: 'Source Control', short: 'Git', render: () => <SourceControlPanel /> },
  { key: 'spec', title: 'Spec', short: 'Spec', render: () => <SpecPanel /> },
]

const STORAGE_KEY = 'sdd-rail-tab'

function initialTab(): RailKey {
  const saved = localStorage.getItem(STORAGE_KEY)
  return TABS.some((t) => t.key === saved) ? (saved as RailKey) : 'dir'
}

export function RightRail() {
  const [active, setActive] = useState<RailKey>(initialTab)

  const select = (key: RailKey): void => {
    setActive(key)
    localStorage.setItem(STORAGE_KEY, key)
  }

  const activeTab = TABS.find((t) => t.key === active) ?? TABS[0]

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Tab strip — its own row so the Panel title below keeps full width (no clipping). */}
      <div className="flex shrink-0 gap-1">
        {TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={tab.key === active ? 'primary' : 'ghost'}
            size="sm"
            aria-pressed={tab.key === active}
            onClick={() => select(tab.key)}
          >
            {tab.short}
          </Button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        <Panel title={activeTab.title} padding="none">
          <div className="h-full min-h-0 overflow-auto p-3">{activeTab.render()}</div>
        </Panel>
      </div>
    </div>
  )
}
