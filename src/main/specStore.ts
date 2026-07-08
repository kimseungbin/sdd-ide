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

  Persistence strategy is full-snapshot replace inside a transaction on every change — simple
  and correct at spec scale. Row-level writes + FK enforcement are a later optimization.
*/
const SCHEMA = `
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

function persist(db: DatabaseSync, snapshot: SpecSnapshot): void {
  // Sibling order = index among rootIds (roots) or among a parent's children.
  const ordById = new Map<string, number>()
  snapshot.rootIds.forEach((id, i) => ordById.set(id, i))
  for (const node of snapshot.nodes) node.children.forEach((childId, i) => ordById.set(childId, i))

  const insertNode = db.prepare(
    'INSERT INTO nodes (id, type, title, parent_id, ord, status, state) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
  const insertEdge = db.prepare('INSERT INTO edges (id, from_id, to_id, type) VALUES (?, ?, ?, ?)')

  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM nodes')
    db.exec('DELETE FROM edges')
    for (const node of snapshot.nodes) {
      insertNode.run(
        node.id,
        node.type,
        node.title,
        node.parentId,
        ordById.get(node.id) ?? 0,
        node.type === 'task' ? node.status : null,
        node.type === 'deferred-decision' ? node.state : null,
      )
    }
    for (const edge of snapshot.edges) insertEdge.run(edge.id, edge.from, edge.to, edge.type)
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
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
  db.exec(SCHEMA)

  const engine = createSpecEngine(loadSnapshot(db))
  const listeners = new Set<() => void>()

  // Write-through: every mutation (the single D2 path) persists + notifies.
  engine.subscribe(() => {
    persist(db, engine.toSnapshot())
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
