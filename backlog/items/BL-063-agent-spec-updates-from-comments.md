---
id: BL-063
title: Agent proposes spec updates from PR comments
status: backlog
type: feature
priority: medium
milestone: M6
depends-on-hard: [BL-050, BL-062]
depends-on-soft: [BL-021]
decisions: [D13]
---

## Intent

Turn PR review comments into structured spec updates (D13 #3). The PR comment is an *input
signal*, NOT a write path — the agent emits a structured mutation via the API (D2) and the
markdown re-projects. Keeps the membrane (D7/P1) intact: no text write path is introduced.

## Acceptance criteria

- [ ] Agent reads PR review comments as input and proposes structured mutations ([[BL-050]])
- [ ] Proposed mutations pass the same validation and (for hard edges) human confirmation
- [ ] Markdown re-projects from the store — the comment never writes directly

## Notes / open questions

- Distinct from reviewer-edits-markdown ([[BL-021]]): that's a direct commit; this is a comment→proposal.

## Deferred decisions

- (none)
