---
id: BL-037
title: Read-first code editor (CodeMirror 6)
status: in-progress
type: feature
priority: high
milestone: M3
depends-on-hard: [BL-035, BL-036]
depends-on-soft: []
decisions: [D20, D21, D31]
---

## Intent

Fill the workspace shell's editor pane ([[BL-035]]): a **read-first** code editor. Reading and
understanding what the agent produced is the primary use (D20); editing is an escape hatch behind
an explicit toggle, not the main loop. Displays the active file (from `workspaceStore`, set by the
directory pane [[BL-036]]) with syntax highlighting via the `CodeView` primitive (CodeMirror 6,
JetBrains/Darcula theme, D31), read via the main-process fs IPC, scoped to the workspace root.

## Acceptance criteria

- [x] Shows the active file with **syntax highlighting** (CodeMirror 6, JetBrains/Darcula theme
      via the `CodeView` primitive), read via `fs:readFile` (main), root-scoped.
- [x] Empty state when no file is selected; loading and unreadable states handled.
- [x] Derives from `workspaceStore` active-file state (Rule 6); re-renders on selection change.
- [x] Tokens-only (the `--cm-*` palette); no raw interactive elements (Rules 3/4).
- [x] **Edit/save escape hatch** (D20): read-only by default; explicit "Edit" unlocks, Save /
      Cmd-S writes back via `fs:writeFile`, Cancel reverts; dirty indicator.

## Notes / open questions

- Read-first (D20) made concrete: the pane is a read-only viewer until you explicitly Edit.
- Shares the main-process fs IPC ([[BL-036]]); adds `fs:writeFile` (root-scoped) for save.
- Engine = CodeMirror 6 (D31); the syntax palette lives in `styles/theme.css` (`--cm-*`).

## Deferred decisions

- DD-10 — **RESOLVED → D31**: CodeMirror 6 over Monaco (bundle, our token rules, Vite/Electron
  fit, read-first; the JetBrains look via Darcula theming). Distinct from the block-editor pick
  (D18/[[BL-002]]), which is for the *spec* editor, not code.
