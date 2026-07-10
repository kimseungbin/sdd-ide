import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import {
  createSpecEngine,
  type DecisionState,
  type Edge,
  type Node,
  type NodeId,
  type SpecEngine,
  type SpecSnapshot,
  type TaskStatus,
} from '../engine'

/*
  Main-process spec store (BL-020/BL-022, D30). The structured store IS the durable record,
  persisted to a local SQLite DB via Node's built-in `node:sqlite` (no native module). The
  in-memory typed engine stays the hot-path query/traversal layer; SQLite is load-on-open +
  write-through persistence. Rows ↔ typed nodes is a lossless mapping — there is no parsing.

  Persistence: schema evolves through an ordered migration runner keyed on `PRAGMA user_version`
  (BL-022 — the store outlives any one app version), and every mutation writes through as a
  row-level delta (insert/update/delete only what changed) inside a transaction (BL-020).
  Referential integrity is enforced by deferred foreign keys: `nodes.parent_id`, `edges.from_id`,
  and `edges.to_id` all reference `nodes(id)`, checked at COMMIT so intra-transaction row order
  is irrelevant. The engine API (D2) is the source of truth; the FKs are a persistence-layer net.
*/

// ── Schema migrations (BL-022) ──────────────────────────────────────────────
// Each migration bumps `user_version` by one. Migration 1 is the original no-FK schema, kept
// verbatim (with IF NOT EXISTS) so DBs created before versioning existed migrate cleanly.
// Migration 2 rebuilds both tables with deferred foreign keys — SQLite can't ALTER a FK onto an
// existing table, so a create-copy-drop-rename rebuild is the only correct path.

const MIGRATION_1_INITIAL = `
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  parent_id TEXT,
  ord INTEGER NOT NULL,
  status TEXT,
  state TEXT
);
CREATE TABLE IF NOT EXISTS edges (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  type TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_edges_from ON edges(from_id);
CREATE INDEX IF NOT EXISTS idx_edges_to ON edges(to_id);
`

// Rebuild `nodes` first (self-referencing parent_id), then `edges` against the finalized table.
// Runs with foreign_keys OFF (see openSpecStore), so the drop/rename churn can't trip a check.
const MIGRATION_2_FOREIGN_KEYS = `
CREATE TABLE nodes_new (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  parent_id TEXT REFERENCES nodes_new(id) DEFERRABLE INITIALLY DEFERRED,
  ord INTEGER NOT NULL,
  status TEXT,
  state TEXT
);
INSERT INTO nodes_new (id, type, title, parent_id, ord, status, state)
  SELECT id, type, title, parent_id, ord, status, state FROM nodes;
DROP TABLE nodes;
ALTER TABLE nodes_new RENAME TO nodes;

CREATE TABLE edges_new (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL REFERENCES nodes(id) DEFERRABLE INITIALLY DEFERRED,
  to_id TEXT NOT NULL REFERENCES nodes(id) DEFERRABLE INITIALLY DEFERRED,
  type TEXT NOT NULL
);
INSERT INTO edges_new (id, from_id, to_id, type)
  SELECT id, from_id, to_id, type FROM edges;
DROP TABLE edges;
ALTER TABLE edges_new RENAME TO edges;

CREATE INDEX idx_nodes_parent ON nodes(parent_id);
CREATE INDEX idx_edges_from ON edges(from_id);
CREATE INDEX idx_edges_to ON edges(to_id);
`

const MIGRATIONS: readonly { version: number; sql: string }[] = [
  { version: 1, sql: MIGRATION_1_INITIAL },
  { version: 2, sql: MIGRATION_2_FOREIGN_KEYS },
]

/** Apply every migration newer than the DB's current `user_version`, each in its own transaction. */
function migrate(db: DatabaseSync): void {
  const { user_version: current } = db.prepare('PRAGMA user_version').get() as {
    user_version: number
  }
  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue
    db.exec('BEGIN')
    try {
      db.exec(migration.sql)
      // `user_version` takes a literal, not a bound param; the value is a trusted constant.
      db.exec(`PRAGMA user_version = ${migration.version}`)
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
  }
}

// ── Row ↔ node mapping ──────────────────────────────────────────────────────

interface NodeRow {
  id: string
  type: string
  title: string
  parent_id: string | null
  ord: number
  status: string | null
  state: string | null
}
interface EdgeRow {
  id: string
  from_id: string
  to_id: string
  type: string
}

