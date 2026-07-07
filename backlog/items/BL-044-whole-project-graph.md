---
id: BL-044
title: Whole-project graph (optional view)
status: backlog
type: feature
priority: low
milestone: M4
depends-on-hard: [BL-043]
depends-on-soft: []
decisions: [D22]
---

## Intent

An explicit, optional whole-project graph view (D22). Rejected as the *default* because it's a
hairball past a few dozen nodes — the exact noise D5 warned about. Kept because focused views
only show "around what you already know," so *unexpected* connections (discovery) surface only
in a whole view. Occasional value, so it doesn't earn the default slot.

## Acceptance criteria

- [ ] Whole-project dependency graph reachable as an explicit, non-default view
- [ ] Usable for discovery of unexpected/cross-cutting connections
- [ ] Does not become the landing state (focused view [[BL-043]] remains default)

## Notes / open questions

- Lowest priority in M4; ship focused view first.

## Deferred decisions

- (none)
