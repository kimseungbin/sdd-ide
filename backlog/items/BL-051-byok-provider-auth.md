---
id: BL-051
title: BYOK provider-agnostic auth
status: backlog
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

- [ ] Per-provider credential storage (API key / Bedrock / Vertex) managed by the app layer
- [ ] Agent calls route through a provider-agnostic interface
- [ ] No feature assumes a Claude-specific auth path

## Notes / open questions

- Credentials handling should be secure-at-rest; treat as sensitive.

## Deferred decisions

- (none)
