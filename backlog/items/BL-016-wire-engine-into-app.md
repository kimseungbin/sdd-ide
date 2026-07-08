---
id: BL-016
title: Wire spec engine into the app (Caller A)
status: done
type: feature
priority: high
milestone: M1
depends-on-hard: [BL-011, BL-033]
depends-on-soft: [BL-013]
decisions: [D2]
---

## Intent

Connect the spec engine (BL-010/011/013) to the React UI — the architecture's **Caller A**
(D2: "the IDE's UI calls the engine directly"). This item builds the seam between the two
halves — engine in the main process, renderer as an IPC client. Resolves **DD-5**
(engine runtime placement) in the process.

## Acceptance criteria

- [x] A single engine instance is provided to the renderer (Caller A) — the main-process
      store owns the engine (`src/main/specStore.ts`); renderer reaches it via IPC.
- [x] React binding: a hook exposing engine queries that re-renders on change
      (`useSpecTree` over `useSyncExternalStore`, `src/renderer/src/store/{specStore,useSpecTree}.ts`),
      Rule 6 — UI derives from the store.
- [x] Runtime boundary decided (resolves DD-5): **main process + IPC** (engine + SQLite in
      main; renderer is a read-only IPC client).
- [x] Placeholder preload bridge replaced with the real surface (`sddIde.spec.getSnapshot` /
      `sddIde.spec.onChanged`, `src/preload/index.ts` + `src/main/ipc.ts`).
- [x] A minimal UI reads from the engine — the spec projection pane renders the real tree
      (`SpecPanel`), proving the seam end-to-end.

**Scope note:** this wires the **read** seam (impl session reads the spec only, membrane D7).
The renderer-side **write** path (Caller A mutations from a spec-authoring session) is future
work, gated behind the editor adapter ([[BL-030]]) and session-role model (M5).

## Notes / open questions

- If in-renderer: just import + a `useSpecEngine` hook. If main: an IPC layer (async) —
  which also shapes how the MCP adapter ([[BL-050]]) and persistence ([[BL-022]]) attach.
- The editor adapter ([[BL-030]]) builds on this binding.

## Deferred decisions

- Resolves DD-5 (engine runtime placement).
