import { useEffect, useMemo, useState } from 'react'
import type { SpecEngine, SpecSnapshot } from '../../../engine'
import { createSeededEngineBinding, type SpecBinding } from './binding'
import { SpecEditor } from './SpecEditor'

/*
  BL-030/031 story — the editor as a projection of a real (in-renderer) engine. Run `npm run ladle`.
  Type into a title: it round-trips through the validated mutation path into the readout below.
  Type 한글 to confirm IME composition holds in the real integration (AC #4). Toggle the
  deferred-decision block: its state flips through the same path and the doc re-projects.

  Containment editing (BL-031): hover a parent block for the ▾ chevron — click to collapse/expand
  its subtree (view-only; the store is untouched). Grab a block's ⋮ grip to drag: drop above/below
  reorders among siblings; drag down-and-right (past the gutter) nests it as a child. Every move
  issues a validated moveNode, so the readout reflects the new containment.
*/
export default { title: 'Spec editor (BL-030)' }

function seed(engine: SpecEngine): void {
  const spec = engine.createNode({ type: 'spec', title: '결제 흐름 사양 (Checkout spec)' })
  const req = engine.createNode({
    type: 'requirement',
    title: '게스트 결제 지원',
    parentId: spec.id,
  })
  engine.createNode({
    type: 'task',
    title: '결제 토큰 발급 구현',
    parentId: req.id,
    status: 'todo',
  })
  const design = engine.createNode({ type: 'design', title: 'PG 어댑터', parentId: spec.id })
  engine.createNode({
    type: 'task',
    title: '웹훅 검증',
    parentId: design.id,
    status: 'in-progress',
  })
  engine.createNode({
    type: 'deferred-decision',
    title: 'PG사 선택: 토스 vs 아임포트',
    parentId: spec.id,
  })
}

function Readout({ binding }: { binding: SpecBinding }) {
  const [snap, setSnap] = useState<SpecSnapshot | null>(() => binding.getSnapshot())
  useEffect(() => binding.subscribe(() => setSnap(binding.getSnapshot())), [binding])
  return (
    <div className="min-h-0 overflow-auto rounded-md border border-border bg-surface p-3 text-xs">
      <p className="mb-1 font-medium text-muted">Store projection (updates as you edit)</p>
      <ul className="flex flex-col gap-1">
        {(snap?.nodes ?? []).map((n) => (
          <li key={n.id} className="text-fg">
            <span className="text-muted">{n.type}</span>
            {n.type === 'deferred-decision' ? (
              <span className="text-brand"> [{n.state}]</span>
            ) : null}
            {n.type === 'task' ? <span className="text-muted"> ({n.status})</span> : null} —{' '}
            {n.title || '(untitled)'}
          </li>
        ))}
      </ul>
    </div>
  )
}

export const Editable = () => {
  const binding = useMemo(() => createSeededEngineBinding(seed), [])
  return (
    <div className="grid h-screen grid-cols-2 gap-4 bg-base p-4 text-fg">
      <div className="min-h-0 overflow-auto rounded-md border border-border bg-surface p-3">
        <SpecEditor binding={binding} />
      </div>
      <Readout binding={binding} />
    </div>
  )
}
