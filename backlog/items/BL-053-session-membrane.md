---
id: BL-053
title: Spec vs. implementation session isolation (membrane)
status: backlog
type: feature
priority: high
milestone: M5
depends-on-hard: [BL-052]
depends-on-soft: [BL-042]
decisions: [D7]
---

## Intent

The store is the membrane (D7/P6): spec-writing (divergent/abstract) and implementation
(convergent/concrete) run as **separate sessions**, and only committed structured state
crosses between them. Deliberation stays in its session and dies there. Implementation
findings escape *up* only as structured nodes (e.g. a deferred-decision node, D6) via the
API — never as inline spec edits. Prevents down→up, up→down, and task→task pollution.

## Acceptance criteria

- [ ] Spec-writing and implementation run as distinct sessions with distinct scoped context
- [ ] Neither session holds the full store in context; both query it for exactly what they need
- [ ] Implementation findings surface upward only as structured nodes ([[BL-042]]), not text edits
- [ ] The minimal spec slice (acceptance criteria + dependency-neighborhood design) keeps
      implementation faithful without inheriting deliberation

## Notes / open questions

- Total isolation costs coherence — the safety net is the read-only reviewer ([[BL-060]]).

## Deferred decisions

- (none)
