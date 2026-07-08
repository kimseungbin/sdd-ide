---
id: BL-003
title: Dev CI pipeline (GitHub Actions)
status: done
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

- [x] GitHub Actions workflow runs on push to `main` and on every pull_request
      (`.github/workflows/ci.yml`).
- [x] Steps: `npm ci`, `format:check` (Prettier), `lint` (oxlint + eslint), `typecheck`,
      `test`, `build`.
- [x] Node version pinned via `.nvmrc` (Node 26) + `node-version-file`; npm cache enabled.
      `engines.node >= 24` documents the floor (node:sqlite / `DatabaseSync` needs it).
- [x] Green check gates branch health; the same gate runs locally as git hooks (below).

## Local mirror — git hooks (zero-dependency)

CI is mirrored by committed `.githooks/` wired via `core.hooksPath` (set by the npm `prepare`
script, so a fresh `npm install` self-wires):

- **pre-commit** — fast gate: `format:check` + `lint` + `typecheck` (all <1s).
- **pre-push** — `test` (kept off pre-commit so commits stay fast).

Style is enforced by **Prettier** (`format` / `format:check`); config avoids fighting
oxlint/eslint (neither runs stylistic rules). Markdown is Prettier-ignored (hand-authored docs).

## Notes / open questions

- Could later add `ladle:build` as a smoke check and upload the static workshop as an artifact.
- Keep it fast (oxlint is ~instant; eslint scoped to gap rules only).

## Deferred decisions

- (none)
