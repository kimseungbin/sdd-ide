---
id: BL-054
title: Role-aware API gating (permissions)
status: backlog
type: feature
priority: high
milestone: M5
depends-on-hard: [BL-011]
depends-on-soft: [BL-053]
decisions: [D24]
---

## Intent

Primary line of defense for role isolation (D24/O14): the spec-engine API is role-aware and
rejects out-of-role mutations — a spec session calling a code-write op, or an impl session
calling a spec-mutation op, is rejected. Works provider-agnostically (P7) because everything
passes through *our* API, not the model's native tool boundaries. Sandbox (filesystem
isolation) is deferred until actually needed.

## Acceptance criteria

- [ ] API knows the caller's role and rejects out-of-role mutations
- [ ] Enforcement is at the D2 write path ([[BL-011]]) — same point as cycle checks ([[BL-014]])
- [ ] Provider-agnostic: no reliance on Claude Code native tool permissions
- [ ] Filesystem sandbox explicitly deferred (documented as out of scope for now)

## Notes / open questions

- Both cycle checks and role checks land on D2's single mutation path — reuse, don't invent.

## Deferred decisions

- (none)
