---
id: BL-065
title: Session-scoped cross-worktree changeset view
status: backlog
type: feature
priority: medium
milestone: M6
depends-on-hard: []
depends-on-soft: [BL-053, BL-035]
decisions: [D7, D13]
---

## Intent

Show **everything the current work session changed, across every worktree/branch it touched**,
as one aggregated Source Control view — regardless of which worktree a given change landed in.

This is genuine whitespace: neither incumbent can produce it because their VCS surface is
scoped to a single worktree. JetBrains opens **each git worktree as a separate project window**
and the Commit / Local Changes view only ever shows that one worktree's changes — with multiple
worktrees driven from parallel agent sessions, there is no way to see the session's total
footprint (see research 2026-07-22; YouTrack IDEA-143404, IDEA-386301). VS Code (1.103+) goes
further — worktrees register as sibling repositories in the Source Control Repositories view — but
the ceiling is still "several worktree-repos side by side," not a session-scoped aggregate.

Our advantage is structural: a **session** ([[BL-053]]) already scopes work, and we own the
Source Control tab, so we can tag changesets by session and flatten them across worktrees into
one list the incumbents' project-scoped model can't produce.

## Acceptance criteria

- [ ] A single view lists all working-tree changes produced by the current session, spanning
      every worktree/branch that session touched (not just the active worktree)
- [ ] Each change is attributed to its worktree/branch, and the view can group by worktree or
      show a flat session-level changeset
- [ ] Selecting a change opens its diff regardless of which worktree it lives in
- [ ] Staging/committing from the view acts on the correct worktree for each change (no
      cross-worktree write leakage)
- [ ] Works when a session spans ≥2 worktrees created for parallel agent tabs

## Notes / open questions

- **Prereq tracking gap:** the existing Source Control tab (commits `97171b7`, `5bf10aa`,
  `8f9fbd7`, `509880a`) has no backlog item; this builds directly on it. Backfill or fold in.
- Depends on how a "session" maps to worktrees/branches — pinned by the session model
  ([[BL-053]]); the changeset attribution is only as good as that mapping.
- Hosted in the session workspace shell ([[BL-035]]); complements app-native spec diff
  ([[BL-061]]) — code/worktree changes vs. spec-store changes are two faces of the same
  review surface.
- Open: does the aggregate view span **only the current session's** worktrees, or all live
  worktrees of the repo with session as a filter? (leaning session-first, all-worktrees as a toggle)

## Deferred decisions

- (none)
