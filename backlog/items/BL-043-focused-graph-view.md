---
id: BL-043
title: Focused graph view (reuses LOD renderer)
status: backlog
type: feature
priority: medium
milestone: M4
depends-on-hard: [BL-040]
depends-on-soft: [BL-042]
decisions: [D22]
---

## Intent

The human graph view, defaulting to a focused neighborhood around the current task (D22).
The graph is a context-management tool, not decoration (P4) — judged by "does this help
defer/focus/unblock?" It is not a new mechanism: it reuses D10's LOD renderer ([[BL-040]]).
The same engine that scopes the agent's context scopes the human's visible neighborhood.

## Acceptance criteria

- [ ] Focused view renders the current task's neighborhood via the LOD renderer ([[BL-040]])
- [ ] Near = detailed, far = summarized, important = always shown (D12 importance)
- [ ] Hard vs. soft edges visually distinguishable; unresolved deferrals ([[BL-042]]) flagged
- [ ] Focused view is the default landing state (not the whole-project graph)

## Notes / open questions

- Whole-project graph is the optional companion view ([[BL-044]]).

## Deferred decisions

- (none)
