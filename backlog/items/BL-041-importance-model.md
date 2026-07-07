---
id: BL-041
title: Importance model (derived floor + assigned boost)
status: backlog
type: feature
priority: high
milestone: M4
depends-on-hard: [BL-013]
depends-on-soft: []
decisions: [D12]
---

## Intent

Define what "important" means for D10's importance-overrides-distance rule (D12). Two signal
classes kept separate because they fail differently: **derived (floor)** — hard-edge
reachability + fan-in (direct in-degree); automatic but noisy. **Assigned (boost)** —
star/priority set by human or agent; trustworthy but forgettable. Assigned boosts on top of
a derived floor, so the graph catches what humans forget and humans catch what the graph can't see.

## Acceptance criteria

- [ ] Derived floor computed from hard-edge reachability and direct in-degree ([[BL-013]])
- [ ] Assigned boost (star/priority) settable via the mutation API ([[BL-011]])
- [ ] Composite importance consumable by the context builder ([[BL-040]])
- [ ] Signal source is distinguishable (derived vs. assigned) — needed by escalation ([[BL-055]])

## Notes / open questions

- Deferred decisions are important only when they block the current task's path (D12/O16b).
- Signal-strength-by-use: derived is fine for "what to show"; only explicit forces escalation (D16).

## Deferred decisions

- DD-1: fan-in direct vs. transitive descendant weight — soft, revisit with real graph data (O17).
