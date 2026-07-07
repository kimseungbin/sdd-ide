---
id: BL-062
title: "Traceability: PR/commit ↔ task nodes"
status: backlog
type: feature
priority: high
milestone: M6
depends-on-hard: [BL-012, BL-022]
depends-on-soft: [BL-061]
decisions: [D13]
---

## Intent

Link PRs/commits to the spec task nodes they implement (D13 #2). This is the requirement that
made stable IDs non-negotiable ([[BL-012]]) — it needs IDs that survive edits, reordering, and
rewrites. Pre-decided the core of the committed-format question (O1).

## Acceptance criteria

- [ ] A PR/commit can reference the stable node IDs it implements
- [ ] The link survives edits/reordering/rewrites of the referenced nodes
- [ ] Traceability is queryable both directions (node → PRs, PR → nodes)

## Notes / open questions

- Feeds the merge-gate CI query ([[BL-064]]).

## Deferred decisions

- (none)
