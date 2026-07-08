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

**Observed (live test, 2026-07-08):**
- Tiptap: ✅ Korean composition clean — no dropped/doubled jamo, cursor stable mid-composition.
- Slate: ✅ Korean composition clean too. The Slate-killer check did **not** fire.

> Prior art: ProseMirror has years of battle-tested CJK composition handling; Slate's beta
> status and historical IME bugs are exactly why this check exists. The live evidence tied.

---

## Recommendation → DD-2: **Tiptap (ProseMirror)**

Both editors passed the make-or-break IME check, so the friction axis (#2, favoring Slate) is
no longer the tiebreaker. Once IME ties, the decision turns on the axes the spike scoped out,
and they favor Tiptap:

- **Schema validity by construction** — ProseMirror's strict schema enforces document validity
  the same way the engine's mutation API does (D2/P2); Slate is schema-less and permits invalid
  intermediate states you must normalize. Tiptap is the on-thesis choice.
- **Maturity** — the editor is load-bearing for all of M3; a production-grade library beats a
  still-0.x beta one.
- **Custom-block scaling** — many block types + templates (D17) ride better on validated
  NodeViews; mature Yjs collab keeps D19/O6 open.

Slate's lower adapter friction is a **one-time cost** paid once in the BL-030 adapter, not an
ongoing tax — not enough to outweigh the above.

Recorded in: `BL-002` AC + Resolution, `sdd-ide-decisions.md` (D18), backlog DD-2 row.

**Disposition:** `@tiptap/*` promoted from devDependencies to **dependencies**; the Slate
prototype (`SlateSpike.tsx`) + `slate*` deps were removed. The **Tiptap prototype is kept** here
as the seed for the real editor adapter (BL-030), which will replace the spike's whole-doc
reconcile with a proper store-projection adapter.
