# BL-002 — Block editor spike findings

Throwaway spike. Output is a **decision** resolving **DD-2** (Tiptap vs Slate/Plate), not
production code. Run `npm run ladle` → **Spike / Block editor (BL-002)** → **SideBySide**.

Candidates: **Tiptap** (ProseMirror family) vs **Slate** (tested directly; Plate = Slate +
plugins and inherits Slate's composition core, so slate-react exercises the IME risk that
matters). Three targeted checks (perf/bundle are noise at this stage, D18).

---

## Check #2 — Data-model adapter friction  *(evidence from building both)*

| | Tiptap (ProseMirror) | Slate |
|---|---|---|
| Doc model | One opaque PM document | Array of block elements — already a block list |
| Block identity | **None native** — had to graft a `blockId` global attribute onto *every* node type | Each element carries its own `id` field directly |
| Write-back | No per-block signal; `onUpdate` fires for the whole doc → reconcile all top-level nodes every change | `onChange` → walk `editor.children`, 1:1 to store rows |
| Schema | Strict PM schema; nodes must be declared | Schema-less core; an element is just `{ type, ...}` |

**Read:** Slate is the lower-friction fit for "editor doc model = projection of a block store"
(D1/D2). Its value *is* the block list. Tiptap's strict schema is more ceremony for this shape,
though that strictness is also a validity guarantee (closer to the engine's D2 spirit). Matches
the item's hypothesis that Slate's schema-less core is genuinely lower-friction here.

## Check #3 — Custom block types  *(evidence from building both)*

- **Tiptap:** `deferred-decision` is a real `Node` (schema `content: 'inline*'`) with a React
  `NodeView` (toggle + `NodeViewContent`). More ceremony, but the node is first-class and
  structurally validated — extends cleanly to template definitions (D17).
- **Slate:** just an element `type` + a `renderElement` branch. Minimal ceremony; identity and
  state live on the element. Extends to templates via convention, not schema.

Both satisfy the check. Tiptap = structured/validated; Slate = lightweight/flexible.

## Check #1 — Korean IME composition  *(MAKE-OR-BREAK — human-in-the-loop, PENDING)*

The decisive check. Type 한글 with a real IME into both editors, including:
- typing a multi-jamo syllable and continuing (조합 mid-composition),
- pressing ↑/↓ or editing another block **mid-composition**,
- typing Korean **inside** the deferred-decision custom block.

Watch for: dropped/duplicated jamo, cursor jumps, broken composition, or store-log desync.

**Observed (fill in from live test):**
- Tiptap: _____
- Slate: _____

> Prior art: ProseMirror has years of battle-tested CJK composition handling; Slate's beta
> status and historical IME bugs are exactly why this check exists. But the decision is made
> from the live evidence above, not this note.

---

## Recommendation → DD-2  *(PENDING live IME result)*

If Slate holds up on IME as well as Tiptap → the friction/flexibility edge favors **Slate**.
If Slate breaks or degrades on IME (per BL-002: "If Slate breaks here, Slate is out") →
**Tiptap**, accepting the adapter/reconcile friction as the price of composition robustness.

_Record the final pick here, then propagate to `BL-002` AC, `sdd-ide-decisions.md` (DD-2), and
the backlog DD-2 row; promote the winner from devDependencies to dependencies in BL-030._
