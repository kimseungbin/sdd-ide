---
id: BL-022
title: In-repo storage + deterministic rehydration
status: backlog
type: feature
priority: high
milestone: M2
depends-on-hard: [BL-020]
depends-on-soft: [BL-010]
decisions: [D15]
---

## Intent

Specs live in-repo alongside code (D15) because all PR behaviors are Git-native — putting
canonical data outside Git means re-solving branching/merging/versioning Git already solves.
The committed projection is the durable record; the live store is a rehydratable working
layer reconstructed from it deterministically (D1 amended via O19).

## Acceptance criteria

- [ ] Committed markdown projection stored in-repo alongside code
- [ ] Store rehydrates deterministically from committed files on open (round-trips with [[BL-020]])
- [ ] Spec versions branch/merge with the code (answers "which spec matches *this* branch")

## Notes / open questions

- Mutation invariant preserved: rehydration is a read; writes still go through the API.

## Deferred decisions

- (none)
