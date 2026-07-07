---
id: BL-011
title: "Spec engine: validated mutation API"
status: backlog
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

- [ ] Typed, synchronous, in-process API over the block tree ([[BL-010]])
- [ ] All mutations validated; invalid mutations rejected, not silently coerced
- [ ] No mutation path exists that bypasses this API (no text/escape-hatch write)
- [ ] API surface designed so the MCP adapter ([[BL-050]]) can expose the *same* ops

## Notes / open questions

- Caller A (internal UI) lands here; Caller B (MCP) is [[BL-050]] — same ops, two callers.
- Keep the API role-agnostic here; role-awareness is layered in [[BL-054]].

## Deferred decisions

- DD-3: PM participation model — soft, revisit post-v1 (D20). Does not gate the API shape.
