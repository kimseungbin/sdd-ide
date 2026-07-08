---
id: BL-032
title: Custom block types incl. deferred-decision node
status: in-progress
type: feature
priority: medium
milestone: M3
depends-on-hard: [BL-030]
depends-on-soft: [BL-042, BL-015]
decisions: [D6, D17]
---

## Intent

Render and edit our own block types through the adopted editor — most importantly the
deferred-decision node (D6), the sharpest primitive. This is the check the spike ([[BL-002]])
validated; it extends to the template system (D17), whose definitions also need custom-block
rendering.

## Acceptance criteria

- [x] Custom block renderer/editor extension point in the adapter ([[BL-030]]) — one uniform
      `specBlock` NodeView renders per `specType`; the slash (`/`) menu inserts block types.
- [x] Deferred-decision node renders with its lifecycle state (open/resolved) and edits via API —
      card with a resolve/reopen toggle → `updateNode({state})`.
- [ ] Template-defined block types render through the same path ([[BL-015]]) — waits on templates.

## Notes / open questions

- Node *behavior/lifecycle* is [[BL-042]]; this item is its *editor representation*.

## Deferred decisions

- (none)
