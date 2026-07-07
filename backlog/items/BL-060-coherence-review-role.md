---
id: BL-060
title: Read-only coherence review role
status: backlog
type: feature
priority: high
milestone: M6
depends-on-hard: [BL-040, BL-053]
depends-on-soft: [BL-041]
decisions: [D11]
---

## Intent

The safety net for the membrane (D11). D7 deliberately blinds the implementer to
intent-beyond-its-slice, so faithfulness-to-intent can't be checked from inside the impl
session. A dedicated **read-only** review role receives the task's slice *including the intent
nodes the implementer was denied* plus the produced code, and reports drift. Read-only ⇒
seeing both sides pollutes nothing. Its job is a *focused* drift signal ("deviates from design
node X here"), not to replace the human reviewer.

## Acceptance criteria

- [ ] Read-only role receives spec intent slice + produced code (scoped by [[BL-040]])
- [ ] Reports focused drift ("deviates from design node X"), catching *intent* not just contract violations
- [ ] Cannot mutate anything (read-only ⇒ no downstream artifact to contaminate)
- [ ] Gated for cost/latency: cheap tasks skip; high-stakes / high-fan-in nodes get it (gating = graph queries)

## Notes / open questions

- Reuses the scoped-context builder as a third consumer (spec-writer / implementer / reviewer).

## Deferred decisions

- (none)
