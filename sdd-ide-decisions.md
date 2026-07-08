# Spec-Driven Development IDE — Decision Log

_A living record of decisions made while brainstorming. Working title: TBD._
_Reference product being improved upon: Kiro (AWS)._

---

## 0. Core Thesis

Kiro treats **markdown-as-source-of-truth**: the `.md` file *is* the spec, and the
agent literally reads and text-edits `requirements.md` / `design.md` / `tasks.md`,
including fragile `- [ ]` / `- [x]` checkbox syntax.

**Our bet:** invert this. A **typed, structured block tree is the source of truth**
(Notion-style). Both the human UI and the LLM agent mutate that store through the
**same validated API** — never by parsing or editing text. Text is never a source of truth
and never a write path. (Session 3, D30: the store persists to a local DB and is itself the
durable record — there is no committed text projection at all.)

The pain this targets: agents and tools today "read and update markdown, not using an
API" — brittle, drift-prone, and opaque.

---

## 1. Decisions Locked

### D1 — Source of truth: structured store drives everything; the store IS the durable record (AMENDED by O19, RE-AMENDED by D30)
- Internal representation is a **typed block tree**, not text. The store drives everything
  in the IDE.
- **Mutation invariant (unchanged, load-bearing):** truth changes *only* through structured
  API mutations (D2). The agent NEVER text-edits; there is no text write path. This half of
  D1 is inviolable.
- **Durability (RE-AMENDED per D30 — externalized local store):** the **structured store IS
  the durable record**, persisted to a local per-project database (SQLite). There is no
  committed text projection and no rehydration-from-Git. This restores D1 to its purest form —
  the store is both the working truth and where truth durably lives — with the mutation
  invariant unchanged. (Superseded: the O19 Git-native text-projection model — see D30.)
- **What O19 gave up vs. kept:** gave up "the store is the *only* place truth lives"; kept
  "structured mutation is the *only* way truth changes." The membrane (D7), single mutation
  path (P2), and no-text-write-path rule all remain intact — only the *location of
  durability* moved, not the *mechanism of mutation*. **D30 reclaims what O19 gave up** — with
  the external store, the store is again the sole home of durable truth; only the *mechanism*
  (structured-mutation-only) was ever inviolable, and it still is.
- Original rationale still holds for the mutation invariant: eliminates parse/serialize
  drift on the *write* path; the agent has no text escape hatch.
- ⚠ Historical note: pre-O19, D1 read "store is sole truth, text only a read-only
  projection." O19 (session 1) revised durability to Git-native (D15, D14, O18). **D30
  (session 3) reverses that** — specs externalize to a local store; the store is the durable
  record again. D14/D15/D29 superseded.

