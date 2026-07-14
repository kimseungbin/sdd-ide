import { describe, it, expect } from 'vitest'
import { createSpecEngine } from '../../../engine'
import { snapshotToBlocks, snapshotToDoc, structuralSignature } from './projection'
import { createEngineBinding } from './binding'

function seeded() {
  const engine = createSpecEngine()
  const spec = engine.createNode({ type: 'spec', title: 'Spec' })
  const req = engine.createNode({ type: 'requirement', title: 'Req', parentId: spec.id })
  const task = engine.createNode({ type: 'task', title: 'Task', parentId: req.id, status: 'todo' })
  const dd = engine.createNode({ type: 'deferred-decision', title: 'Decide', parentId: spec.id })
  return { engine, ids: { spec: spec.id, req: req.id, task: task.id, dd: dd.id } }
}

describe('projection: snapshotToBlocks', () => {
  it('flattens the containment tree depth-first with depth + type-specific fields', () => {
    const { engine, ids } = seeded()
    const blocks = snapshotToBlocks(engine.toSnapshot())

    expect(blocks.map((b) => [b.nodeId, b.depth])).toEqual([
      [ids.spec, 0],
      [ids.req, 1],
      [ids.task, 2],
      [ids.dd, 1],
    ])
    expect(blocks.find((b) => b.nodeId === ids.task)?.status).toBe('todo')
    expect(blocks.find((b) => b.nodeId === ids.dd)?.state).toBe('open')
    // spec + req have children; task + dd are leaves.
    expect(blocks.find((b) => b.nodeId === ids.spec)?.hasChildren).toBe(true)
    expect(blocks.find((b) => b.nodeId === ids.task)?.hasChildren).toBe(false)
  })

  it('omits a collapsed node subtree but still emits the node marked collapsed', () => {
    const { engine, ids } = seeded()
    const blocks = snapshotToBlocks(engine.toSnapshot(), new Set([ids.req]))

    // req is present (collapsed); its child task is gone; siblings/others remain.
    expect(blocks.map((b) => b.nodeId)).toEqual([ids.spec, ids.req, ids.dd])
    expect(blocks.find((b) => b.nodeId === ids.req)?.collapsed).toBe(true)
  })
})

describe('projection: snapshotToDoc', () => {
  it('maps every node to a uniform specBlock carrying its nodeId + type-specific attrs', () => {
    const { engine, ids } = seeded()
    const doc = snapshotToDoc(engine.toSnapshot()) as {
      content: { type: string; attrs: Record<string, unknown> }[]
    }
    const [specNode, , taskNode, ddNode] = doc.content

    expect(doc.content.every((n) => n.type === 'specBlock')).toBe(true)
    expect(specNode.attrs).toMatchObject({ nodeId: ids.spec, specType: 'spec' })
    expect(taskNode.attrs).toMatchObject({ nodeId: ids.task, specType: 'task', status: 'todo' })
    expect(ddNode.attrs).toMatchObject({
      nodeId: ids.dd,
      specType: 'deferred-decision',
      state: 'open',
    })
  })

  it('falls back to a single empty paragraph for an empty store', () => {
    const doc = snapshotToDoc(createSpecEngine().toSnapshot()) as { content: { type: string }[] }
    expect(doc.content).toEqual([{ type: 'paragraph' }])
  })
})

describe('projection: structuralSignature', () => {
  it('is stable across title-only edits but changes on structural/state edits', () => {
    const { engine, ids } = seeded()
    const before = structuralSignature(engine.toSnapshot())

    engine.updateNode(ids.task, { title: 'Task renamed' })
    expect(structuralSignature(engine.toSnapshot())).toBe(before) // title not in the signature

    engine.updateNode(ids.dd, { state: 'resolved' })
    expect(structuralSignature(engine.toSnapshot())).not.toBe(before) // state is
  })

  it('changes when a node is collapsed (so the editor re-projects on toggle)', () => {
    const { engine, ids } = seeded()
    const snap = engine.toSnapshot()
    expect(structuralSignature(snap, new Set([ids.req]))).not.toBe(structuralSignature(snap))
  })
})

describe('binding: createEngineBinding round-trip', () => {
  it('routes edits through the engine and reflects them in the next snapshot', () => {
    const { engine, ids } = seeded()
    const binding = createEngineBinding(engine)
    let notified = 0
    binding.subscribe(() => (notified += 1))

    binding.updateNode(ids.task, { title: 'Edited via binding' })

    const task = binding.getSnapshot()?.nodes.find((n) => n.id === ids.task)
    expect(task?.title).toBe('Edited via binding')
    expect(notified).toBeGreaterThan(0)
  })
})
