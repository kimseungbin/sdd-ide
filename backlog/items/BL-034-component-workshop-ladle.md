---
id: BL-034
title: Component workshop & docs (Ladle)
status: done
type: infra
priority: medium
milestone: M3
depends-on-hard: [BL-033]
depends-on-soft: []
decisions: [D18]
---

## Intent

A component workshop for developing UI in isolation and documenting each component's prop
vocabulary (CLAUDE.md Rule 7). Ladle chosen over Storybook for a lighter, Vite-native
footprint. Components render outside Electron in a plain browser — which reinforces the
architecture: presentational components stay decoupled from the preload bridge / IPC
(Rule 6). Bridge-dependent components will mock `window.sddIde` in stories.

## Acceptance criteria

- [x] Ladle installed and configured (`.ladle/config.mjs`), Tailwind wired into its Vite
      pipeline (`.ladle/vite.config.ts`), tokens loaded via the Ladle Provider
- [x] Button ships stories: Variants, Sizes, Disabled, and a controls Playground (Rule 7)
- [x] `npm run ladle` (serve) and `npm run ladle:build` (static) scripts
- [x] `ladle build` verified green; output kept out of electron-builder's resources dir

## Notes / open questions

- Convention (ongoing): every new component ships a `*.stories.tsx` with a Playground —
  this is how Rule 7 is realized in practice.
- Bridge/IPC mocking for stateful components: address when the first such component lands.

## Deferred decisions

- (none)
