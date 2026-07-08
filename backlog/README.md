# SDD IDE — Backlog (v1 build)

_Work-item list for **building the IDE itself**. Fills the gap flagged in
`sdd-ide-architecture.md` §12 ("MVP 범위와 빌드 순서 — 아직 미착수")._
_Every item traces to one or more locked decisions (D1–D24) in `sdd-ide-decisions.md`._

---

## How this backlog works (it dogfoods the product)

The backlog is deliberately modeled the way the IDE models specs — so the plan
practices the thesis before the tool exists:

- **Each item is a node with a stable global ID** (`BL-###`) in its own file under
  `items/`. Renaming/reordering never changes the ID → git gives per-item history
  (dogfoods traceability, D13 #2).
- **Two orthogonal relations over the same items** (D5):
  - **Containment / grouping** = the milestone this file organizes by ("what we build,
    in what phase").
  - **Dependency** = `depends-on-hard` / `depends-on-soft` edges in each item's
    frontmatter ("what blocks what"). These cut across milestones freely.
- **Hard vs. soft edges** (D9): `depends-on-hard` = must finish first (a blocker);
  `depends-on-soft` = should be aware of, non-gating.
- **Frontmatter = structured anchors up top, human prose below.** (The backlog files
  themselves are markdown; this is the backlog's own authoring format, independent of how the
  product now stores specs — externalized to SQLite, D30.)
- **Deferred decisions** (D6) are parked in-item under `## Deferred decisions` and
  collected at the bottom of this index — captured, not resolved.

New item → copy [`TEMPLATE.md`](./TEMPLATE.md), take the next free `BL-###`.

### Legend

- **status:** `backlog` → `ready` → `in-progress` → `in-review` → `done`; `deferred` = parked.
- **type:** `feature` · `spike` · `infra` · `research` · `chore`.
- **priority:** `low` · `medium` · `high` · `critical`.

---

## Milestones (build order)

Ordered by dependency, not by importance. Earlier milestones unblock later ones;
the spec engine core (M1) is load-bearing for everything.

### M0 — Foundation & de-risking spikes
_Resolve the open questions that gate architecture choices before committing._

| ID | Title | type | prio | status | decisions |
|----|-------|------|------|--------|-----------|
| [BL-001](./items/BL-001-electron-shell-scaffold.md) | Electron app shell scaffold | infra | high | done | D21 |
| [BL-002](./items/BL-002-block-editor-spike.md) | Block editor spike: Slate/Plate vs Tiptap | spike | critical | done | D18 |
| [BL-003](./items/BL-003-dev-ci-pipeline.md) | Dev CI pipeline (GitHub Actions) | infra | medium | done | — |

### M1 — Spec engine core (the load-bearing layer)
_Typed store + single validated mutation path. Nothing else is real without this._

| ID | Title | type | prio | status | decisions |
|----|-------|------|------|--------|-----------|
| [BL-010](./items/BL-010-typed-block-tree.md) | Typed block-tree data model | feature | critical | done | D1, D5 |
| [BL-011](./items/BL-011-spec-engine-mutation-api.md) | Spec engine: validated mutation API | feature | critical | done | D2 |
| [BL-012](./items/BL-012-global-stable-ids.md) | Global stable ID scheme | feature | high | in-progress | D5, D13 |
| [BL-013](./items/BL-013-dependency-graph-model.md) | Dependency graph + edge taxonomy | feature | high | done | D5, D9 |
| [BL-014](./items/BL-014-write-time-cycle-checks.md) | Write-time cycle checks | feature | medium | done | D24 |
| [BL-015](./items/BL-015-triad-templates-in-store.md) | Default triad + editable templates in store | feature | medium | backlog | D17 |
| [BL-016](./items/BL-016-wire-engine-into-app.md) | Wire spec engine into the app (Caller A) | feature | high | done | D2 |

### M2 — Persistence (external local store)
_The structured store IS the durable record, persisted to a local SQLite DB (D30). No Git projection._

| ID | Title | type | prio | status | decisions |
|----|-------|------|------|--------|-----------|
| [BL-020](./items/BL-020-hybrid-markdown-projection.md) | SQLite store: schema + persistence (load / write-through) | feature | high | in-progress | D30 |
| [BL-021](./items/BL-021-parse-back-confirmation.md) | Parse-back path — RETIRED (superseded by D30) | feature | high | deferred | D30 |
| [BL-022](./items/BL-022-in-repo-storage-rehydration.md) | Local store lifecycle (open / load / migrations) | feature | high | in-progress | D30 |

### M3 — Editor integration (authoring UI)
_Adopt an editor via adapter; its doc model is a projection of the store._

| ID | Title | type | prio | status | decisions |
|----|-------|------|------|--------|-----------|
| [BL-033](./items/BL-033-react-ui-foundation.md) | React UI foundation & component system | feature | high | done | D18, D21 |
| [BL-034](./items/BL-034-component-workshop-ladle.md) | Component workshop & docs (Ladle) | infra | medium | done | D18 |
| [BL-035](./items/BL-035-impl-session-workspace-shell.md) | Implementation-session workspace shell (resizable panes) | feature | high | done | D7, D20, D21 |
| [BL-036](./items/BL-036-directory-file-tree.md) | Directory panel (repo file tree) | feature | high | done | D21 |
| [BL-037](./items/BL-037-read-first-code-editor.md) | Read-first code editor (CodeMirror 6) | feature | high | done | D20, D21, D31 |
| [BL-038](./items/BL-038-spec-task-projection-panel.md) | Spec/task projection panel (read-only) | feature | high | done | D1, D7, D30 |
| [BL-039](./items/BL-039-agent-surface.md) | Agent surface (chat skeleton) | feature | high | done | D7, D8 |
| [BL-030](./items/BL-030-editor-adapter.md) | Editor adapter: doc model as store projection | feature | high | backlog | D18, D2 |
| [BL-031](./items/BL-031-containment-editing-ux.md) | Containment editing UX (nesting, drag-drop) | feature | medium | backlog | D5 |
| [BL-032](./items/BL-032-custom-block-types.md) | Custom block types incl. deferred-decision node | feature | medium | backlog | D6, D17 |

### M4 — Context management (the product core)
_The scoped-context builder and the graph as a context tool, not decoration._

| ID | Title | type | prio | status | decisions |
|----|-------|------|------|--------|-----------|
| [BL-040](./items/BL-040-scoped-context-builder.md) | Scoped-context builder (LOD renderer) | feature | critical | backlog | D10 |
| [BL-041](./items/BL-041-importance-model.md) | Importance model (derived floor + assigned boost) | feature | high | backlog | D12 |
| [BL-042](./items/BL-042-deferred-decision-lifecycle.md) | Deferred-decision node lifecycle | feature | high | backlog | D6 |
| [BL-043](./items/BL-043-focused-graph-view.md) | Focused graph view (reuses LOD renderer) | feature | medium | backlog | D22 |
| [BL-044](./items/BL-044-whole-project-graph.md) | Whole-project graph (optional view) | feature | low | backlog | D22 |

### M5 — Agent orchestration
_MCP as the second caller; the app layer owns isolation & role enforcement._

| ID | Title | type | prio | status | decisions |
|----|-------|------|------|--------|-----------|
| [BL-050](./items/BL-050-mcp-adapter.md) | MCP adapter over the spec engine | feature | high | backlog | D2 |
| [BL-051](./items/BL-051-byok-provider-auth.md) | BYOK provider-agnostic auth | infra | medium | backlog | D8 |
| [BL-052](./items/BL-052-orchestration-triggers.md) | Orchestration layer + deterministic isolation triggers | feature | high | backlog | D8 |
| [BL-053](./items/BL-053-session-membrane.md) | Spec vs. implementation session isolation (membrane) | feature | high | backlog | D7 |
| [BL-054](./items/BL-054-role-aware-api-gating.md) | Role-aware API gating (permissions) | feature | high | backlog | D24 |
| [BL-055](./items/BL-055-agent-deferred-decision-behavior.md) | Agent behavior on deferred decisions (halt/continue) | feature | medium | backlog | D16 |
| [BL-056](./items/BL-056-edge-authoring-flows.md) | Edge authoring flows + hard-edge human confirm | feature | medium | backlog | D23 |

### M6 — Review & PR integration
_Close the loop with Git-native review; the coherence reviewer is the safety net._

| ID | Title | type | prio | status | decisions |
|----|-------|------|------|--------|-----------|
| [BL-060](./items/BL-060-coherence-review-role.md) | Read-only coherence review role | feature | high | backlog | D11 |
| [BL-061](./items/BL-061-pr-inline-spec-diff.md) | App-native spec diff/review (from store history) | feature | medium | backlog | D13, D30 |
| [BL-062](./items/BL-062-traceability-pr-to-nodes.md) | Traceability: PR/commit ↔ task nodes | feature | high | backlog | D13 |
| [BL-063](./items/BL-063-agent-spec-updates-from-comments.md) | Agent proposes spec updates from PR comments | feature | medium | backlog | D13 |
| [BL-064](./items/BL-064-task-completion-merge-gate.md) | Task-completion merge gate (spec drives CI) | feature | medium | backlog | D13 |

---

## Deferred decisions (backlog-level, D6)

Parked questions surfaced by items above — captured now, resolved later. Not gating
unless promoted to a hard edge on a specific item.

| ID | Question | surfaced by | edge | trigger to resolve |
|----|----------|-------------|------|--------------------|
| DD-1 | Fan-in = direct in-degree vs. transitive descendant weight? (O17) | [BL-041](./items/BL-041-importance-model.md) | soft | real graph data shows direct in-degree misses true keystones |
| ~~DD-2~~ | Final block-editor pick (Slate/Plate vs. Tiptap) | [BL-002](./items/BL-002-block-editor-spike.md) | hard → M3 | **RESOLVED (2026-07-08) → Tiptap** (ProseMirror): both passed Korean IME, so schema-validity (D2), maturity, and custom-block scaling decided it. See [[D18]]. Unblocks [[BL-030]]. |
| DD-3 | PM participation model (async web surface vs. stays PR-comments-only) | [BL-011](./items/BL-011-spec-engine-mutation-api.md) | soft | post-v1, once dev-centric core ships (D20) |
| DD-4 | Production CSP hardening (drop dev `'unsafe-inline'`, set via main-process headers) | [BL-033](./items/BL-033-react-ui-foundation.md) | soft | before first release |
| ~~DD-5~~ | Engine runtime placement (main+IPC vs. in-renderer) | [BL-011](./items/BL-011-spec-engine-mutation-api.md) | soft | **RESOLVED by D30** → main process (engine + SQLite), renderer via IPC |
| DD-6 | Tokens-only lint (ban arbitrary Tailwind values, Rule 4) | [BL-033](./items/BL-033-react-ui-foundation.md) | soft | when a Tailwind-v4-compatible rule exists |
| DD-7 | Monorepo layout + Vite+ as task runner (if project splits into app/engine/mcp-adapter packages) | [BL-050](./items/BL-050-mcp-adapter.md) | soft | when a 2nd package appears |
| ~~DD-8~~ | Spec on-disk format: hybrid md vs. json? | [BL-020](./items/BL-020-hybrid-markdown-projection.md) | soft | **MOOT — RESOLVED by D30**: no committed text form (SQLite store); the question disappears |
| DD-9 | Impl-session spec-panel scope: assigned tasks only vs. full scoped-context slice (D10) | [BL-035](./items/BL-035-impl-session-workspace-shell.md) | soft | when the scoped-context builder (BL-040) lands |
| ~~DD-10~~ | Editor engine: CodeMirror vs. Monaco | [BL-037](./items/BL-037-read-first-code-editor.md) | soft | **RESOLVED → D31**: CodeMirror 6 (bundle, token rules, Vite/Electron fit, read-first) |
| ~~DD-11~~ | Spec-subtree promotion trigger (manual vs. auto-suggest) | [BL-031](./items/BL-031-containment-editing-ux.md) | soft | **MOOT via D30**: no per-spec files, so no file promotion; drill-down UI survives without it |

---

_Derived from brainstorm session 1 (D1–D24). Update this index when items change milestone/status;
keep per-item detail in `items/`._
