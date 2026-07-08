import { describe, it, expect, vi } from 'vitest'
import { createSpecEngine } from './engine'
import { SpecEngineError } from './errors'

describe('createSpecEngine', () => {
  it('creates roots and nested children in order', () => {
    const engine = createSpecEngine()
    const spec = engine.createNode({ type: 'spec', title: 'Auth' })
    const req = engine.createNode({ type: 'requirement', parentId: spec.id, title: 'Login' })
    const task = engine.createNode({ type: 'task', parentId: spec.id, title: 'Build form' })

    expect(engine.getRoots().map((n) => n.id)).toEqual([spec.id])
    expect(engine.getChildren(spec.id).map((n) => n.id)).toEqual([req.id, task.id])
    expect(req.parentId).toBe(spec.id)
  })

  it('inserts at an explicit index', () => {
    const engine = createSpecEngine()
    const spec = engine.createNode({ type: 'spec' })
    const a = engine.createNode({ type: 'text', parentId: spec.id })
    const c = engine.createNode({ type: 'text', parentId: spec.id })
    const b = engine.createNode({ type: 'text', parentId: spec.id, index: 1 })

    expect(engine.getChildren(spec.id).map((n) => n.id)).toEqual([a.id, b.id, c.id])
  })

  it('defaults task status to todo and updates it', () => {
    const engine = createSpecEngine()
    const task = engine.createNode({ type: 'task' })
    expect(task).toMatchObject({ type: 'task', status: 'todo' })

    const updated = engine.updateNode(task.id, { status: 'done' })
    expect(updated).toMatchObject({ status: 'done' })
  })

  it('rejects a patch field that does not apply to the node type', () => {
    const engine = createSpecEngine()
    const text = engine.createNode({ type: 'text' })
    expect(() => engine.updateNode(text.id, { status: 'done' })).toThrow(SpecEngineError)
  })

  it('throws NODE_NOT_FOUND for unknown ids', () => {
    const engine = createSpecEngine()
    expect(() => engine.updateNode('missing', { title: 'x' })).toThrow(
      expect.objectContaining({ code: 'NODE_NOT_FOUND' }),
    )
  })

  it('moves a node to a new parent at an index', () => {
    const engine = createSpecEngine()
    const spec = engine.createNode({ type: 'spec' })
    const a = engine.createNode({ type: 'design', parentId: spec.id })
    const b = engine.createNode({ type: 'design', parentId: spec.id })
    const child = engine.createNode({ type: 'text', parentId: a.id })

    engine.moveNode(child.id, b.id)
    expect(engine.getChildren(a.id)).toHaveLength(0)
    expect(engine.getChildren(b.id).map((n) => n.id)).toEqual([child.id])
    expect(engine.getNode(child.id)?.parentId).toBe(b.id)
  })

  it('prevents moving a node into its own descendant (containment cycle)', () => {
    const engine = createSpecEngine()
    const parent = engine.createNode({ type: 'spec' })
    const child = engine.createNode({ type: 'design', parentId: parent.id })

    expect(() => engine.moveNode(parent.id, child.id)).toThrow(
      expect.objectContaining({ code: 'CYCLE' }),
    )
    expect(() => engine.moveNode(parent.id, parent.id)).toThrow(
      expect.objectContaining({ code: 'CYCLE' }),
    )
  })

  it('deletes a node and its entire subtree', () => {
    const engine = createSpecEngine()
    const spec = engine.createNode({ type: 'spec' })
    const branch = engine.createNode({ type: 'design', parentId: spec.id })
    const leaf = engine.createNode({ type: 'text', parentId: branch.id })

    engine.deleteNode(branch.id)
    expect(engine.getNode(branch.id)).toBeUndefined()
    expect(engine.getNode(leaf.id)).toBeUndefined()
    expect(engine.getChildren(spec.id)).toHaveLength(0)
  })

  it('returns clones so the store cannot be mutated off-path (D2)', () => {
    const engine = createSpecEngine()
    const spec = engine.createNode({ type: 'spec', title: 'original' })

    const read = engine.getNode(spec.id)!
    read.title = 'hacked'
    read.children.push('injected')

    expect(engine.getNode(spec.id)?.title).toBe('original')
    expect(engine.getChildren(spec.id)).toHaveLength(0)
  })

  it('notifies subscribers on mutation and stops after unsubscribe', () => {
    const engine = createSpecEngine()
    const listener = vi.fn()
    const unsubscribe = engine.subscribe(listener)

    engine.createNode({ type: 'spec' })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    engine.createNode({ type: 'spec' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('round-trips through a snapshot', () => {
    const engine = createSpecEngine()
    const spec = engine.createNode({ type: 'spec', title: 'Payments' })
    engine.createNode({ type: 'task', parentId: spec.id, title: 'Stripe', status: 'in-progress' })

    const snapshot = engine.toSnapshot()
    const restored = createSpecEngine(snapshot)

    expect(restored.toSnapshot()).toEqual(snapshot)
    expect(restored.getChildren(spec.id).map((n) => n.title)).toEqual(['Stripe'])
  })

  it('changes a node type in place, preserving id/title/children and resetting type fields', () => {
    const engine = createSpecEngine()
    const spec = engine.createNode({ type: 'spec', title: 'Root' })
    const task = engine.createNode({ type: 'task', parentId: spec.id, title: 'Do', status: 'done' })
    engine.createNode({ type: 'text', parentId: task.id, title: 'child' })

    const changed = engine.changeNodeType(task.id, 'text')
    expect(changed).toMatchObject({ id: task.id, type: 'text', title: 'Do' })
    expect('status' in changed).toBe(false) // task-only field dropped
    expect(engine.getChildren(task.id).map((n) => n.title)).toEqual(['child']) // subtree kept

    const back = engine.changeNodeType(task.id, 'task')
    expect(back).toMatchObject({ type: 'task', status: 'todo' }) // status reset, not carried
  })
})
