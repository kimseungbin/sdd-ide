---
id: BL-050
title: MCP adapter over the spec engine
status: backlog
type: feature
priority: high
milestone: M5
depends-on-hard: [BL-011]
depends-on-soft: [BL-013]
decisions: [D2]
---

## Intent

Caller B (D2): expose the spec engine's operations to LLM agents as MCP tools (e.g.
`update_task(id, status:"done")`). The agent takes structured actions instead of emitting
text to be parsed. Crucially, this is the *same* API as the internal UI caller — the agent
gets no privileged data path; every mutation passes the same validation. This is what makes
D1 real rather than aspirational.

## Acceptance criteria

- [ ] MCP tools map 1:1 onto spec-engine mutation ops ([[BL-011]]) — no bespoke agent path
- [ ] Agent mutations pass the same validation as UI mutations
- [ ] Graph/query ops exposed for the agent to read scoped context ([[BL-040]])

## Notes / open questions

- Role-awareness (which ops an agent role may call) is layered in [[BL-054]].

## Deferred decisions

- (none)
