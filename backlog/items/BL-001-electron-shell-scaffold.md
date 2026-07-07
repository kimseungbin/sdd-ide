---
id: BL-001
title: Electron app shell scaffold
status: in-review
type: infra
priority: high
milestone: M0
depends-on-hard: []
depends-on-soft: []
decisions: [D21]
---

## Intent

Stand up the Electron shell so everything else has a home. Electron is chosen for
Node/CLI ecosystem alignment (D21): the app layer owns orchestration, Claude Code
subagents attach as CLI subprocesses, and the Agent SDK is Node/TS-native — all natural
on Electron's Node runtime. This is scaffolding, not product.

## Acceptance criteria

- [x] Electron app boots to a blank window (main + renderer + preload wired)
- [x] TypeScript, lint (Oxlint), and a test runner (Vitest) configured
- [x] Node subprocess spawn works from the main process (proves the D8 CLI-attach path)
- [x] Repo builds (electron-vite build ✓); packaging configured (electron-builder) — full package run pending

## Notes / open questions

- Memory footprint tradeoff is accepted (D21); revisit only if user-facing.
- Keep the data model and orchestration shell-agnostic enough to port if forced.

## Deferred decisions

- (none)
