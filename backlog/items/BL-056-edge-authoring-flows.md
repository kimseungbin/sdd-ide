---
id: BL-056
title: Edge authoring flows + hard-edge human confirm
status: backlog
type: feature
priority: medium
milestone: M5
depends-on-hard: [BL-013, BL-050]
depends-on-soft: [BL-043]
decisions: [D23]
---

## Intent

Three authoring paths, all converging on the D2 API (D23), unified by a trust gradient (edge
strength sets the trust bar): **agent-proposed = default** (low friction, keeps the graph
populated so P4's value materializes); **manual = always available** (precision); **inference
from references = soft edges only** (mention ≠ dependency). An agent may freely create/propose
soft edges, but any `blocks`/`supersedes` edge it wants requires **explicit human confirmation**.

## Acceptance criteria

- [ ] Agent-proposed edge flow (default path) through the MCP adapter ([[BL-050]])
- [ ] Manual edge authoring always available in the UI
- [ ] Reference-inferred edges restricted to soft types only
- [ ] Agent-created hard edges require explicit human confirmation before landing

## Notes / open questions

- Same trust gradient as D12 (derived floor vs. explicit boost) and D16/O20.

## Deferred decisions

- (none)
