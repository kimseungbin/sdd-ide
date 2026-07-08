---
id: BL-038
title: Spec/task projection panel (read-only)
status: done
type: feature
priority: high
milestone: M3
depends-on-hard: [BL-035, BL-010, BL-011]
depends-on-soft: [BL-040]
decisions: [D1, D7, D30]
---

## Intent

Fill the workspace shell's spec pane ([[BL-035]]): project the spec's **task nodes**
**read-only** into the implementation-session workspace so the developer sees what they are
implementing against. This is the first pane wired to the live typed store, so it is where
Rule 6 (UI derives from the store, D1) becomes real — the pane subscribes to the engine and
re-renders on change, holding no load-bearing local state. The membrane (D7) is preserved by
construction: the pane reads (`getRoots`/`getSubtree`) and offers no spec-mutation path.

## Acceptance criteria

- [x] Spec pane renders the spec forest read from the live store, not from disk or local state.
- [x] Re-renders on store change via `subscribe` (Rule 6) — `useSyncExternalStore` over a
      cached snapshot (stable reference between changes).
- [x] **Read-only drill-down tree** (drill-down navigation survives from D29 under D30): nested containment (spec → requirement/design →
      tasks), expand/collapse, task status shown. Reuses `TreeItem` + the shared
      `useTreeKeyboard` hook (Rule 1) — same ARIA-tree keyboard nav as the directory.
- [x] Read-only: no mutation path from this pane (membrane, D7) — expand/collapse is view state.
- [x] Empty state when no spec is loaded.
- [x] Tokens-only; no raw interactive elements (Rules 3/4).

## Notes / open questions

- Engine runs **in-renderer** for now (DD-5's default); it moves behind IPC when persistence
  lands ([[BL-022]]).
- The demo seed in `specStore.ts` is **temporary dev scaffolding** until rehydration
  ([[BL-022]]) loads a real spec — delete it then.
- Status is shown via text weight + strike-through within existing tokens; a status-color
  token vocabulary / `Badge` primitive is a possible follow-up (deliberate token expansion).
- Whether "task done" toggling is ever allowed here (status ≠ authoring) is left open —
  first cut is strictly read-only.

## Deferred decisions

- Inherits **DD-9** from [[BL-035]]: spec-panel scope — assigned tasks only vs. full
  scoped-context slice (D10). Soft; resolve when the scoped-context builder ([[BL-040]])
  lands. This item currently shows *all* task nodes (whole-tree), a placeholder for that slice.
