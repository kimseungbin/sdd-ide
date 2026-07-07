---
id: BL-013
title: Dependency graph + edge taxonomy
status: backlog
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

- [ ] Edge model with the four types, classified hard vs. soft
- [ ] Edges cross containment and file boundaries freely (via global IDs)
- [ ] Graph traversal queries (neighbors, hard-edge reachability, in-degree) exposed for
      the context builder ([[BL-040]]) and importance model ([[BL-041]])
- [ ] Edge creation goes through the mutation API ([[BL-011]])

## Notes / open questions

- Fan-in metric = direct in-degree for now (D23/O17); transitive is DD-1.
- Cycle handling is [[BL-014]]; authoring flows are [[BL-056]].

## Deferred decisions

- DD-1: fan-in direct vs. transitive — soft, revisit with real graph data (O17).
