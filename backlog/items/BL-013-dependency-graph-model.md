---
id: BL-013
title: Dependency graph + edge taxonomy
status: done
type: feature
priority: high
milestone: M1
depends-on-hard: [BL-012]
depends-on-soft: [BL-010]
decisions: [D5, D9]
---

## Intent

The dependency graph: a separate directed graph over the same node IDs (D5), orthogonal to
containment — "what blocks what." Edges are records `{from, to, type}` with four types split
into two behavioral classes (D9): **hard** (`blocks`, `supersedes`) change what a session is
*allowed* to do and are never silently dropped; **soft** (`relates`, `informs`) change what a
session *should know* and may be summarized. This hard/soft split is the spine of the system.

## Acceptance criteria

- [x] Edge model (`Edge {id, from, to, type}`) with the four types, classified hard vs.
      soft (`src/engine/edges.ts`: `isHardEdge`, `HARD_/SOFT_EDGE_TYPES`)
- [x] Edges reference global node ids, so they cross containment and files freely
- [x] Graph queries exposed for [[BL-040]]/[[BL-041]]: `getOutgoingEdges`, `getIncomingEdges`,
      `getInDegree` (fan-in), `getHardReachable` (transitive hard-edge reachability)
- [x] Edge creation goes through the mutation API (`addEdge`/`removeEdge` on the spec engine)

## Notes / open questions

- Fan-in metric = direct in-degree for now (D23/O17); transitive is DD-1.
- Cycle handling is [[BL-014]]; authoring flows are [[BL-056]].

## Deferred decisions

- DD-1: fan-in direct vs. transitive — soft, revisit with real graph data (O17).
