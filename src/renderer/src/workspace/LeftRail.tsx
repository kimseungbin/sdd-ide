import { useState, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { Panel } from '../components/Panel'
import { DirectoryPanel } from './panes/DirectoryPanel'
import { SpecPanel } from './panes/SpecPanel'

/*
  LeftRail (BL-035) — the workspace's left rail: directory + spec stacked, sharing the rail.
  Each section can be collapsed (header-only, the other fills the rail) and the two can be
  swapped top↔bottom. Expanded sections split the rail height 1:1 (flex).
*/
type RailKey = 'dir' | 'spec'

const SECTIONS: Record<RailKey, { title: string; render: () => ReactNode }> = {
  dir: { title: 'Directory', render: () => <DirectoryPanel /> },
  spec: { title: 'Spec', render: () => <SpecPanel /> },
}

export function LeftRail() {
  const [order, setOrder] = useState<[RailKey, RailKey]>(['dir', 'spec'])
  const [collapsed, setCollapsed] = useState<Record<RailKey, boolean>>({ dir: false, spec: false })

  const swap = (): void => setOrder(([a, b]) => [b, a])
  const toggle = (key: RailKey): void => setCollapsed((c) => ({ ...c, [key]: !c[key] }))

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {order.map((key) => {
        const isCollapsed = collapsed[key]
        const other: RailKey = key === 'dir' ? 'spec' : 'dir'
        return (
          <div key={key} className={isCollapsed ? 'shrink-0' : 'min-h-0 flex-1'}>
            <Panel
              title={SECTIONS[key].title}
              collapsed={isCollapsed}
              actions={
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Swap ${SECTIONS[key].title} and ${SECTIONS[other].title}`}
                    onClick={swap}
                  >
                    ⇅
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${SECTIONS[key].title}`}
                    onClick={() => toggle(key)}
                  >
                    {isCollapsed ? '+' : '−'}
                  </Button>
                </>
              }
            >
              {SECTIONS[key].render()}
            </Panel>
          </div>
        )
      })}
    </div>
  )
}
