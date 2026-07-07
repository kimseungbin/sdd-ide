---
id: BL-011
title: "Spec engine: validated mutation API"
status: done
type: feature
priority: critical
milestone: M1
depends-on-hard: [BL-010]
depends-on-soft: [BL-012]
decisions: [D2]
---

## Intent

The single validated mutation path (D2, P2): the "database access layer" of the app.
One spec engine with a typed API (e.g. `moveTask`, `setStatus`, `addEdge`). Every write —
human or agent — passes through here. This is what makes "structure is truth" enforced
rather than aspirational, and the natural home for later gates (role checks [[BL-054]],
cycle checks [[BL-014]]).

## Acceptance criteria

- [x] Typed, synchronous, in-process API over the block tree ([[BL-010]]):
      `createNode/updateNode/moveNode/deleteNode` + queries + `subscribe`
- [x] All mutations validated; invalid rejected via `SpecEngineError` (NODE_NOT_FOUND,
      INVALID_PATCH, CYCLE), not silently coerced
- [x] No mutation path bypasses this API — queries return **clones**, so callers cannot
      mutate the store off-path (verified by test)
- [x] Command-style API maps cleanly to MCP tools ([[BL-050]]); role-awareness layered later ([[BL-054]])

## Notes / open questions

- Caller A (internal UI) lands here; Caller B (MCP) is [[BL-050]] — same ops, two callers.
- Keep the API role-agnostic here; role-awareness is layered in [[BL-054]].

## Deferred decisions

- DD-3: PM participation model — soft, revisit post-v1 (D20). Does not gate the API shape.
- DD-5: Engine runtime placement — main process (Node/filesystem) with renderer over IPC,
  vs. in-renderer with persistence via IPC. Soft; the engine is pure in-memory so this is
  deferred until persistence lands ([[BL-022]]).
