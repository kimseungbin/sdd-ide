---
id: BL-052
title: Orchestration layer + deterministic isolation triggers
status: backlog
type: feature
priority: high
milestone: M5
depends-on-hard: [BL-050, BL-040]
depends-on-soft: [BL-051]
decisions: [D8]
---

## Intent

The app layer owns orchestration authority (D8/P7). Context isolation is guaranteed by
whoever constructs the context window — that's us, not the model. The *policy* of when to
isolate lives here, driven by **deterministic events we define** (deferred-decision emitted,
backlog spec touched, task handoff), never by the model's heuristic delegation routing.

## Acceptance criteria

- [ ] Orchestration layer spawns scoped sessions programmatically on defined trigger events
- [ ] Each spawned session's context is built by the scoped-context builder ([[BL-040]])
- [ ] Triggers are deterministic app events, not model-decided delegation
- [ ] Works over a raw BYOK provider ([[BL-051]]); Claude Code subagents optional accelerator

## Notes / open questions

- Leaning: re-implement isolation rails in our layer for a uniform BYOK promise (D8 tension).

## Deferred decisions

- (none)
