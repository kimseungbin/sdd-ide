import { describe, it, expect, afterEach } from 'vitest'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { openSpecStore, seedDemoSpec } from './specStore'

const dir = join(tmpdir(), 'sdd-spec-test')
const dbPath = join(dir, 'spec.db')

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('openSpecStore (node:sqlite persistence)', () => {
  it('persists a seeded tree and reloads it losslessly across reopen', () => {
    const first = openSpecStore(dbPath)
    seedDemoSpec(first.engine)
    const before = first.getSnapshot()
    first.close()

    const second = openSpecStore(dbPath)
    const after = second.getSnapshot()
    second.close()

    expect(after.rootIds).toEqual(before.rootIds)
    expect(after.nodes.length).toBe(before.nodes.length)
    // Containment survives: same children, in the same order.
    const childrenById = (s: typeof after) => Object.fromEntries(s.nodes.map((n) => [n.id, n.children]))
    expect(childrenById(after)).toEqual(childrenById(before))
  })

  it('writes through on every mutation and reflects the latest state on reopen', () => {
    const store = openSpecStore(dbPath)
    const spec = store.engine.createNode({ type: 'spec', title: 'S' })
    store.engine.createNode({ type: 'task', title: 'T', parentId: spec.id, status: 'todo' })
    store.close()

    const reopened = openSpecStore(dbPath)
    const snap = reopened.getSnapshot()
    reopened.close()

    expect(snap.rootIds).toEqual([spec.id])
    const task = snap.nodes.find((n) => n.type === 'task')
    expect(task?.title).toBe('T')
  })

  it('preserves task status and starts empty on a fresh db', () => {
    const store = openSpecStore(dbPath)
    expect(store.getSnapshot().rootIds).toEqual([])
    const spec = store.engine.createNode({ type: 'spec', title: 'S' })
    store.engine.createNode({ type: 'task', title: 'Done one', parentId: spec.id, status: 'done' })
    store.close()

    const reopened = openSpecStore(dbPath)
    const task = reopened.getSnapshot().nodes.find((n) => n.type === 'task')
    reopened.close()
    expect(task).toMatchObject({ type: 'task', status: 'done' })
  })
})
