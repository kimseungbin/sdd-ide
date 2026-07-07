---
id: BL-014
title: Write-time cycle checks
status: done
type: feature
priority: medium
milestone: M1
depends-on-hard: [BL-013]
depends-on-soft: [BL-011]
decisions: [D24]
---

## Intent

Prevent deadlock in the dependency graph (D24). A hard-edge cycle (`blocks`/`supersedes`
forming a loop) means each item waits on the other — blocked at write-time by the API.
Cheap because every edge already passes through the single mutation path (D2). Soft-edge
cycles are harmless and allowed.

## Acceptance criteria

- [x] Adding a hard edge that would form a cycle is rejected at write-time (`SpecEngineError`
      code `CYCLE`); verified by test
- [x] Soft-edge cycles are permitted (verified by test)
- [ ] "Resolve later" is expressed as a deferred-decision node ([[BL-042]]), not a tolerated
      cycle — convention; realized once [[BL-042]] lands

## Notes / open questions

- Reuses D2's write path as the enforcement point — same reuse-don't-invent pattern as roles ([[BL-054]]).

## Deferred decisions

- (none)
