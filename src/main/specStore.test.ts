import { describe, it, expect, afterEach } from 'vitest'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { DatabaseSync } from 'node:sqlite'
import { openSpecStore, seedDemoSpec } from './specStore'

const dir = join(tmpdir(), 'sdd-spec-test')
const dbPath = join(dir, 'spec.db')

const userVersion = (db: DatabaseSync): number =>
  (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version

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
    const childrenById = (s: typeof after) =>
      Object.fromEntries(s.nodes.map((n) => [n.id, n.children]))
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

describe('schema migrations (BL-022)', () => {
  it('stamps the DB at the latest schema version on open', () => {
    const store = openSpecStore(dbPath)
    store.close()

    const db = new DatabaseSync(dbPath)
    expect(userVersion(db)).toBe(2)
    db.close()
  })

  it('migrations are idempotent across reopens', () => {
    openSpecStore(dbPath).close()
    openSpecStore(dbPath).close() // second open must not re-run migrations or error

    const db = new DatabaseSync(dbPath)
    expect(userVersion(db)).toBe(2)
    db.close()
  })

  it('upgrades a legacy no-FK / unversioned DB, preserving data', () => {
    // Simulate a DB created before versioning existed: original schema, user_version still 0.
    mkdirSync(dir, { recursive: true })
    const legacy = new DatabaseSync(dbPath)
    legacy.exec(`
      CREATE TABLE nodes (
        id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL,
        parent_id TEXT, ord INTEGER NOT NULL, status TEXT, state TEXT
      );
      CREATE TABLE edges (
        id TEXT PRIMARY KEY, from_id TEXT NOT NULL, to_id TEXT NOT NULL, type TEXT NOT NULL
      );
    `)
    legacy.exec(
      "INSERT INTO nodes (id, type, title, parent_id, ord, status, state) VALUES ('n1', 'spec', 'Legacy', NULL, 0, NULL, NULL)",
    )
    expect(userVersion(legacy)).toBe(0)
    legacy.close()

    const store = openSpecStore(dbPath)
    const snap = store.getSnapshot()
    store.close()

    expect(snap.rootIds).toEqual(['n1'])
    expect(snap.nodes.find((n) => n.id === 'n1')?.title).toBe('Legacy')

    const db = new DatabaseSync(dbPath)
    expect(userVersion(db)).toBe(2)
    db.close()
  })
})

describe('referential integrity + delta writes (BL-020)', () => {
  it('enforces foreign keys so an orphan edge cannot be persisted', () => {
    openSpecStore(dbPath).close() // create the migrated schema

    const db = new DatabaseSync(dbPath)
    db.exec('PRAGMA foreign_keys = ON')
    expect(() =>
      db
        .prepare('INSERT INTO edges (id, from_id, to_id, type) VALUES (?, ?, ?, ?)')
        .run('e1', 'missing-from', 'missing-to', 'depends-on-hard'),
    ).toThrow()
    db.close()
  })

  it('applies mutations as deltas: an update rewrites the row in place, not the whole tree', () => {
    const store = openSpecStore(dbPath)
    const spec = store.engine.createNode({ type: 'spec', title: 'Before' })
    const child = store.engine.createNode({
      type: 'task',
      title: 'child',
      parentId: spec.id,
      status: 'todo',
    })
    store.engine.updateNode(spec.id, { title: 'After' })
    store.engine.updateNode(child.id, { status: 'done' })
    store.close()

    const reopened = openSpecStore(dbPath)
    const snap = reopened.getSnapshot()
    reopened.close()

    expect(snap.nodes.find((n) => n.id === spec.id)?.title).toBe('After')
    expect(snap.nodes.find((n) => n.id === child.id)).toMatchObject({ status: 'done' })
  })

  it('deletes remove rows so they do not resurrect on reopen', () => {
    const store = openSpecStore(dbPath)
    const spec = store.engine.createNode({ type: 'spec', title: 'S' })
    const doomed = store.engine.createNode({ type: 'task', title: 'doomed', parentId: spec.id })
    store.engine.deleteNode(doomed.id)
    store.close()

    const reopened = openSpecStore(dbPath)
    const snap = reopened.getSnapshot()
    reopened.close()

    expect(snap.nodes.some((n) => n.id === doomed.id)).toBe(false)
  })
})
