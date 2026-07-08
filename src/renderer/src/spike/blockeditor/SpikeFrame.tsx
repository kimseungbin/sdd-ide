import { useSyncExternalStore, type ReactNode } from 'react'
import type { SpikeStore } from './adapter'

/*
  BL-002 spike — shared readout frame (throwaway). Wraps an editor prototype with a live view
  of the store it writes to: the current block projection + the mutation log. If typing in the
  editor updates these panels, the editor is genuinely acting as a projection of the store with
  writes funnelled through the adapter API (checks #1 IME feedback + #2 adapter friction).
*/
export function SpikeFrame({
  title,
  store,
  children,
}: {
  title: string
  store: SpikeStore
  children: ReactNode
}) {
  const blocks = useSyncExternalStore(store.subscribe, store.getBlocks)
  const log = useSyncExternalStore(store.subscribe, store.getLog)

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 rounded-md border border-border bg-surface p-3">
      <h3 className="text-sm font-semibold text-fg">{title}</h3>

      <div className="rounded-md border border-border bg-base p-2">{children}</div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 text-xs">
        <div className="min-h-0 overflow-auto">
          <p className="mb-1 font-medium text-muted">Store projection</p>
          <ul className="flex flex-col gap-1">
            {blocks.map((b) => (
              <li key={b.id} className="text-fg">
                <span className="text-muted">{b.type}</span>
                {b.state ? <span className="text-brand"> [{b.state}]</span> : null} — {b.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-h-0 overflow-auto">
          <p className="mb-1 font-medium text-muted">Mutation log ({log.length})</p>
          <ul className="flex flex-col gap-1">
            {log.map((m) => (
              <li key={m.seq} className="text-fg">
                <span className="text-muted">#{m.seq}</span> {m.op}(
                <span className="text-brand">{m.blockId}</span>) {m.summary}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
