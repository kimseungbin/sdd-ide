---
id: BL-020
title: SQLite store — schema + persistence (load / write-through)
status: done
type: feature
priority: high
milestone: M2
depends-on-hard: [BL-010, BL-011]
depends-on-soft: [BL-013]
decisions: [D30]
---

## Intent

Persist the structured store to a local per-project **SQLite** database, which is the durable
record itself (D30 — no committed text projection, no parse-back). The in-memory typed engine
(BL-010/BL-011) stays the hot-path query/traversal layer; SQLite is load-on-open + write-through
persistence underneath. Rows ↔ typed nodes is a lossless mapping — there is no parsing.

## Acceptance criteria

- [x] Schema: `nodes` (adjacency list — id, type, title, parent_id, `ord`, status, state) and
      `edges` (id, from_id, to_id, type), indexed (`src/main/specStore.ts`).
- [x] Every mutation on the engine's single write path (D2, [[BL-011]]) writes through to SQLite.
- [x] Store loads from SQLite on open into the in-memory engine; empty DB → empty store.
      Round-trip covered by `src/main/specStore.test.ts`.
- [x] Runs in the **main process** using Node's built-in **`node:sqlite`** (`DatabaseSync`,
      synchronous — no native module); renderer reads via IPC (resolves DD-5).
- [x] Row-level writes + FK enforcement. Every mutation writes through as a **delta** (insert/
      update/delete only changed rows) inside a transaction, diffing the new snapshot against the
      last persisted set (`createPersister` in `src/main/specStore.ts`). `nodes.parent_id`,
      `edges.from_id`, `edges.to_id` are **deferred foreign keys** to `nodes(id)` (checked at
      COMMIT, so intra-transaction row order is free); `PRAGMA foreign_keys = ON` in normal
      operation. Covered by `src/main/specStore.test.ts` (orphan-edge rejection, update/delete deltas).

## Notes / open questions

- Traversal stays in the in-memory engine; recursive CTEs are available for direct DB queries
  (filtered lookups) but are not the hot path.
- Sibling order persisted as an integer `ord` per parent; a fractional/lexicographic key for
  cheap drag-reorder is the follow-up when reordering ([[BL-031]]) is built.
- DB lives at `<project>/.sdd/spec.db` — must be git-ignored (externalized, not committed).

## Deferred decisions

- (none — the DD-8 format question is moot under D30: there is no text form.)
