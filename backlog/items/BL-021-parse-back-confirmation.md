---
id: BL-021
title: Parse-back + IDE confirmation path
status: backlog
type: feature
priority: high
milestone: M2
depends-on-hard: [BL-020]
depends-on-soft: [BL-011]
decisions: [D14]
---

## Intent

Handle the one fidelity-risk surface: a reviewer editing the committed markdown in a PR
(they will). Such an edit is a legitimate commit to the durable record (O19), so it is NOT
rejected — but it does NOT silently mutate the store either. It surfaces in the IDE for
**human confirmation before landing** (D14/O18). Gate *this path specifically*; add no
friction elsewhere.

## Acceptance criteria

- [ ] Parser reconstructs a structured mutation from an edited committed markdown file
- [ ] Parsed-back changes surface in the IDE as a pending diff for human confirmation
- [ ] Confirmation applies via the mutation API ([[BL-011]]); rejection discards cleanly
- [ ] Silent auto-apply is impossible

## Notes / open questions

- This reintroduces a text→store path (what D1 avoided) — contained to this gated checkpoint.

## Deferred decisions

- (none)
