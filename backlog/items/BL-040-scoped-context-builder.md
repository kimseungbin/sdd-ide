---
id: BL-040
title: Scoped-context builder (LOD renderer)
status: backlog
type: feature
priority: critical
milestone: M4
depends-on-hard: [BL-013, BL-041]
depends-on-soft: [BL-011]
decisions: [D10]
---

## Intent

The real product primitive (D8/D10): a level-of-detail renderer, not a hop-cutoff filter.
Direct neighbors → full detail; distant nodes → summarized (not dropped); important nodes →
always surfaced regardless of distance. The dependency graph *is* the context relevance
filter — "what does this task need to know" is a graph traversal, not "load all spec files."
One builder serves three consumers: spec-writer, implementer, reviewer — and the human
focused graph view ([[BL-043]]).

## Acceptance criteria

- [ ] Given a focus node, returns a scoped slice: full / summarized / always-surfaced tiers
- [ ] Hard-edge-reachable nodes ([[BL-013]]) never dropped; importance ([[BL-041]]) overrides distance
- [ ] Visibility depth is a user-adjustable option with a sensible default
- [ ] Same builder reused by agent sessions and the human graph view (one engine, many consumers)

## Notes / open questions

- Safety of the LOD model rests on the hard/soft split (D9): only soft edges are summarizable.

## Deferred decisions

- (none)
