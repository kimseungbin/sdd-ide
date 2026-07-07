---
id: BL-XXX
title: <short imperative title>
status: backlog          # backlog | ready | in-progress | in-review | done | deferred
type: feature            # feature | spike | infra | research | chore
priority: medium         # low | medium | high | critical
milestone: MX            # M0 | M1 | M2 | M3 | M4 | M5 | M6
depends-on-hard: []      # [BL-###] — must resolve first (mirrors D9 `blocks`/`supersedes`)
depends-on-soft: []      # [BL-###] — should be aware of, non-gating (mirrors D9 `relates`/`informs`)
decisions: []            # [D#] — design decisions from sdd-ide-decisions.md this realizes
---

## Intent

<One paragraph: what this delivers and *why* — the intent, not the implementation.
Keep implementation detail out of here (D7 membrane: this file describes intent).>

## Acceptance criteria

<Contract-level checks. What must be observably true for this item to be "done".>

- [ ] ...
- [ ] ...

## Notes / open questions

<Context worth carrying; links to sibling items via [[BL-###]]. Non-gating.>

- ...

## Deferred decisions

<Parked questions that this item surfaces but must NOT resolve now (D6).
A hard-edge deferral blocks this item; a soft-edge one just travels with it.>

- DD-#: <question> — <edge: hard|soft> to [[BL-###]]
