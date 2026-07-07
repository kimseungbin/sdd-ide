# CLAUDE.md

Spec-Driven Development IDE (working title TBD). Design lives in
[`sdd-ide-architecture.md`](./sdd-ide-architecture.md) and
[`sdd-ide-decisions.md`](./sdd-ide-decisions.md) (decisions D1–D24); the build plan is in
[`backlog/`](./backlog/README.md). Stack: Electron + electron-vite + TypeScript; renderer is React.

## Building UI

**Guiding principle — the UI mirrors the product's own thesis.** Just as the spec engine
allows mutations *only* through a constrained, validated API with no text escape hatch
(D2/P2), the UI allows appearance and structure to change *only* through a constrained
component API with no styling escape hatch. Determinism by construction — remove the
non-determinism of ad-hoc styling the same way the data layer removes it from writes.

1. **Reuse components over reinventing.** Before writing markup, use an existing component.
   If none fits, build a *general* primitive that expands by adding named variants/props —
   never by copy-paste or override leakage. Build on **headless behavior primitives**
   (Radix / React Aria) and own the presentation layer.

2. **Restricted styling API — props over render.** Configure appearance only through a
   **closed vocabulary of style props** (`variant`, `size`, `tone`, `state`…), implemented
   with a variant system (CVA). **No `className`/`style` passthrough — there is no style
   escape hatch.** Children are for *content*, not styling. Expand the closed set
   deliberately; never open it. (React note: prefer typed **props** over freeform
   **children/render-props** for anything that affects appearance or structure.)

3. **No raw semantic/interactive HTML elements outside their component home.** Elements that
   have a component wrapper (`button`, `input`, `select`, `a`, …) may be used raw *only*
   inside their own `components/<X>/` directory; everywhere else must import the component
   (use `<Button>`, never a raw `<button>`). This is Rule 1 with teeth. *Enforced by lint,
   directory-scoped — see "Lint enforcement" below.*

4. **Design tokens only.** No hardcoded colors, spacing, or font sizes — reference the token
   set. Hardcoded values are a smell.

5. **Accessibility + Korean IME baseline.** Components must be keyboard-navigable and
   ARIA-correct. Input/editor components must correctly handle Korean IME composition
   (the make-or-break check in [BL-002](./backlog/items/BL-002-block-editor-spike.md)).

6. **UI state derives from the store.** Components are projections of the structured store
   (D1). No load-bearing state lives only in component-local state; presentational
   components stay stateless.

7. **Document each component's prop vocabulary.** A component's restricted props
   (variants/sizes/states) are typed and documented as the single source of truth for how
   it may vary.

### Lint enforcement (Rule 3)

The primary linter is **Oxlint**; **ESLint runs alongside it for rules Oxlint can't express**
(`npm run lint` = `oxlint && eslint .`). Oxlint does not implement `no-restricted-syntax`
(verified 2026-07), so **Rule 3 is enforced by ESLint** (`eslint.config.mjs`): a raw `<button>`
is an error everywhere except `components/Button/`. Ban another element by extending the
`no-restricted-syntax` selector plus its per-directory override.

**Rule 4 (tokens only) is not yet lint-enforced** — banning arbitrary Tailwind values like
`bg-[#fff]` lacks a clean Tailwind-v4-compatible rule for now; enforced by review until one lands.
