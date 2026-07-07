---
id: BL-002
title: "Block editor spike: Slate/Plate vs Tiptap"
status: backlog
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

## Acceptance criteria

- [ ] **Korean IME composition** — block mutation / cursor movement does not break
      mid-composition. (Highest priority — the whole reason Slate's beta status is a risk.
      If Slate breaks here, Slate is out.)
- [ ] **Data-model adapter friction** — minimal adapter making the editor's doc model a
      projection of the store (D1), edits flowing via the API (D2). Judge whether Slate's
      schema-less core is genuinely lower-friction vs. ProseMirror's strict schema.
- [ ] **Custom block types** — render/edit a custom block (e.g. deferred-decision node,
      D6); confirm the path extends to template definitions (D17).
- [ ] Written recommendation with the evidence → resolves DD-2.

## Notes / open questions

- Candidates narrowed to ProseMirror family (Tiptap) vs. Slate/Plate; Lexical and
  Editor.js eliminated (D18). Dev-centric lens (D20) weakens BlockNote's batteries-included
  premium, strengthens the control argument.
- Dependency graph is NOT the editor's job (D5) — editor does containment only.

## Deferred decisions

- DD-2: Final editor pick — hard edge to M3 items ([[BL-030]]), resolved by this spike.
