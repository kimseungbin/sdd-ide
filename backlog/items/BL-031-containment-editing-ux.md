---
id: BL-031
title: Containment editing UX (nesting, drag-drop)
status: backlog
type: feature
priority: medium
milestone: M3
depends-on-hard: [BL-030]
depends-on-soft: [BL-015]
decisions: [D5]
---

## Intent

Structured-first authoring UX (P3): drag/drop, nesting, and progressive disclosure ("hide
too much detail") as first-class interactions — first-class because the data is structured,
not because we're prettifying text. This edits the containment relation only (D5).

## Acceptance criteria

- [ ] Nest / unnest / reorder blocks via direct manipulation
- [ ] Drag-drop moves subtrees; all moves go through the mutation API ([[BL-011]])
- [ ] Progressive disclosure (collapse/expand detail) on the containment tree

## Notes / open questions

- Dependency edges are authored elsewhere ([[BL-056]]); this is containment only (P5).

## Deferred decisions

- (none)
