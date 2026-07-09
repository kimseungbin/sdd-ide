---
id: BL-051
title: BYOK provider-agnostic auth
status: in-progress
type: infra
priority: medium
milestone: M5
depends-on-hard: []
depends-on-soft: [BL-052]
decisions: [D8]
---

## Intent

Provider-agnostic BYOK (API keys). Third parties can't use a Claude subscription login (API
key or Bedrock/Vertex only), so the app layer manages per-provider credentials and owns
isolation (§10.2). This keeps orchestration provider-agnostic (P7) — Claude Code subagents
are an optional accelerator, not a dependency.

## Acceptance criteria

- [x] Per-provider credential storage managed by the app layer — `src/main/credentials.ts`:
      resolves env var → `safeStorage`-encrypted-at-rest key, keyed per provider; the plaintext
      key lives only in main and never crosses IPC (renderer can set/probe, never read).
- [x] Agent calls route through a provider-agnostic interface — the `Provider` seam
      (`src/main/providers/types.ts`) carrying tool-calling (defs in, calls out, results back), with
      `anthropicProvider` as the first (and only SDK-importing) implementation; registry in
      `providers/index.ts`.
- [x] No feature assumes a Claude-specific auth path — the loop (`src/main/agent.ts`), the shared
      types (`src/shared/agent.ts`), and the UI reference only neutral `ProviderId` / `Provider`;
      no `anthropic-*` id or vendor SDK leaks past `providers/anthropic.ts`.

## Notes / open questions

- Credentials secure-at-rest via Electron `safeStorage` (OS-keychain-backed; keytar avoided as
  unmaintained). Linux `basic_text` backend is detected and surfaced as a weak-encryption warning.
- Key entry lives in a **Settings modal** (`settings/SettingsDialog.tsx`, a `Dialog` primitive on
  Radix Dialog) opened from the native app menu (Settings… / Cmd+,, `src/main/menu.ts`) — not
  inline in the agent pane, which now just links there when no provider is connected.
- Bedrock/Vertex auth shapes are not yet implemented — the seam accommodates them (add a provider),
  but only the direct API-key path exists so far.
- Not yet verified against a live API round-trip; typechecks/builds/lints. Manual verify pending.
- The seam also carries the **tool-calling backbone** — `ask_user` is its first tool (structured
  question → option cards in the agent pane), the on-thesis (D2) surface for [[BL-056]] hard-edge
  confirm and [[BL-042]] deferred-decision resolution, and the path MCP spec mutations ([[BL-050]])
  will ride on.

## Deferred decisions

- Re-enable adaptive thinking with tool use (currently disabled to avoid replaying thinking blocks
  across the tool round-trip) — preserve provider-native assistant content as an opaque field so
  the neutral transcript stays clean. Non-gating.
