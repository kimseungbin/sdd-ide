---
id: BL-022
title: Local store lifecycle (open / load / migrations)
status: in-progress
type: feature
priority: high
milestone: M2
depends-on-hard: [BL-020]
depends-on-soft: [BL-010]
decisions: [D30]
---

## Intent

Manage the lifecycle of the local SQLite store (D30): locate/create the per-project database,
load it into the in-memory engine on open, and evolve its schema over time. The store is the
durable record — there is no Git rehydration and no branch-scoping (specs are global, tracker
semantics).

## Acceptance criteria

- [x] Locate/create the per-project database on open (`<project>/.sdd/spec.db`, first-run bootstrap + demo seed).
- [x] Load persisted nodes/edges into the in-memory engine deterministically on open.
- [x] Mutation invariant preserved: load is a read; writes still go through the API ([[BL-011]]).
- [ ] Schema versioning + forward migrations (the store outlives any one app version) — not yet.

## Notes / open questions

- DB location (app-data dir vs. a project-local, git-ignored dir) — decide at build.
- A cloud/sync store is a future upgrade behind the same persistence seam (would reopen D19).

## Deferred decisions

- (none)
