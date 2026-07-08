---
id: BL-039
title: Agent surface (chat skeleton)
status: done
type: feature
priority: high
milestone: M3
depends-on-hard: [BL-035]
depends-on-soft: [BL-050, BL-051, BL-052]
decisions: [D7, D8]
---

## Intent

Fill the workspace shell's agent pane ([[BL-035]]): the **app-owned** agent surface — a
conversation transcript + composer — through which the developer drives work. Per the
architecture the agent is app-owned and **provider-agnostic** (BYOK, D8): the app layer owns
orchestration, the membrane, and role gating; the model only talks *through* it — it is not an
embedded vendor CLI. This item builds the UI skeleton and an **IME-safe composer**; wiring a
real provider and the MCP mutation path is M5. The pane is an implementation-session (impl-role)
surface (D7).

## Acceptance criteria

- [x] Conversation transcript (user / agent / system turns) + composer, filling the agent pane;
      app-owned (no embedded vendor CLI).
- [x] Composer is **Korean-IME safe** (Rule 5, make-or-break): Enter submits only when *not*
      mid-composition; Shift+Enter inserts a newline. Built on a new `Textarea` primitive
      (closed style API; raw `<textarea>` lint-homed alongside `<button>`).
- [x] Conversation state derives from a store (Rule 6); the transcript re-renders on change.
- [x] Session role surfaced (impl-session) and the disconnected backend stated honestly in-UI —
      no fake agent output.
- [ ] Real provider calls (BYOK) + MCP mutation path + orchestration/role-gating — deferred to
      M5: [[BL-050]] / [[BL-051]] / [[BL-052]].

## Notes / open questions

- The `Textarea` primitive establishes the IME-safe input baseline (Rule 5) that future editor
  surfaces reuse; it is distinct from the block-editor spike ([[BL-002]]).
- Role/membrane enforcement is an API-layer concern (D2, [[BL-054]]); this pane only *presents*
  the role for now.
- Streaming responses and transcript persistence are follow-ups, not parked decisions.

## Deferred decisions

- (none — provider/orchestration specifics are owned by the M5 items above, not parked here.)
