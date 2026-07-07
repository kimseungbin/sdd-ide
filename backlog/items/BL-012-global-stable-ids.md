---
id: BL-012
title: Global stable ID scheme
status: in-progress
type: feature
priority: high
milestone: M1
depends-on-hard: [BL-010]
depends-on-soft: []
decisions: [D5, D13]
---

## Intent

Every node gets a stable global ID that survives edits, reordering, and rewrites. This is
non-negotiable (D13 #2 traceability made it so) and is what makes cross-file dependencies
free — an edge is just `{from, to, type}` referencing global IDs (D5), not a text
convention inside `- [ ]` lines.

## Acceptance criteria

- [x] Every node carries a globally unique, stable ID at creation (`src/engine/ids.ts`:
      `createNodeId`/`createEdgeId` — minimal UUID-based scheme)
- [ ] IDs survive move/reorder/rename and round-trip through the projection ([[BL-020]])
- [x] IDs are the anchor for dependency edges ([[BL-013]]) — done; PR traceability ([[BL-062]]) later

## Notes / open questions

- Minimal generator implemented alongside the engine. Remaining work is the
  **projection-embeddable** anchor form (D14) — unblocked once [[BL-020]] starts.
- ID must be embeddable unobtrusively in the hybrid markdown projection (D14, [[BL-020]]).

## Deferred decisions

- (none)
