---
id: BL-064
title: Task-completion merge gate (spec drives CI)
status: backlog
type: feature
priority: medium
milestone: M6
depends-on-hard: [BL-062]
depends-on-soft: [BL-013]
decisions: [D13]
---

## Intent

Spec state gates merge (D13 #4): a CI check reads "are all blocking tasks for this PR
complete?" More a graph-query requirement than a serialization one — it queries the dependency
graph ([[BL-013]]) and traceability links ([[BL-062]]) from CI.

## Acceptance criteria

- [ ] Spec state (task status, blocking edges) is queryable from CI
- [ ] Merge check fails when a PR's blocking tasks are incomplete
- [ ] Check is reliable in a headless/CI environment (no IDE dependency)

## Notes / open questions

- Reuses hard-edge semantics (D9): only `blocks` edges gate the merge.

## Deferred decisions

- (none)
