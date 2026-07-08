---
id: BL-002
title: "Block editor spike: Slate/Plate vs Tiptap"
status: done
type: spike
priority: critical
milestone: M0
depends-on-hard: []
depends-on-soft: [BL-010]
decisions: [D18]
---

## Intent

Decide the block editor from evidence, not on paper (D18). The flexibility-vs-stability
tradeoff and the Korean-IME risk can only be settled by typing into a prototype. Scoped
to **3 targeted checks** — everything else (perf, bundle size) is noise at this stage.
Output is a decision (resolves DD-2), not production code.

- [x] **Korean IME composition** — verified live in both prototypes: Korean composition holds
      mid-cursor-move and inside the custom block, no dropped/doubled jamo. The Slate-killer
      check did **not** fire — both pass.
- [x] **Data-model adapter friction** — both wired to a shared single-write-path store adapter
      with a live mutation log. Slate lower-friction (value is a block list w/ native ids);
      Tiptap needs a grafted `blockId` + whole-doc reconcile (one-time cost, deferred to BL-030).
- [x] **Custom block types** — deferred-decision block built in both (Tiptap: schema-validated
      node + NodeView; Slate: element + render branch). Tiptap's path extends to templates (D17).
- [x] **Written recommendation → resolves DD-2: Tiptap (ProseMirror).** Evidence + reasoning in
      the spike's `FINDINGS.md` and in [[D18]] (decisions log). Since IME tied, the decision
      turned on schema-validity-by-construction (D2 alignment), maturity vs Slate's beta, and
      custom-block scaling.

## Resolution

**DD-2 → Tiptap.** `@tiptap/*` promoted to runtime dependencies; the Slate prototype + `slate*`
deps were removed. The Tiptap prototype (`src/renderer/src/spike/blockeditor/`) is kept as the
seed for the real editor, built in [[BL-030]] (a proper store-projection adapter replaces the
spike's whole-doc reconcile).

## Notes / open questions

- Candidates narrowed to ProseMirror family (Tiptap) vs. Slate/Plate; Lexical and
  Editor.js eliminated (D18). Dev-centric lens (D20) weakens BlockNote's batteries-included
  premium, strengthens the control argument.
- Dependency graph is NOT the editor's job (D5) — editor does containment only.

## Deferred decisions

- DD-2: Final editor pick — hard edge to M3 items ([[BL-030]]), resolved by this spike.
