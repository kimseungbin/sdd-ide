---
id: BL-042
title: Deferred-decision node lifecycle
status: backlog
type: feature
priority: high
milestone: M4
depends-on-hard: [BL-010, BL-013]
depends-on-soft: [BL-011]
decisions: [D6]
---

## Intent

The system's most distinctive primitive (D6): capture a decision at the moment it surfaces —
with its originating context and a dependency edge to whatever it blocks — park it out of the
active view, and surface it in the graph as an unresolved blocker. Lifecycle: open → resolved
(blocks-until-resolved). Purpose is protecting the human's and agent's working context, not
documentation.

## Acceptance criteria

- [ ] Deferred-decision node type with `open` → `resolved` lifecycle
- [ ] Creation captures originating context + a dependency edge (hard or soft) to what it blocks
- [ ] Parked out of the active view; appears in the graph as an unresolved blocker while open
- [ ] Resolving it unblocks anything hard-edged to it

## Notes / open questions

- Editor representation is [[BL-032]]; agent halt/continue behavior is [[BL-055]].
- "Resolve a cycle later" is expressed as one of these, not a tolerated cycle ([[BL-014]]).

## Deferred decisions

- (none)