### D2 — Component role: ONE shared spec engine, TWO callers
- Build a single **spec engine** with a typed, validated API (the "database access
  layer" of the app).
- **Caller A — Internal (in-process):** the IDE's Notion-like UI calls the engine
  directly (e.g. `spec.moveTask(id, newParent)`). Synchronous, typed, fast, LLM-agnostic.
- **Caller B — MCP adapter:** the LLM agent reaches the *same* operations as MCP tools
  (e.g. `update_task(id, status:"done")`). The agent takes structured actions instead of
  emitting text to be parsed.
- **Consequence (important):** the agent gets **no privileged data path**. Every
  mutation — human or AI — goes through the same API + validation. This is what makes
  D1 real rather than aspirational.

### D3 — Primary audience (v1): teams where PMs and devs share specs
- Not enterprise-compliance-first, not solo-only.
- Implication: the spec must be legible/editable to non-devs (Notion familiarity is an
  asset here) AND wire cleanly into the dev workflow.

### D4 — PR review integration is in scope
- Specs must connect to pull-request review.
- Session-1 framing forced a diffable text projection (→ O1/D14). **D30 supersedes that** —
  no text projection; review is app-native (rendered from store history, linked to PRs by
  stable ID). See D30 / D13 #1.

### D5 — Two distinct relations over the same nodes: containment AND dependency
- **Containment (hierarchy):** the Notion-style nesting tree — "what is this spec made
  of." Answers structure/templating/drag-drop.
- **Dependency (graph):** a *separate* directed graph over the same item IDs — "what
  blocks what." Orthogonal to the hierarchy; edges routinely cut across the tree and
  across files.
- These are kept **conceptually separate on purpose** to stop the UI becoming a hairball.
  Obsidian models ~one graph (links); Notion has hierarchy but no dependency graph; Kiro
  has flat tasks with invisible, auto-derived, non-durable ordering ("waves"). Doing
  **both, explicitly, cross-file** is the product wedge.
- **Cheap only because of D1/D2:** every item already has a stable global ID, so a
  dependency is just an edge record `{from, to, type}`. Cross-file is free because IDs
  are global, not file-scoped. Checkbox/item-level cross-file dependencies fall out
  naturally — they are NOT a text convention inside `- [ ]` lines.
- Visualization: graph view in the spirit of Obsidian, but rendering the *dependency*
  edges (and optionally containment as a second layer), not just wiki-links.

### D6 — "Deferred decision" is a first-class node type (the sharpest primitive)
- Motivating pain: mid-task, a decision surfaces ("how do auth tokens rotate?") that
  would **pollute the current working context** if resolved now. Today you either
  rabbit-hole (lose your thread) or drop a bare `TODO` (lose the context that made it
  matter).
- Primitive: capture the decision **at the moment it surfaces**, together with its
  originating context and a dependency edge to whatever it blocks; park it *out of the
  active view*; surface it in the dependency graph as an unresolved blocker.
- **Decision:** model it as its **own node type** with a lifecycle (open → resolved;
  blocks-until-resolved), NOT merely a tag on a generic block — because it earns distinct
  treatment in the graph, in agent behavior, and in the UI.
- **Guiding principle (P4 below):** the graph is a **context-management tool, not just a
  visualization.** Deferral exists to protect the human's and the agent's working context
  from decisions that don't need resolving yet. This is the same concern that justifies
  building an SDD tool at all: governing what the agent attends to.

### D7 — The store is the membrane: only committed structured state crosses role boundaries
- Spec-writing and implementation are **opposite epistemic modes**: spec = divergent/
  abstract (breadth, intent, edge cases); implementation = convergent/concrete (depth on a
  narrow slice, existing conventions). Co-mingling their context degrades both.
- Three pollutions to prevent:
  - **Down→up:** implementation detail leaks into the spec → spec describes the code
    instead of the intent. (This is the documented Kiro failure: spec repetitive with code.)
  - **Up→down:** spec deliberation leaks into code → second-guessing settled decisions,
    over-engineering.
  - **Task→task:** residue from one task biases an unrelated task.
- **Rule:** run the two as **separate agent sessions**; the structured store (D1) is the
  *only* thing that passes between them. Deliberation stays in its session and dies there;
  only committed structured state crosses the membrane. Implementation findings escape
  *up* only as structured nodes (e.g. a deferred-decision node, D6) via the API (D2) —
  never as inline spec edits.
- **The dependency graph doubles as a context relevance filter (D5):** "what does this
  task need to know" is a graph traversal (task + acceptance criteria + design nodes in its
  dependency neighborhood), NOT "load all spec files" (Kiro's verbose `#spec` behavior).
- **Strongest form:** neither agent holds the store in-context; they query it through the
  API/MCP for exactly what they need. The store is external memory, not loaded context —
  only possible because we chose structured-over-markdown.
- **Tension to hold:** total isolation costs *coherence* (an isolated implementer can
  satisfy a task's letter while missing intent). The craft is finding the **minimal spec
  slice** that keeps implementation faithful to intent without inheriting the deliberation
  that produced it. That slice = acceptance criteria + dependency-neighborhood design.

### D8 — Orchestration authority lives in the app layer; native subagents are an accelerator, not a dependency
- Context isolation ("subagent-like" behavior) is **not a model capability** — it reduces
  to: a fresh call with scoped context + constrained tools, whose output is summarized
  back. Any chat-completions endpoint can be driven this way (portable across BYOK
  providers).
- **The isolation guarantee comes from whoever constructs the context window.** In the
  BYOK design that's *our app*, not the model. A model can't pollute a context it was never
  handed.
- **Decision:** the *policy* of when to isolate lives in our orchestration layer, not in
  the model's own delegation routing (which is heuristic and not reliably enforceable).
  Our app intercepts the triggering event and programmatically spawns the scoped session.
- **Claude Code specifics:**
  - Tool/permission boundaries on subagents are **hard-enforced** — a real wall (maps to
    D2: can make it structurally impossible for the impl agent to edit specs directly).
  - *Delegation itself* is description-matching, NOT guaranteed — so don't rely on the LLM
    choosing to isolate; drive it explicitly from our layer.
  - Native subagents = optional accelerator when the user is on Claude; not an
    architectural dependency.
- **Triggers are our events, deterministic:** deferred-decision emitted, backlog spec
  touched, task handoff — not the agent noticing it should delegate.
- **The scoped-context builder is the real product primitive** — same component regardless
  of provider or of whether a native subagent exists. It answers "what minimal slice does
  this isolated job need" = the D5 dependency-graph traversal.
- **Tension to hold:** native Claude Code subagents give hard tool-permission enforcement
  for free; hand-rolled orchestration over a raw API does not. Either re-implement those
  rails once in our orchestration layer (portable, more work) or use native subagents on
  Claude and approximate elsewhere (less portable, uneven guarantees). *Leaning:
  re-implement in our layer, to keep the BYOK promise uniform.*

---

## 2. Derived Principles (follow from the above)

- **P1 — Text is a lens, never the substance.** Every text form (markdown, diff view,
  agent context dump) is generated from the store on demand and is read-only.
- **P2 — Single mutation path.** UI and agent share one API surface. No component may
  bypass validation.
- **P3 — Structured-first UX.** Drag/drop, nesting, templates, progressive disclosure
  ("hide too much detail") are first-class because the data is structured, not because
  we're prettifying text.
- **P4 — The graph is a context-management tool, not decoration.** Dependency edges and
  deferral exist to govern what the human and the agent attend to at any moment — not
  merely to document or to look pretty. Every graph/graph-view feature should be judged
  by "does this help defer/focus/unblock?" not "is this a nice diagram?"
- **P5 — Containment ≠ dependency.** Never conflate the nesting tree with the blocking
  graph, in data model or in UI. Two relations, same nodes.
- **P6 — The store is the membrane.** Only committed structured state crosses between
  agent roles/sessions. Working context (deliberation, code read, errors) never crosses.
- **P7 — We construct the context, so we own isolation.** Isolation is guaranteed by the
  orchestration layer building each scoped window — not by trusting the model to delegate.
  Provider-agnostic by construction.

---

## 2b. Decisions Locked (session 1, cont.)

### D9 — Edge taxonomy: blocks / relates / informs / supersedes, split into hard vs. soft
- Four edge types, but they fall into **two behavioral classes** that the context builder
  treats differently:
  - **Hard edges — `blocks`, `supersedes`:** change what a session is *allowed* to do.
    `blocks` = target must resolve first; `supersedes` = source is live, target is dead.
    **Never silently dropped** from context — omitting them causes *wrong* behavior
    (building against a superseded design, or acting on a still-blocked task).
  - **Soft edges — `relates`, `informs`:** change what a session *should be aware of* but
    don't gate action. **Eligible for summarization/collapse** when volume is high;
    dropping one degrades quality gradually, not catastrophically.
- This hard/soft split is what makes D10's level-of-detail model *safe* rather than lossy.

### D10 — Scoped context is a level-of-detail RENDERER, not a depth-cutoff filter
- Rejected: "N-hop cutoff" (dumb — drops important distant nodes while keeping trivial near
  ones). Replaced with a **fidelity-decays-with-distance** model that never culls
  importance:
  - **Direct neighbors → full detail.**
  - **Distant nodes → summarized** (not dropped).
  - **Important nodes → always surfaced at meaningful fidelity, regardless of distance.**
    "Not skipping important nodes." Importance **overrides** distance.
- Mental model: game-engine level-of-detail — near objects high-poly, far objects
  billboarded, but the landmark mountain is never culled. This is the **agent-facing
  version of the Notion "hide too much detail" progressive disclosure** (P3).
- **Visibility is a user-facing option**, not a fixed constant: the user can adjust how
  much surrounding context is shown/injected, with a sensible default.
- One primitive, three consumers: the **same scoped-context builder** serves the
  spec-writer, the implementer, and the reviewer (D11) — each gets a different slice/view
  of the same graph.

### D11 — Coherence check = a separate READ-ONLY review role holding both spec + code, scoped by D10
- **Problem it solves:** D7's membrane deliberately blinds the implementer to
  intent-beyond-its-slice → faithfulness-to-intent *cannot* be checked from inside the
  implementation session. The check must live in a role allowed to hold both sides.
- **Decision:** a dedicated **read-only review role** that receives the task's slice
  *including the intent nodes the implementer was denied* + the produced code, and reports
  drift. Read-only ⇒ seeing both sides pollutes nothing (no downstream artifact to
  contaminate).
- **Why not the alternatives:**
  - Generic "verify against acceptance criteria" catches *contract* violations, misses
    *intent* violations (the drift isolation actually introduces).
  - Human-only-at-PR is necessary but insufficient alone — dumps full coherence burden on a
    human reading a diff (the Kiro review-fatigue failure). The machine reviewer's job is to
    produce a *focused* drift signal ("deviates from design node X here"), not replace the
    human.
- **Reuses D10:** the reviewer is just another consumer of the scoped-context builder.
  O15's answer is built from O13's primitive — not a separate mechanism.
- **Gated for cost/latency:** the review invocation is a third agent call per task, so it's
  **optional and gated** — cheap tasks skip it; high-stakes / high-fan-in nodes (many
  dependents) get it. The gating criteria are themselves graph queries (in-degree, edge
  types) → reuses the substrate again.

### D12 — Importance = derived floor + assigned boost (composite)
- Resolves what "important" means in D10's importance-overrides-distance rule. Two signal
  classes, deliberately kept separate because they fail differently:
  - **Derived (the floor) — structural, automatic:**
    - **Hard-edge reachability** (D9): any node reachable from the task via `blocks` /
      `supersedes` is important however far. (Wrong to omit ⇒ always surfaced.)
    - **Fan-in / load-bearing-ness:** "many nodes depend on a single ancestor" = keystone.
      The graph flags keystones without anyone marking them.
  - **Assigned (the boost) — explicit, intentional:** star / high-priority set by human or
    agent. Direct signal that can't be inferred.
- **Why both:** assigned is trustworthy but *forgettable* (people don't star what they
  should); derived is automatic but *noisy* (high in-degree for boring reasons). Assigned
  boosts on top of a derived floor ⇒ graph catches what humans forget, humans catch what
  the graph can't see. Neither failure mode is fatal.
- **Deferred decisions (D6) are NOT auto-important** — they count as important **only when
  they block the current task's path** (i.e. reachable via `blocks` per D9). This keeps
  deferral honest: parked decisions stay parked and out of context (D7) unless they're a
  live blocker for *this* session. O16b folds into D9's hard-edge traversal — not a new
  rule.
- **Open sub-point (O17):** "fan-in" = direct in-degree vs. transitive descendant count.
  Keystone intuition is usually *transitive* (downstream weight), but this is a real
  modeling choice — see O17.

### D13 — PR integration: all four behaviors, ordered by escalating format demand
- **REWORKED by D30 (externalized store):** specs no longer live in Git, so the behaviors
  re-anchor. #1 spec-diff becomes **app-native** — the IDE renders spec change diffs from the
  store's own history, not a Git text diff. #2 traceability and #4 merge-gate are **unchanged
  and strengthened** — they always worked by stable-ID references from commits/PRs to store
  nodes (like `#123` links an issue), needing no in-repo files. #3 stays (PR comment = input
  signal → structured mutation, D2) but writes to the store directly, so there is no text
  round-trip. The format-legibility demands that *ordered* these four are moot (D14 retired).
- Adopted (in ascending order of what each demands of the committed format):
  1. **Spec-diff inline in the PR** (review specs like code). Demands only: text form is
     legible when diffed. Lowest bar.
  2. **Traceability: PR/commits ↔ spec task nodes.** Demands **stable, durable node IDs**
     that survive edits/reordering/rewrites. ⇒ kills any ID-less text form. *This single
     requirement resolves the hard part of O1.*
  3. **Agent proposes spec updates from PR review comments.** Demands a **safe, round-
     trippable** text→store path. PR comment is an *input signal*, NOT a write path — agent
     emits a structured mutation (D2); markdown re-projects. Keeps the membrane (D7/P1).
  4. **Task completion gates merge (spec drives CI).** Demands spec state **queryable in
     CI** — merge check reads "all blocking tasks for this PR complete?" More an O2/graph-
     query requirement than a serialization one.
- **Takeaway:** choosing #2 already made stable IDs non-negotiable, pre-deciding O1's core.

### D14 — Committed text form = hybrid: human markdown + embedded stable IDs (LOCKED via O18) — SUPERSEDED by D30
- **SUPERSEDED by D30.** With the spec store externalized (no committed text projection),
  there is no committed text form to format — this decision, and DD-8 (its reopening), are
  moot. Retained for history.
- Given IDs are mandatory (D13 #2), the O1 field collapses:
  - ✗ **Deterministic markdown, no IDs** — eliminated; can't carry identity ⇒ fails
    traceability (#2) and round-trip (#3).
  - ✗ **Canonical block format w/ IDs** — robust + queryable, but noisy in a diff; optimizes
    for machine at the human reviewer's expense — backwards for a *review* artifact.
  - ✓ **Hybrid: readable markdown prose + unobtrusive embedded ID anchors** — satisfies
    legible review (#1), persistent identity (#2), and (with a disciplined parser) safe
    round-trip (#3).
- **The hybrid's whole risk = parse-back fidelity.** It reintroduces a text→store path,
  exactly what D1 avoided. Kept consistent with D1/P1 by: committed markdown is *still only
  a projection*; the store stays truth; PR comments are input signals, not writes.
- **Reviewer-edits-markdown (RESOLVED → O18): parse-back + IDE confirmation.** A reviewer's
  PR edit to the committed markdown is legitimate (it's a commit to the durable record per
  O19), so it is NOT rejected — but it does NOT silently mutate the working store either. It
  surfaces in the IDE for **human confirmation before landing**. Rationale: parse-back is
  the one fidelity-risk surface, so gate *that path specifically* with a checkpoint —
  contains the risk where it lives without adding friction elsewhere. Silent parse-back
  risks invisible corruption; full rejection contradicts O19; confirmation is the minimal
  guard respecting both.

### D15 — Specs live in-repo, alongside code (LOCKED via O19) — REVERSED by D30
- **REVERSED by D30.** Specs no longer live in-repo. The tension this decision papered over —
  issue-tracker-shaped (mutable, relational, stateful) data forced through Git's versioned-text
  grain — is resolved by externalizing the store (local SQLite), referenced from Git by stable
  ID. Branch-scoped specs (this decision's raison d'être) are given up deliberately for global
  tracker semantics. Retained for history.
- Chosen over external-store-synced and dedicated-branch because **all four D13 behaviors
  are Git-native** (PR diffs, commit traceability, CI gating). Putting canonical data
  outside Git then syncing back means re-solving branching/merging/versioning Git already
  solves. External-store's fatal flaw: specs that don't branch with the code lose the thing
  that makes in-repo specs valuable ("which spec version matches *this* branch?").
- This is **the one place Kiro's architecture is right** — while still rejecting its
  source-of-truth model.
- **The D1 bend (RESOLVED by O19 — SeungBin accepted, full Git-native):** the committed text
  projection is the durable record; the store is a rehydratable working layer. D1 amended
  accordingly. The mutation invariant (structured-only writes) is preserved — see amended
  D1 for exactly what was given up vs. kept.
- **Why this strengthens rather than weakens the thesis:** the original complaint
  ("markdown as API-less blob the agent text-edits") is untouched — the agent still mutates
  only via API; only *durability location* changed, not *mutation mechanism*.

### D16 — Agent behavior on hitting a deferred decision: edge type gates halting; per-project threshold gates initiative (O10/O10b)
- **First observable expression of the context-management thesis** — the moment a user feels
  whether the model works.
- **Halting (O10) — decided by edge type, reusing D9's hard/soft split (no new machinery):**
  - **Hard edge** (`blocks`/`supersedes`) to an unresolved decision → the session genuinely
    can't proceed correctly → **STOP and surface**.
  - **Soft edge** (`relates`/`informs`) → context-worthy but not gating → **CONTINUE and
    surface**.
  - This is the payoff of splitting edges by behavioral class in D9 — the split was doing
    latent work; O10 cashes it out.
- **Initiative (O10b) — for the soft-edge CONTINUE cases, a per-project threshold governs
  how much the agent does on its own:**
  - High threshold (conservative project) → agent merely *notes* the soft decision and
    proceeds, resolves nothing itself.
  - Low threshold (fast-moving project) → agent *proposes a tentative resolution* as it
    goes and flags it for later review.
- **Clean division of labor (resolves the O10/O10b tension):** *edge type gates halting; the
  threshold gates initiative.* The threshold governs initiative on **non-blocking**
  decisions only — it must **never** let a project setting auto-resolve a hard block (that
  would reopen the context-pollution risk the hard-edge stop protects against).
- **Initiative-escalation (O20 — RESOLVED): only EXPLICIT importance forces escalation.**
  A soft-edge decision on a **starred/priority** node (explicit signal, D12) escalates to
  human even under a low/fast threshold. **Derived** importance (fan-in) does NOT force
  escalation — it's noisy, and forcing human intervention on noisy auto-inference hurts
  predictability. Principle: for *forced human intervention*, trust only explicit signals;
  reserve derived signals for softer uses.
- **Signal-strength-by-use (emergent principle):** the same D12 importance splits by
  consequence — derived (fan-in) is fine for **D10 context rendering** ("what to show") and
  **D11 review gating**, but for **D16 forced escalation** ("pull the human in") only
  explicit signals qualify. Stronger action ⇒ stricter signal.

### D17 — Spec schema: fixed default triad, templates user-editable (O5)
- **Default triad kept:** requirements → design → tasks (Kiro-proven mental model). Gives
  beginners a validated starting structure — avoids the "blank canvas" problem of fully
  generalized templates.
- **Templates are user-editable**, so power users can adapt to workflows the triad doesn't
  fit (pure research, spikes, bugfix variants). Matches SeungBin's original "fixed
  templates" feature ask.
- **Consequence (ties to D1):** an editable template is *itself structured data that defines
  structure* — it must live in the **store**, not as a markdown file. Same
  structured-first rule as specs. Connects to O4 (editor must render/edit template
  definitions too).

### D18 — Editor: adopt (not build), ProseMirror/Slate family — final pick via prototype spike
- **Resolution (O4): prototype-spike both finalists (Slate/Plate and Tiptap), decide from
  evidence.** The flexibility-vs-stability tradeoff and the Korean-IME risk can't be settled
  on paper. Spike is a *decision tool*, scoped to 3 targeted checks (not "build both and see
  how it feels"):
  1. **Korean IME composition handling** — does block mutation / cursor movement break mid-
     composition? If Slate breaks here, Slate is out and the debate ends. (Highest-priority
     check — it's the whole reason Slate's beta status is a risk.)
  2. **Friction adapting our data model** — implement a minimal adapter making the editor's
     doc model a projection of the store (D1), edits flowing via the API (D2). Verify whether
     Slate's schema-less core is genuinely lower-friction and whether ProseMirror's strict
     schema genuinely "fights" us (D5/D14).
  3. **Custom block types** — can each render/edit our own blocks (e.g. deferred-decision
     node, D6)? Extends to D17's template system.
  - Everything else (perf, bundle size) is noise at this stage — ignore for the spike.
- **How prior decisions constrain this (the real framing, not "which is prettiest"):**
  - Every off-the-shelf editor has its *own* document model (Tiptap = ProseMirror JSON;
    Lexical = own nodes). Since store is truth (D1) with two relations (D5), global IDs, and
    a hybrid committed projection (D14), any editor forces an **adapter** between its model
    and ours. O4's real question = *how much editor convenience to take vs. how much data-
    model ownership to keep.*
  - The **dependency graph is not the editor's job** (D5): editors do containment (nesting);
    dependency is a separate graph we build regardless. So we only need the editor for
    **block-tree / containment editing** — narrows the requirement.
- **Path evaluation:**
  - ✗ **Build custom** — block editors are notoriously hard (cursor/selection/IME — note:
    Korean IME composition matters for SeungBin). Our differentiation is the data model +
    context management, NOT a better text-editing engine. Months spent here buy no edge.
  - ✓ **Adopt + adapter (leaning)** — editor handles containment editing only; all mutations
    flow to the store via the API (D2); the editor's doc model is treated as a *projection*.
    Cleanly consistent with D1 (store is truth, editor is just an editing surface).
  - ✗ **Fork** — maintenance burden too high for v1; revisit only if a hard constraint
    surfaces.
- **Candidate narrowing → ProseMirror family (Tiptap / BlockNote) over Lexical:**
  - Lexical's documented weakness — no pure decorations ⇒ collab cursors drawn as DOM
    overlays, collaboration harder — is directly bad for O6 (multiplayer, already on the
    roadmap). ProseMirror family has mature pure decorations + Yjs (CRDT) collab.
  - **Tiptap vs. BlockNote = adapter-surface tradeoff:** BlockNote ships the Notion UX
    (slash menu, drag-drop, nesting) out of the box → faster, but "abstraction on an
    abstraction" limits deep customization when forcing our data model in, and some features
    are paid. Tiptap is lower-level → we control the adapter more precisely, which is worth
    it given non-standard needs (D5/D14).
  - **Candidate landscape (expanded, 3 families):**
    - **ProseMirror family (Tiptap / BlockNote):** schema-based, mature, pure decorations,
      IME-tested. Strict schema ⇒ may "fight the library" when forcing our non-standard
      model (D5/D14) in.
    - **Slate family (Slate / Plate):** **schema-less** nested-tree core (JSON) — natural fit
      for containment (D5) and least friction forcing our non-standard model in;
      operation-based, collaboration-ready by design (aligns with D19's "add later"). Plate
      = headless plugins + shadcn/ui components (Slate:Plate ≈ Tiptap:BlockNote). **Risk:
      Slate is still beta**, some APIs unfinalized → IME (Korean composition — matters for
      SeungBin) less proven ⇒ real production risk.
    - **Editor.js:** pure block JSON, clean content/presentation split — superficially closest
      to store-as-truth, BUT each block is an independent contenteditable ⇒ weak *cross-block*
      editing (cursor traversal, selection across blocks). Bad for smooth spec editing.
      Eliminated.
  - **The real tradeoff (post-D20 dev-centric lens):**
    | Axis | ProseMirror (Tiptap) | Slate/Plate |
    | --- | --- | --- |
    | Data-model flexibility | strict schema, possible friction | schema-less, free for non-standard model |
    | Maturity / stability | high, IME-proven | beta, some APIs unfinalized |
    | Add collab later | Yjs mature | operation-based, designed for it |
    | Batteries-included UX | BlockNote | Plate |
  - **Claude's lean (advisory, split):** data-model-ownership-first → **Slate** (schema-less
    least-friction for D5/D14, accept beta risk); stability/IME-first → **Tiptap** (safe).
    D20's "control-first" direction aligns more with Slate, but Tiptap carries lower
    production risk. **SeungBin's call on the flexibility-vs-stability weight.**
- **RESOLVED (2026-07-08, spike [[BL-002]]) → Tiptap (ProseMirror). Resolves DD-2.** The
  side-by-side prototype settled it from evidence:
  1. **Korean IME (make-or-break):** *both* handled Korean composition cleanly — no dropped/
     doubled jamo, cursor stable mid-composition, incl. inside the custom block. The check
     that would have killed Slate ("if Slate breaks here, Slate is out") did **not** fire.
  2. **Adapter friction:** Slate is lower-friction (its value *is* a block list with native
     ids); Tiptap needs a grafted `blockId` + whole-doc reconcile. Real, but a one-time cost
     paid once in the BL-030 adapter — not an ongoing tax.
  3. **Custom blocks:** both work; Tiptap's is a schema-validated node + NodeView, Slate's a
     lightweight element.
  - **Why Tiptap wins once IME ties:** the deciding axes become the ones the spike scoped out.
    (a) **Schema alignment with the thesis** — ProseMirror's strict schema enforces document
    validity *by construction*, the same principle as the constrained mutation API (D2/P2);
    Slate is schema-less and permits invalid intermediate states you must normalize. (b)
    **Load-bearing core** — the editor underpins all of M3; a mature library beats a still-0.x
    beta one. (c) **Many custom block types + templates (D17)** scale better on validated
    NodeViews. (d) Mature Yjs collab keeps D19/O6 open. Slate's flexibility is precisely the
    non-determinism the product removes elsewhere — so it's the wrong kind of "free."

### D19 — Drop real-time collaboration for v1; Git async collaboration only (O6)
- **Two collaboration layers, deliberately keeping only one:**
  - **Async (Git, D15):** commit/PR-unit, time-shifted, human-resolved merges. KEPT — it's
    PR review, traceability, CI gating.
  - **Real-time (CRDT, was O6):** keystroke-unit, synchronous co-editing. **DROPPED for v1.**
- **What dropping it saves (a whole execution-layer stack, not just one feature):** CRDT
  data structures, a sync server (Hocuspocus-class), presence, offline re-sync — all out of
  v1.
- **The foundation stays CRDT-ready:** because store is structured truth (D1), all writes go
  through the API (D2), and every block has a global ID, real-time collab can be *added
  later* without re-architecting. Deferred, not designed out.
- **⚠ Reopens a D3 tension (O21 — needs SeungBin):** real-time was the answer to "PMs don't
  use Git" (the documented Kiro pain). Dropping it doesn't remove that problem. Two
  consistent readings:
  - **(A) Keep D3, redefine as *sequential* sharing:** PM edits async via the web surface on
    their turn → flows to commit/PR. Participation without concurrency.
  - **(B) Narrow v1 to dev-centric:** without real-time, PM-participation friction is high
    enough that PMs engage mainly via PR review comments; D3's priority shifts.
  - Must pick to keep "who is this for" sharp.
- **Side effect on O7:** dropping CRDT sync/presence removes a force that favored heavier
  shells (persistent websocket, heavy client state) → tilts O7 slightly toward Tauri
  (lightweight); the Node/CLI-subprocess (D8) pull toward Electron remains as counterweight.

### D20 — v1 is dev-centric; PMs engage via PR comments only (O21)
- Resolves the D3 tension D19 reopened. **D3 amended:** the v1 primary user is the
  developer. The "PM+dev shared spec" goal is *dropped for v1* — PMs participate through
  standard PR review comments, not by authoring specs in the tool.
- **Why this is the honest choice:** without real-time collab (D19), forcing PM
  co-authorship means investing in awkward async-participation half-measures. Committing to
  dev-centric sharpens priorities.
- **Cascade effects (re-aligns earlier decisions under the dev-centric lens):**
  - **D14 (hybrid format):** "PM-readable" was part of the rationale — that burden drops.
    The committed projection now only needs to be *developer-legible in a diff*, not
    non-developer-friendly. Hybrid still holds, but justified by traceability (D13 #2) +
    round-trip (D14), NOT PM readability.
  - **D18 (editor):** the "Notion UX so PMs can write" pressure eases → BlockNote's
    batteries-included UX premium is less essential; the control argument (Tiptap) gets
    relatively stronger. (Reinforces re-examining O4.)
- **Not permanent:** "for v1." PM participation can return later (async per O21-A, or
  real-time per D19) once the dev-centric core ships.

### D21 — Platform shell: Electron (O7)
- **Chosen for Node/CLI ecosystem alignment**, which meshes exactly with D8: app-layer owns
  orchestration; Claude Code subagents attach as CLI subprocesses; the Agent SDK is
  Node/TypeScript-native — all sit naturally on Electron's Node runtime.
- **Tradeoff accepted (stated plainly):** pay a heavier memory footprint to buy removal of
  ecosystem friction. D19 created a Tauri pull (lightness), but ecosystem alignment won.
- Revisit only if memory/footprint becomes a real user-facing problem; the data model and
  orchestration are shell-agnostic enough to port later if forced.

### D22 — Graph scope: focused view by default; whole-project graph as optional (O11)
- **Rejected as default: Obsidian-style whole-project "everything" graph.** Impressive but a
  hairball past a few dozen nodes — the exact noise D5 warned about — and it answers "survey
  the whole" when P4 says the graph exists to answer "what should I attend to."
- **Key reuse: the focused view IS D10.** D10's level-of-detail renderer (near = detailed,
  far = summarized, important = always shown regardless of distance) is *already* the
  definition of a focused neighborhood view. O11 is not a new mechanism — it's **D10 reused
  for the human graph visualization.**
  - Satisfying symmetry: D10 was built to scope the *agent's* context; the same renderer
    scopes the *human's* graph view. Same primitive, another consumer — the agent's context
    slice and the human's visible neighborhood are computed by one engine.
- **Decision: focused view is the default; whole-project graph is an explicit, optional
  view** (not the landing state).
- **Why keep whole-graph at all (the tradeoff):** focused views only show "around what you
  already know," so *unexpected* connections surface only in a whole view — discovery has
  real value. But it's an occasional need, not a daily one, so it doesn't earn the default
  slot.

### D23 — Edge authoring + fan-in metric, unified by an edge-strength trust gradient (O12/O12b/O17)
- **Authoring paths (O12) — all three supported (all converge on the same API, D2), but with
  a default:**
  - **Agent-proposed = default.** Low friction, aligns with our strength (agent mutates the
    store via API, D2). This is what keeps the graph populated so P4's value materializes.
  - **Manual = always available.** Explicit user-drawn edges, for precision.
  - **Inference from references = soft edges only.** Mention ≠ dependency, so inferred edges
    may only ever be `relates`/`informs`, never hard.
- **Agent + hard edges (O12b) — human-confirmation required.** An agent may freely
  create/propose *soft* edges, but any `blocks`/`supersedes` edge it wants to create must
  pass explicit human confirmation. Rationale: hard edges halt the agent (D16) and force
  context (D10), so they must not carry agent noise.
- **The unifying principle (emergent): edge strength sets the trust bar for creating it.**
  Soft = agent-free-to-propose/infer; hard = human-gated. Same shape as D12 (derived floor
  vs. explicit boost) and O20 (stronger action ⇒ stricter signal). The whole system follows
  one **trust gradient**.
- **Fan-in metric (O17) — direct in-degree.** Cheap (O(1)-ish lookup), predictable. Since
  fan-in is a *soft/derived* signal (used for D10 "what to show" hints, explicitly excluded
  from forced escalation by O20), accuracy matters less than cost/predictability. Transitive
  descendant weight is a later upgrade *only if* real graphs show direct in-degree misses
  true keystones.

### D24 — Cycle handling + portable permission enforcement, both anchored on the D2 write path (O9/O14)
- **Cycle handling (O9):**
  - **Hard-edge cycles** (`blocks`/`supersedes` forming a loop) = deadlock (each waits on the
    other) → **blocked at write-time by the D2 API**. Cheap because every edge already passes
    through the single mutation path.
  - **Soft-edge cycles** (`relates`/`informs`) = harmless (don't halt anything) → **allowed**.
  - "Now it's a cycle but I'll resolve it later" is expressed as a **deferred-decision node
    (D6)**, which is cleaner than tolerating a real cycle.
  - Ties into D23's trust gradient: hard = strict, soft = loose.
- **Portable permission enforcement (O14):**
  - **API gating = primary line of defense.** The spec-engine API (D2) is **role-aware**:
    it knows the caller's role and rejects out-of-role mutations (spec session calling a
    code-write op → rejected; impl session calling a spec-mutation op → rejected).
  - Works **provider-agnostically** — Claude, GPT, whatever — because everything must pass
    through *our* API, not the model's native tool boundaries. Directly realizes P7 ("we
    construct the context, so we own isolation").
  - **Sandbox = deferred**, added only if filesystem-level isolation becomes necessary. API
    gating alone satisfies the core requirement ("spec/impl sessions can't write each
    other's domain").
- **Shared insight:** both O9 and O14 land on **D2's single mutation path as the natural
  enforcement point** — cycle checks and role checks are both just gates on the one place all
  writes pass through. Same reuse-don't-invent pattern as the whole session.

---

## 2c. Decisions Locked (session 2 — implementation stack)

_Made while starting the build. These are stack/tooling choices, not product-architecture;
recorded here so the rationale is durable rather than buried in commit messages._

### D25 — Renderer UI framework: React
- **Chosen over Svelte (and Vue).** Decided on three project-specific factors, not raw popularity:
  (1) this is an **LLM-built** codebase (Claude Code now, agents as the product later) and models
  are markedly more reliable at React; (2) the editor decision (D18) is React-leaning —
  Slate/Plate and BlockNote are React, so React keeps the D18 options open; (3) the UI rules
  (see CLAUDE.md) depend on React-first headless/variant libs (Radix, React Aria, CVA).
- **Svelte's main edge (bundle size) is moot in Electron** (desktop, not re-downloaded per visit);
  its higher satisfaction is partly self-selection. Wired into the renderer via
  `@vitejs/plugin-react` (pinned Vite 7 — electron-vite@5 peer ceiling).

### D26 — Styling engine: Tailwind v4 (+ CVA on Radix)
- **Chosen over Panda CSS and CSS Modules.** Tailwind for max LLM fluency (the shadcn pattern)
  and best support while SeungBin is newer to the layer; Panda was the principled runner-up
  (typed tokens/recipes) but more niche. Tokens live in Tailwind `@theme`; components expose a
  **closed variant API** via CVA, with `className`/`style` omitted from public props (UI Rule 2).
- Enforcing "tokens only" (Rule 4 — ban arbitrary values) has **no clean Tailwind-v4-compatible
  lint rule yet** → deferred (DD-6).

### D27 — Component workshop: Ladle
- **Chosen over Storybook.** Lighter, Vite-native, faster startup, Storybook-compatible story
  format — enough to realize UI Rule 7 (each component documents its prop vocabulary via a
  controls Playground) without Storybook's weight. Components render in a plain browser (not
  Electron), which reinforces keeping presentational components decoupled from the preload
  bridge (UI Rule 6).

### D28 — Linting: Oxlint primary + ESLint for the gaps
- **Two-linter setup.** Oxlint is the fast primary; ESLint runs *only* the rules Oxlint can't
  express. Concretely: Oxlint **does not implement `no-restricted-syntax`** (verified), which
  UI Rule 3 needs (ban raw `<button>` outside `components/Button/`), so that rule lives in a
  narrowly-scoped `eslint.config.mjs`. `npm run lint` = `oxlint && eslint .`.

---

## 2d. Decisions Locked (session 3 — spec organization)

_Made while building the workspace UI, when "how do specs organize as the project grows"
came up. Refines D14/D15 (which settled *that* specs project to markdown in-repo) with *at
what granularity*._

### D29 — Spec file granularity: one file per spec (default) + promotable node-level file boundaries — SUPERSEDED by D30
- **SUPERSEDED by D30 (file granularity moot).** With no committed files, per-spec-file
  granularity and promotable file boundaries no longer apply. The **drill-down navigation**
  half survives as pure store structure (already realized in the spec pane, BL-038).
- **Default boundary = one file per spec root.** Each spec (a root containment node with its
  triad, D17) projects to its own markdown file, so Git branch/merge/diff and PR review (D13)
  stay scoped per spec. Chosen over: (a) a single whole-project spec file — coarse diffs,
  merge-conflict + review noise grow with the project; (b) one-file-per-node — precise history
  but an explosion of tiny files.
- **Promotable node boundaries ("turn into page").** Any node may be promoted to an additional
  **projection root**: its subtree externalizes to its own linked file and the parent embeds a
  stable-ID **link anchor** (reusing D14 anchors) — Notion-style linked subpages. Rehydration
  reassembles the full forest by following the anchors.
- **File boundaries are a projection concern only.** The live store stays one continuous
  containment tree (D1/D5); promotion changes only *where a subtree serializes* — never the
  logical tree, the mutation path (D2), or the navigation. So the UI is **drill-down by
  default** and treats inline vs. linked subtrees identically.
- **Promotion trigger** (manual "turn into page" vs. auto-suggest at a size threshold) left
  open → DD-11; default is manual.
- **Dogfood check:** the backlog itself is stored exactly this way — README index + per-item
  `items/BL-###.md` + `[[links]]` — which is why the pattern was already trusted.
- Realizes: BL-020 (projection), BL-022 (rehydration), BL-031 (promote UX).

### D30 — Externalize the spec store: local database (SQLite), Git links by reference
- **The reframe:** the spec/tracker is issue-tracker-shaped data (mutable, relational, stateful,
  high-churn); Git is a versioned-content store (immutable-ish text, diff/merge). Forcing one
  through the other is the root of the format/parse-back/merge friction (DD-8, D14, O18).
  Externalizing the store dissolves it.
- **Decision:** the structured store is persisted to a **local per-project database (SQLite)**,
  which is the durable record itself (re-amends D1). No committed text projection, no parse-back,
  no rehydration-from-Git. Git holds code and references spec nodes by **stable ID** (commits/PRs
  ↔ nodes, D13 #2), the way `#123` links an issue.
- **Purifies the thesis, not weakens it:** D1's core (structure is truth; mutation only via API;
  no text escape hatch) is *strengthened* — the one uncomfortable bend (O19's text projection and
  its parse-back fidelity risk, §2's "one fidelity-risk surface") is removed. The agent has no
  text path anywhere.
- **Fit:** SQLite models both relations cleanly — `nodes` (adjacency list, ordered siblings) for
  containment, `edges` for the dependency graph; recursive CTEs for traversal. But the hot path
  stays the **in-memory typed engine** (as built); SQLite is load-on-open + write-through
  persistence, not the per-op query engine. There is **no parsing** — rows ↔ typed nodes is a
  lossless mapping. Schema/FK constraints enforce structural consistency at write time — the
  "regulation" markdown couldn't give.
- **Cost accepted (SeungBin, session 3):** (a) **branch-scoped specs gone** — specs are global
  (tracker semantics); "which spec matches this branch" is given up. (b) **No Git-diff spec
  review** — D13 #1 becomes app-native. Traceability (#2) and merge-gate (#4) survive via IDs.
- **Placement (resolves DD-5):** engine + SQLite run in the **main process**; the renderer reads
  via IPC (read-only — the impl session doesn't mutate the spec, D7). Uses Node's built-in
  **`node:sqlite`** (`DatabaseSync`, synchronous — Electron 43 bundles Node 24) — no native
  module, no ABI rebuild; strictly simpler than the originally-noted `better-sqlite3`.
- **Supersedes:** D15 (reversed — not in-repo), D14 + DD-8 (retired — no text form), D29 (mooted
  — no files; drill-down UI survives). **Re-amends** D1 (store = durable record). **Reworks** D13
  (#1 app-native). A **cloud store** stays a clean future upgrade behind the same store
  abstraction (would reopen D19 collaboration).
- Reworks backlog: M2 (BL-020/021/022) → external-store persistence.

### D31 — Code-editor engine: CodeMirror 6 (over Monaco) — resolves DD-10
- For the read-first code pane (BL-037). Decided from evidence (npm trends, bundle, our stack + rules):
  - **Bundle/startup:** CodeMirror ~50–300KB tree-shaken, <100ms; Monaco 2.4–5MB, +1–3s.
  - **Our rules:** Monaco forces hardcoded hex in JS (Sourcegraph's #1 migration pain) — conflicts
    with Rule 4 (tokens only). CodeMirror themes via extensions reading our `--cm-*` tokens.
  - **Stack:** Monaco has documented Vite+Electron worker-bundling pain; CodeMirror embeds as a
    plain component, no workers.
  - **Read-first (D20):** CodeMirror's read-only mode is trivial; Monaco's value (IntelliSense) is
    the heavy editing we deprioritize.
  - **JetBrains preference:** no JetBrains *web* editor exists; Monaco *is* VS Code's editor and
    looks like it. CodeMirror is themed to a JetBrains/Darcula token palette, honoring the preference.
  - Adoption: CodeMirror ~7.0M weekly npm vs Monaco ~6.0M; powers Firefox DevTools, Replit, and
    Sourcegraph (which migrated *off* Monaco).
- One tradeoff: Monaco has more robust CJK/IME — minor for a *code* pane (code is ~ASCII); the
  make-or-break IME requirement lives in the spec block editor (D18/BL-002) + the agent composer
  (already handled by the `Textarea` primitive).
- Realizes: BL-037 (read-first editor). Packages: `@codemirror/*` + `@lezer/highlight`.

---

## 3. Open Questions (not yet decided)

- **O1 — [LEANING → D14]** Committed text = hybrid (human markdown + embedded stable ID
  anchors). "No-ID markdown" eliminated by O3 #2. Canonical-block rejected for review
  illegibility. Open risk: parse-back fidelity — see D14 + O18.
- **O2 — [LEANING → D15]** In-repo, alongside code (Kiro-style location, NOT Kiro's
  source-of-truth model). Chosen because all O3 behaviors are Git-native. Requires a
  deliberate bend to D1 — see D15 + O19. *Needs SeungBin's sign-off on the bend.*
- **O3 — [RESOLVED → D13]** All four PR behaviors adopted, ordered by escalating format
  demand; #2 traceability forces stable IDs, which resolves most of O1.
- **O4 — [RESOLVED → D18] Prototype-spike both (Slate/Plate vs. Tiptap), then decide.**
  Flexibility-vs-stability can't be settled on paper — esp. Korean IME risk, which must be
  typed to know. Spike scoped to 3 targeted checks (see D18).
- **O5 — [RESOLVED → D17]** Fixed default triad (requirements→design→tasks), but templates
  are user-editable structured objects in the store.
- **O6 — [RESOLVED → D19] Drop real-time collaboration for v1.** Git async collaboration
  only. See D19 for what this saves and the D3 tension it reopens (O21).
- **O21 — [RESOLVED → D20] Dev-centric v1 (option B).** Drop the PM-participation goal for
  v1; PMs engage via PR review comments. See D20 for cascade effects on D14/D18.
- **O7 — [RESOLVED → D21] Electron.** Node/CLI ecosystem alignment prioritized over
  Tauri's lightness. See D21.
- **O8 — [RESOLVED → D9]** Edge types = blocks / relates / informs / supersedes, split
  hard vs. soft.
- **O9 — [RESOLVED → D24]** Hard-edge cycles blocked at write-time via the D2 API; soft-edge
  cycles allowed (harmless — soft edges don't halt). "Resolve later" cases expressed as a
  deferred-decision node (D6), not a cycle.
- **O10 — [RESOLVED → D16]** (See resolution note above / D16.)
- **O11 — [RESOLVED → D22] Focused view by default; whole-project graph optional.** Reuses
  D10's LOD renderer for the human graph view. See D22.
- **O12 — [RESOLVED → D23]** Agent-proposed = default authoring path; manual always
  available; inference restricted to soft edges only.
- **O13 — [RESOLVED → D10]** Scoped context is a level-of-detail renderer (full /
  summarized / always-surface-important), visibility user-adjustable — not a hop cutoff.
- **O16 — [RESOLVED → D12]** Importance = derived floor (structural) + assigned boost
  (star/priority). See D12 for the composite.
- **O16b — [RESOLVED → D12]** Deferred decisions are important only when they block the
  current task's path (reuses D9 hard-edge traversal).
- **O17 — [RESOLVED → D23]** Fan-in = direct in-degree (cheap, predictable). Fan-in is a
  soft/derived signal, so accuracy matters less than cost/predictability. Transitive
  upgrade left open for later if real graphs show direct misses keystones.
- **O18 — [RESOLVED → D14]** Parse-back + IDE confirmation before a reviewer's PR-markdown
  edit lands.
- **O10 — [RESOLVED → D16]** Edge type gates halting (hard = stop, soft = continue);
  per-project threshold gates agent initiative on soft cases.
- **O20 — [RESOLVED → D16 amended]** Only *explicit* importance (star/priority) forces
  initiative-escalation; *derived* signals (fan-in) do NOT. See D16.
- **O19 — [RESOLVED] Accept the D1 bend → YES, full Git-native.** Committed projection =
  durable record; store = rehydratable working layer. Mutation invariant preserved. D1
  amended; D15 locked.
- **O14 — [RESOLVED → D24]** API gating as primary (role-aware mutation checks on the D2
  path); sandbox deferred until filesystem-level isolation is actually needed.
- **O15 — [RESOLVED → D11]** Coherence checked by a separate read-only review role holding
  both spec + code, scoped by D10, gated by cost/stakes.

---

## 4. Explicitly Rejected / Constrained

- ✗ Markdown as source of truth (the Kiro model) — rejected per D1.
- ✗ Agent editing spec files as text — rejected per D2/P2.
- ✗ Giving the agent a bypass/escape-hatch write path — rejected per D2.
- ✗ Relying on the model's own delegation routing to enforce isolation — rejected per D8;
  orchestration authority is ours.
- ✗ One long-running agent doing both spec + implementation — rejected per D7; its context
  only accumulates and will pollute regardless of prompting.
- ⚠ "No markdown at all" (user's initial phrasing) — **refined**: there is no committed
  markdown *durable record* (D30 — the store is SQLite). Text may still be generated
  ephemerally for agent-context and export, but never as a source of truth or a write path.

---

_Last updated: session 3 — added **D30 (externalize the spec store to local SQLite)**: reverses
D15, retires D14/DD-8, moots D29, re-amends D1, reworks D13. Earlier in session 3: D29 (now
superseded), and **D31 (CodeMirror 6 code editor, resolves DD-10)**. Session 2 added D25–D28
(stack). Session-1 product decisions D1–D24 otherwise unchanged. Build progress is tracked in
[`backlog/`](./backlog/README.md)._
