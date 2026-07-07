---
id: BL-016
title: Wire spec engine into the app (Caller A)
status: backlog
type: feature
priority: high
milestone: M1
depends-on-hard: [BL-011, BL-033]
depends-on-soft: [BL-013]
decisions: [D2]
---

## Intent

Connect the spec engine (BL-010/011/013) to the React UI — the architecture's **Caller A**
(D2: "the IDE's UI calls the engine directly"). Today the engine is a fully-tested island
that nothing imports; this item builds the seam between the two halves. Resolves **DD-5**
(engine runtime placement) in the process.

## Acceptance criteria

- [ ] A single engine instance is provided to the renderer (Caller A)
- [ ] React binding: a hook/context exposing engine queries that re-renders on `subscribe()`
      (Rule 6 — UI derives from the store)
- [ ] Runtime boundary decided (resolves DD-5): in-renderer now vs. main process + IPC
- [ ] Placeholder preload bridge (`sddIde.versions`) replaced with the real surface, or
      removed if the engine runs in-renderer
- [ ] A minimal UI reads from the engine (e.g. renders the spec tree) to prove the seam end-to-end

## Notes / open questions

- If in-renderer: just import + a `useSpecEngine` hook. If main: an IPC layer (async) —
  which also shapes how the MCP adapter ([[BL-050]]) and persistence ([[BL-022]]) attach.
- The editor adapter ([[BL-030]]) builds on this binding.

## Deferred decisions

- Resolves DD-5 (engine runtime placement).
