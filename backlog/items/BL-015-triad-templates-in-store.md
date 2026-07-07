---
id: BL-015
title: Default triad + editable templates in store
status: backlog
type: feature
priority: medium
milestone: M1
depends-on-hard: [BL-010]
depends-on-soft: [BL-011]
decisions: [D17]
---

## Intent

Ship the Kiro-proven default triad (requirements → design → tasks) as a validated starting
structure that avoids the blank-canvas problem, but make templates user-editable so power
users can adapt (research, spikes, bugfix variants) (D17). Because an editable template *is
structured data that defines structure*, it lives in the store — not as a markdown file.

## Acceptance criteria

- [ ] Default triad instantiable as a new spec's starting structure
- [ ] Templates are structured store objects, editable via the mutation API ([[BL-011]])
- [ ] Custom templates can define custom block types (ties to [[BL-032]])

## Notes / open questions

- Same structured-first rule as specs (D1) — no markdown template files.

## Deferred decisions

- (none)
