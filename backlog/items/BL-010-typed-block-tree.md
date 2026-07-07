---
id: BL-010
title: Typed block-tree data model
status: done
type: feature
priority: critical
milestone: M1
depends-on-hard: []
depends-on-soft: []
decisions: [D1, D5]
---

## Intent

The typed block tree that is the source of truth (D1). This is the containment relation
(D5): the nesting tree answering "what is this spec made of." Everything in the IDE runs
off this store. Not text — a typed tree of nodes.

## Acceptance criteria

- [x] Node types defined as a discriminated union (`src/engine/types.ts`): spec,
      requirement, design, task, deferred-decision, text
- [x] Containment tree supports nesting, ordering (index), and move
- [x] In-memory normalized store (`Map<id, Node>` + rootIds) is the single working representation
- [x] Store is serializable/reconstructable via `toSnapshot()` / `createSpecEngine(snapshot)`
      (round-trip tested; feeds rehydration in [[BL-022]])

## Notes / open questions

- Mutation invariant is load-bearing: truth changes *only* via the structured API
  ([[BL-011]]) — this item defines the shape, not the write path.
- Containment ≠ dependency (P5): the blocking graph is a separate model ([[BL-013]]).

## Deferred decisions

- (none)
