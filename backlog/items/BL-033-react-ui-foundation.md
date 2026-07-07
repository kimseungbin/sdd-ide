---
id: BL-033
title: React UI foundation & component system
status: in-progress
type: feature
priority: high
milestone: M3
depends-on-hard: [BL-001]
depends-on-soft: [BL-030]
decisions: [D18, D21]
---

## Intent

Establish the React UI layer and the component conventions in CLAUDE.md, so all later
UI work (containment editing, custom blocks) builds on a consistent, constrained base.
React was chosen as the renderer framework (locked): best fit for an LLM-built,
editor-centric Electron app — widest editor ecosystem (keeps D18 options open), React-first
headless/variant libs, and strongest LLM code-generation reliability. This item turns the
UI rules into actual scaffolding.

## Acceptance criteria

- [x] React wired into the renderer (electron-vite + @vitejs/plugin-react, TSX, StrictMode)
- [ ] Variant system in place (CVA) — closed style-prop API, no `className`/`style` escape hatch
- [ ] Headless primitive base adopted (Radix / React Aria) with our styled wrapper layer
- [ ] Design token set defined; components reference tokens only
- [ ] Lint enforcement for CLAUDE.md Rule 3 (raw semantic elements banned outside their
      `components/<X>/` home) — verify Oxlint can express it, else add ESLint for that rule
- [ ] A first reference component (e.g. Button) demonstrating the full pattern + documented props

## Notes / open questions

- Codifies the UI rules in [CLAUDE.md]; mirrors the product's D2/P2 "constrained API, no
  escape hatch" thesis at the UI layer.
- Editor adapter ([[BL-030]]) and custom block types ([[BL-032]]) build on this.

## Deferred decisions

- DD-4: Production CSP hardening (drop dev `'unsafe-inline'`, set via main-process session
  headers) — soft, revisit before first release.