function rowToNode(row: NodeRow, children: NodeId[]): Node {
  const base = { id: row.id, title: row.title, children, parentId: row.parent_id }
  switch (row.type) {
    case 'task':
      return { ...base, type: 'task', status: (row.status ?? 'todo') as TaskStatus }
    case 'deferred-decision':
      return { ...base, type: 'deferred-decision', state: (row.state ?? 'open') as DecisionState }
    case 'requirement':
      return { ...base, type: 'requirement' }
    case 'design':
      return { ...base, type: 'design' }
    case 'text':
      return { ...base, type: 'text' }
    default:
      return { ...base, type: 'spec' }
  }
}

function loadSnapshot(db: DatabaseSync): SpecSnapshot {
  const nodeRows = db
    .prepare('SELECT id, type, title, parent_id, ord, status, state FROM nodes')
    .all() as unknown as NodeRow[]
  const edgeRows = db
    .prepare('SELECT id, from_id, to_id, type FROM edges')
    .all() as unknown as EdgeRow[]

  // Group child ids by parent, ordered by `ord` (null parent = roots).
  const byParent = new Map<string | null, { id: string; ord: number }[]>()
  for (const row of nodeRows) {
    const list = byParent.get(row.parent_id) ?? []
    list.push({ id: row.id, ord: row.ord })
    byParent.set(row.parent_id, list)
  }
  for (const list of byParent.values()) list.sort((a, b) => a.ord - b.ord)
  const orderedChildren = (parent: string | null): NodeId[] =>
    (byParent.get(parent) ?? []).map((c) => c.id)

  const nodes = nodeRows.map((row) => rowToNode(row, orderedChildren(row.id)))
  const edges: Edge[] = edgeRows.map((row) => ({
    id: row.id,
    from: row.from_id,
    to: row.to_id,
    type: row.type as Edge['type'],
  }))
  return { version: 1, rootIds: orderedChildren(null), nodes, edges }
}

// ── Delta write-through (BL-020) ────────────────────────────────────────────
// The persisted value of a row, keyed by id. Sibling `ord` = index among rootIds / a parent's
// children. Comparing these records against the last persisted set yields the minimal write.

interface NodeRecord {
  type: string
  title: string
  parent_id: string | null
  ord: number
  status: string | null
  state: string | null
}
interface EdgeRecord {
  from_id: string
  to_id: string
  type: string
}

function snapshotRecords(snapshot: SpecSnapshot): {
  nodes: Map<string, NodeRecord>
  edges: Map<string, EdgeRecord>
} {
  const ordById = new Map<string, number>()
  snapshot.rootIds.forEach((id, i) => ordById.set(id, i))
  for (const node of snapshot.nodes) node.children.forEach((childId, i) => ordById.set(childId, i))

  const nodes = new Map<string, NodeRecord>()
  for (const node of snapshot.nodes) {
    nodes.set(node.id, {
      type: node.type,
      title: node.title,
      parent_id: node.parentId,
      ord: ordById.get(node.id) ?? 0,
      status: node.type === 'task' ? node.status : null,
      state: node.type === 'deferred-decision' ? node.state : null,
    })
  }
  const edges = new Map<string, EdgeRecord>()
  for (const edge of snapshot.edges) {
    edges.set(edge.id, { from_id: edge.from, to_id: edge.to, type: edge.type })
  }
  return { nodes, edges }
}

function nodeRecordEq(a: NodeRecord, b: NodeRecord): boolean {
  return (
    a.type === b.type &&
    a.title === b.title &&
    a.parent_id === b.parent_id &&
    a.ord === b.ord &&
    a.status === b.status &&
    a.state === b.state
  )
}
function edgeRecordEq(a: EdgeRecord, b: EdgeRecord): boolean {
  return a.from_id === b.from_id && a.to_id === b.to_id && a.type === b.type
}

