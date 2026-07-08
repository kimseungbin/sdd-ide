import { describe, it, expect } from 'vitest'
import { createSpecEngine } from '../../../engine'
import { indentTarget, outdentTarget, previousBlockId, siblingAfter } from './structural'

// spec ─ req ─ task
//      └ design
function seeded() {
  const engine = createSpecEngine()
  const spec = engine.createNode({ type: 'spec', title: 'Spec' })
  const req = engine.createNode({ type: 'requirement', title: 'Req', parentId: spec.id })
  const task = engine.createNode({ type: 'task', title: 'Task', parentId: req.id })
  const design = engine.createNode({ type: 'design', title: 'Design', parentId: spec.id })
  return {
    snap: engine.toSnapshot(),
    ids: { spec: spec.id, req: req.id, task: task.id, design: design.id },
  }
}

describe('structural moves', () => {
  it('siblingAfter returns the slot right after a node among its siblings', () => {
    const { snap, ids } = seeded()
    expect(siblingAfter(snap, ids.req)).toEqual({ parentId: ids.spec, index: 1 })
  })

  it('indentTarget nests under the previous sibling; null when first child', () => {
    const { snap, ids } = seeded()
    expect(indentTarget(snap, ids.design)).toEqual({ parentId: ids.req, index: 1 })
    expect(indentTarget(snap, ids.req)).toBeNull()
  })

  it('outdentTarget moves up to the grandparent after the parent; null at root', () => {
    const { snap, ids } = seeded()
    expect(outdentTarget(snap, ids.task)).toEqual({ parentId: ids.spec, index: 1 })
    expect(outdentTarget(snap, ids.spec)).toBeNull()
  })

  it('previousBlockId is the depth-first predecessor; null for the first block', () => {
    const { snap, ids } = seeded()
    expect(previousBlockId(snap, ids.design)).toBe(ids.task)
    expect(previousBlockId(snap, ids.spec)).toBeNull()
  })
})
