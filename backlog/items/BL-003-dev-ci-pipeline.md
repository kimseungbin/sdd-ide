---
id: BL-003
title: Dev CI pipeline (GitHub Actions)
status: backlog
type: infra
priority: medium
milestone: M0
depends-on-hard: [BL-001]
depends-on-soft: []
decisions: []
---

## Intent

Run the project's quality gates automatically on every push/PR, instead of by hand. As the
codebase grows this is the safety net that keeps `main` green. Distinct from [[BL-064]],
which is *product* CI (the spec-driven merge gate) — this is *developer* CI for the repo.

## Acceptance criteria

- [ ] GitHub Actions workflow runs on push and pull_request to `main`
- [ ] Steps: install, `typecheck`, `lint` (oxlint + eslint), `test`, `build`
- [ ] Node version pinned to match local (Node 26); dependency cache for speed
- [ ] Green check required before the branch is considered healthy

## Notes / open questions

- Could later add `ladle:build` as a smoke check and upload the static workshop as an artifact.
- Keep it fast (oxlint is ~instant; eslint scoped to gap rules only).

## Deferred decisions

- (none)
