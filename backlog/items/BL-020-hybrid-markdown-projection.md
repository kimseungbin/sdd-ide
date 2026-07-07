---
id: BL-020
title: Hybrid markdown projection (prose + ID anchors)
status: backlog
type: feature
priority: high
milestone: M2
depends-on-hard: [BL-010, BL-012]
depends-on-soft: [BL-013]
decisions: [D14]
---

## Intent

Generate the committed text form: human-readable markdown prose with unobtrusive embedded
stable-ID anchors (D14). This satisfies legible review (D13 #1), persistent identity
(D13 #2), and — with a disciplined parser — safe round-trip (D13 #3). No-ID markdown and
canonical-block formats were both rejected. Under the dev-centric lens (D20) it need only be
developer-legible in a diff, not PM-friendly.

## Acceptance criteria

- [ ] Deterministic projection: store → markdown, stable output for stable input
- [ ] Every node's global ID ([[BL-012]]) embedded unobtrusively and survives a diff
- [ ] Dependency edges representable in the projection
- [ ] Output is legible when diffed in a PR (feeds [[BL-061]])

## Notes / open questions

- Projection is read-only output; the store stays truth (P1). Parse-back is [[BL-021]].

## Deferred decisions

- (none)
