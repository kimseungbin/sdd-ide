---
id: BL-030
title: "Editor adapter: doc model as store projection"
status: backlog
type: feature
priority: high
milestone: M3
depends-on-hard: [BL-002, BL-011]
depends-on-soft: [BL-010]
decisions: [D18, D2]
---

## Intent

Adopt the chosen editor (per [[BL-002]]) behind an adapter that treats its document model as
a *projection* of the store (D1), with all edits flowing to the store via the API (D2). We
adopt, not build — block editors are notoriously hard (cursor/selection/IME) and our
differentiation is the data model + context management, not a text-editing engine.

## Acceptance criteria

- [ ] Adapter maps editor doc model ↔ store block tree ([[BL-010]])
- [ ] Every editor edit produces a structured mutation via the API — no direct store writes
- [ ] Editor state is reconstructable from the store (projection, not truth)
- [ ] Korean IME composition verified in the real integration (not just the spike)

## Notes / open questions

- Hard-blocked until DD-2 (editor pick) resolves via [[BL-002]].
- Editor handles containment editing only; dependency graph is separate ([[BL-043]]).

## Deferred decisions

- DD-2: editor pick — hard, resolved by [[BL-002]].
