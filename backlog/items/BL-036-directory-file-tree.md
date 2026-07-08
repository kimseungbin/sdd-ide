---
id: BL-036
title: Directory panel (repo file tree)
status: done
type: feature
priority: high
milestone: M3
depends-on-hard: [BL-035]
depends-on-soft: [BL-037]
decisions: [D21]
---

## Intent

Fill the workspace shell's directory pane ([[BL-035]]): a read-only project file tree over
the workspace root, so the developer can navigate the repo. This introduces the app's **first
main↔renderer IPC** — the renderer is sandboxed with no filesystem access (`contextIsolation`
+ `sandbox`), so directory listing runs in the **main process** behind a `contextBridge` API,
scoped to the workspace root. Selecting a file sets the shared active-file workspace state
that the editor pane ([[BL-037]]) reads.

## Acceptance criteria

- [x] Directory pane lists the workspace root's entries (directories first); lazy-expands
      subdirectories on click.
- [x] Listing runs in main via IPC (`fs:readDir`), bridged through preload; the renderer keeps
      no direct fs access (`contextIsolation` + `sandbox` preserved).
- [x] Reads are constrained to the workspace root — path traversal is rejected in main.
- [x] Selecting a file sets shared active-file state (`workspaceStore`) consumed by [[BL-037]].
- [x] Rows use the `TreeItem` primitive (closed style API, `selected` state); tokens-only
      (Rules 1–4). ARIA **tree** semantics (`role="tree"`/`treeitem`, `aria-expanded`/
      `aria-selected`/`aria-level`/`aria-posinset`/`aria-setsize`).
- [x] Full keyboard navigation (Rule 5): roving tabindex (one Tab stop for the whole tree),
      ↑↓ move, → open/descend, ← close/ascend, Home/End, Enter/Space activate.

## Notes / open questions

- Workspace root is `process.cwd()` for now (dev-centric). A real "open folder" / multi-root
  flow is a follow-up.
- Hidden files and `node_modules` are filtered for legibility.
- `TreeItem` is a **presentational row primitive** — a styled `div` carrying the tree role +
  `selected` state, not a `<button>`. So it needs no lint-policy change (Rule 3's one button
  home stays intact) and gives correct tree a11y instead of a pile of buttons.
- Keyboard nav lives in the container (which owns expand + roving-focus state); rows render
  **flattened** (indent by depth) so nav order and DOM order match. Typeahead (jump-to-letter)
  is the one keyboard affordance still deferred.
- The IPC surface (`workspace:root`, `fs:readDir`, `fs:readFile`) is the seed of the app's
  main-process API; the spec-engine ([[BL-011]]) and MCP ([[BL-050]]) surfaces grow alongside it.

## Deferred decisions

- (none — open-folder / multi-root workspace is a follow-up, not a parked decision.)
