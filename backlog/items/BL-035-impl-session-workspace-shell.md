---
id: BL-035
title: Implementation-session workspace shell (resizable panes)
status: in-progress
type: feature
priority: high
milestone: M3
depends-on-hard: [BL-033]
depends-on-soft: [BL-010, BL-016]
decisions: [D7, D20, D21]
---

## Intent

Establish the **implementation-session workspace** — the IDE window a developer lives in
while implementing *against* a spec. It is the impl side of the membrane (D7), the
conventional-looking counterpart to M3's spec-authoring editor. Four panes: a **directory**
(project file tree), an **editor** that is *read-first* — understanding what the agent
produced is the primary use; manual editing is an escape hatch, not the main loop (D20) —
a **spec** panel that projects the relevant spec slice **read-only** (the membrane forbids
inline spec edits from here; changes route back as structured proposals, D7), and an
**agent** surface that drives the work. This item delivers only the pane layout skeleton and
the reusable panel contract on the React foundation ([[BL-033]]); each pane's real content
is a child item.

## Acceptance criteria

- [x] Panes render in a **drag-resizable** layout (`react-resizable-panels`): a left rail
      (directory + spec, swappable + collapsible via `LeftRail`), **agent** center and
      **editor** right, sized **1:1** by default; sizes persist (autoSaveId → localStorage).
- [x] Panes built from a reusable `Panel` primitive: titled container + optional header
      `actions` / `collapsed`, closed style-prop API (Rule 2), tokens-only (Rule 4), ARIA
      region (Rule 5), Ladle story (Rule 7).
- [x] Membrane respected by construction — nothing in this workspace exposes a spec-mutation
      path (D7).
- [x] Is the renderer's root view; `npm run dev` shows the workspace with all panes wired
      (child items BL-036–BL-039 done).

## Notes / open questions

- The four panes are child items, all built: [[BL-036]] directory tree · [[BL-037]] read-first
  code editor (CodeMirror) · [[BL-038]] spec drill-down tree · [[BL-039]] agent surface.
- This is one side of the membrane (D7). The spec-authoring workspace (block editor) is the
  M3 set: [[BL-030]] / [[BL-031]] / [[BL-032]].
- Editor pane is read-first (D20): the agent writes code, the human reads to verify intent —
  feeds coherence review [[BL-060]] and PR review [[BL-061]].
- Agent surface is **app-owned and provider-agnostic** (BYOK, D8): the app layer owns
  orchestration, the membrane, and role gating — not an embedded vendor CLI. See [[BL-050]] /
  [[BL-052]].
- Layout is drag-resizable (`react-resizable-panels`); `LeftRail` owns dir/spec swap + collapse;
  sizes persist. The vertical dir↔spec split is flex 1:1 for now — a draggable divider there is
  a follow-up.

## Deferred decisions

- DD-9: **Impl-session spec-panel scope** — assigned tasks only vs. a full scoped-context
  slice (task + acceptance criteria + neighbor `design` nodes, D10). Soft to `BL-038`;
  resolve when the scoped-context builder ([[BL-040]]) lands.
