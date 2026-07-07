---
id: BL-061
title: PR inline spec-diff
status: backlog
type: feature
priority: medium
milestone: M6
depends-on-hard: [BL-020, BL-022]
depends-on-soft: []
decisions: [D13]
---

## Intent

Review specs like code (D13 #1): the committed markdown projection diffs legibly inside a PR.
Lowest bar of the four PR behaviors — demands only that the text form is legible when diffed,
which the hybrid projection ([[BL-020]]) provides. Under the dev-centric lens (D20) it need
only be developer-legible.

## Acceptance criteria

- [ ] Spec changes appear as a readable diff in the PR alongside code
- [ ] Embedded ID anchors ([[BL-012]]) don't clutter the diff to the point of illegibility
- [ ] Reviewer can comment on spec lines like any code line

## Notes / open questions

- Reviewer edits to the diff route through parse-back + confirmation ([[BL-021]]).

## Deferred decisions

- (none)
