---
id: BL-030
title: "Editor adapter: doc model as store projection"
status: in-review
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

- [x] Adapter maps editor doc model ↔ store block tree ([[BL-010]]) — `projection.ts`
      (`snapshotToDoc`); every Tiptap node carries its store `nodeId`. Unit-tested.
- [x] Every editor edit produces a structured mutation via the API — no direct store writes.
      Title edits → debounced `updateNode({title})`; decision toggle → `updateNode({state})`,
      all through the `SpecBinding` (D2). App backing writes over the new mutation IPC seam.
- [x] Editor state is reconstructable from the store (projection, not truth) — doc is derived
      from the snapshot and rebuilt on structural change (`structuralSignature`); tested.
- [ ] Korean IME composition verified in the **real** integration (not just the spike) — pending
      human check in the app's Spec-authoring view + the Ladle story (`SpecEditor.stories`).

## Implementation notes

- Renderer→engine **mutation IPC** added (`spec.updateNode/createNode/moveNode/deleteNode`) — the
  write side of Caller A that [[BL-016]] deferred. Errors carry the `SpecEngineError` code across.
- **Echo discipline** keeps IME/caret stable: a title keystroke round-trips to the store but is
  NOT in the structural signature, so it never triggers a doc rebuild; only structural/state
  changes re-project (`SpecEditor.tsx`).
- **Home:** a distinct Spec-authoring surface (`SpecAuthoring`), selected by a provisional
  top-level switch in `App` — the impl workspace stays read-only (membrane D7). Real session
  roles/isolation are M5 ([[BL-053]]/[[BL-054]]).
- Containment flattened to a depth-tagged list; rich nesting/drag editing is [[BL-031]]. The
  dependency graph is separate ([[BL-043]]).

## Deferred decisions

- DD-2: editor pick — hard, resolved by [[BL-002]].