/** Build a stateful persister that writes only the rows that changed since its last call. */
function createPersister(db: DatabaseSync, initial: SpecSnapshot): (next: SpecSnapshot) => void {
  const insNode = db.prepare(
    'INSERT INTO nodes (id, type, title, parent_id, ord, status, state) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
  const updNode = db.prepare(
    'UPDATE nodes SET type = ?, title = ?, parent_id = ?, ord = ?, status = ?, state = ? WHERE id = ?',
  )
  const delNode = db.prepare('DELETE FROM nodes WHERE id = ?')
  const insEdge = db.prepare('INSERT INTO edges (id, from_id, to_id, type) VALUES (?, ?, ?, ?)')
  const updEdge = db.prepare('UPDATE edges SET from_id = ?, to_id = ?, type = ? WHERE id = ?')
  const delEdge = db.prepare('DELETE FROM edges WHERE id = ?')

  // Starts synced with what loadSnapshot just read, so the first mutation writes only its delta.
  let prev = snapshotRecords(initial)

  return function persist(nextSnapshot: SpecSnapshot): void {
    const next = snapshotRecords(nextSnapshot)
    db.exec('BEGIN')
    try {
      // Deferred FKs mean intra-transaction order is free; deletes first keeps the churn minimal.
      for (const id of prev.nodes.keys()) if (!next.nodes.has(id)) delNode.run(id)
      for (const id of prev.edges.keys()) if (!next.edges.has(id)) delEdge.run(id)
      for (const [id, r] of next.nodes) {
        const before = prev.nodes.get(id)
        if (!before) insNode.run(id, r.type, r.title, r.parent_id, r.ord, r.status, r.state)
        else if (!nodeRecordEq(before, r))
          updNode.run(r.type, r.title, r.parent_id, r.ord, r.status, r.state, id)
      }
      for (const [id, r] of next.edges) {
        const before = prev.edges.get(id)
        if (!before) insEdge.run(id, r.from_id, r.to_id, r.type)
        else if (!edgeRecordEq(before, r)) updEdge.run(r.from_id, r.to_id, r.type, id)
      }
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err // leave `prev` untouched so the next write re-diffs against the committed state
    }
    prev = next
  }
}

export interface MainSpecStore {
  /** The trusted mutation path (main only). Renderer never sees this. */
  readonly engine: SpecEngine
  getSnapshot(): SpecSnapshot
  subscribe(onChange: () => void): () => void
  close(): void
}

export function openSpecStore(dbPath: string): MainSpecStore {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true })
  const db = new DatabaseSync(dbPath)

  // FK enforcement must be toggled outside a transaction; run migrations with it OFF so table
  // rebuilds don't trip checks, then turn it ON for all normal write-through traffic.
  db.exec('PRAGMA foreign_keys = OFF')
  migrate(db)
  db.exec('PRAGMA foreign_keys = ON')

  const initial = loadSnapshot(db)
  const engine = createSpecEngine(initial)
  const persist = createPersister(db, initial)
  const listeners = new Set<() => void>()

  // Write-through: every mutation (the single D2 path) persists its delta + notifies.
  engine.subscribe(() => {
    persist(engine.toSnapshot())
    for (const listener of listeners) listener()
  })

  return {
    engine,
    getSnapshot: () => engine.toSnapshot(),
    subscribe(onChange) {
      listeners.add(onChange)
      return () => {
        listeners.delete(onChange)
      }
    },
    close() {
      db.close()
    },
  }
}

// Temporary demo seed until real specs exist (BL-022 lifecycle will replace it). Mutates via
// the engine, so it persists through the write-through path.
export function seedDemoSpec(engine: SpecEngine): void {
  const spec = engine.createNode({ type: 'spec', title: 'Implementation-session workspace' })
  const task = (title: string, parentId: string, status: TaskStatus): void => {
    engine.createNode({ type: 'task', title, parentId, status })
  }

  const shell = engine.createNode({
    type: 'requirement',
    title: 'Four-pane workspace shell',
    parentId: spec.id,
  })
  task('Layout skeleton + Panel primitive', shell.id, 'done')

  const panes = engine.createNode({
    type: 'design',
    title: 'Store-driven panes',
    parentId: spec.id,
  })
  task('Directory tree + keyboard nav', panes.id, 'done')
  task('Read-first code editor', panes.id, 'done')
  task('Spec drill-down tree', panes.id, 'done')
  task('SQLite persistence', panes.id, 'in-progress')

  const agent = engine.createNode({ type: 'design', title: 'Agent surface', parentId: spec.id })
  task('IME-safe composer', agent.id, 'done')
  task('Wire provider + MCP (M5)', agent.id, 'todo')
}
