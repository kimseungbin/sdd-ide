---
id: BL-055
title: Agent behavior on deferred decisions (halt/continue)
status: backlog
type: feature
priority: medium
milestone: M5
depends-on-hard: [BL-042, BL-052]
depends-on-soft: [BL-041]
decisions: [D16]
---

## Intent

The first observable expression of the context-management thesis — the moment a user feels
whether the model works (D16). Edge type gates halting (reusing D9's split, no new machinery):
**hard edge** to an unresolved decision → STOP and surface; **soft edge** → CONTINUE and
surface. A **per-project threshold** gates initiative on soft cases only: high = note and
proceed; low = propose a tentative resolution and flag for review. A threshold must never
auto-resolve a hard block.

## Acceptance criteria

- [ ] Hard-edge unresolved decision → agent stops and surfaces it
- [ ] Soft-edge → agent continues and surfaces it
- [ ] Per-project threshold governs initiative on soft cases (note vs. propose-and-flag)
- [ ] Only **explicit** importance (star/priority, [[BL-041]]) forces escalation to a human;
      derived signals (fan-in) do NOT force escalation

## Notes / open questions

- Signal-strength-by-use: stronger action ⇒ stricter signal (D16/O20).

## Deferred decisions

- (none)
