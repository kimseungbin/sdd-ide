---
id: BL-061
title: App-native spec diff/review (from store history)
status: backlog
type: feature
priority: medium
milestone: M6
depends-on-hard: [BL-020]
depends-on-soft: [BL-062]
decisions: [D13, D30]
---

## Intent

Review specs like code (D13 #1) — but **app-native** (D30). Specs no longer live in Git, so the
diff can't be a PR text diff. Instead the IDE renders a spec change diff from the store's own
history (node/edge deltas between two points), surfaced next to the code PR it corresponds to.
The link between a PR and the spec changes is by stable ID ([[BL-062]]).

## Acceptance criteria

- [ ] Spec changes render as a readable structural diff (added/removed/edited nodes + edges)
- [ ] The diff is scoped to the nodes a given PR/commit references (traceability, [[BL-062]])
- [ ] Reviewer can comment on spec changes; comments feed the agent's structured-update proposals
      (D13 #3) — no text round-trip

## Notes / open questions

- Requires the store to retain enough history to diff two points (append-only change log or
  snapshotting) — a facet of the SQLite store ([[BL-020]]).
- Git-diff-of-markdown review (former model) is gone with D30; parse-back ([[BL-021]]) is retired.

## Deferred decisions

- (none)
