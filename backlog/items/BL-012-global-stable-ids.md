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
- [x] IDs are the anchor for dependency edges ([[BL-013]]) — done
- [ ] IDs persist as SQLite primary keys and survive move/reorder/rename ([[BL-020]])
- [ ] IDs are the reference target from Git commits/PRs to spec nodes (traceability, [[BL-062]])

## Notes / open questions

- Under D30, IDs are DB primary keys and the **Git↔spec reference token** (commit/PR ↔ node,
  like `#123`). The former "embed the anchor in a markdown projection" work (D14) is dropped —
  there is no text projection.

## Deferred decisions

- (none)
