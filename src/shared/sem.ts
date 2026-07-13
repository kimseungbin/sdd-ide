/*
  The `sem` entity-diff contract. Neutral types shared by main (the `sem` shell-out service),
  preload (bridge), and renderer (the diff document).

  `sem` (github.com/Ataraxy-Labs/sem) computes *entity-level* diffs — which functions / classes /
  methods / properties changed — on top of git, the code-side mirror of what the spec store does
  for specs (D1/D2): a diff abstracted away from lines into structural entities. The shapes below
  mirror `sem diff --format json` verbatim (pinned against sem 0.21.0), so no field is invented
  here — if the CLI shape changes, this file changes with it.
*/

/** How an entity changed between two points. Mirrors sem's `changeType`. */
export type SemChangeType = 'added' | 'modified' | 'deleted' | 'moved' | 'renamed' | 'reordered'

/**
 * The structural kind of the entity. Language-dependent and open-ended (sem spans 32 languages),
 * so this is a hint union, not a closed set. `orphan` = a change not inside a named entity
 * (module-level code, comments); its `entityName` is typically `"module-level"`.
 */
export type SemEntityType =
  'function' | 'method' | 'class' | 'interface' | 'property' | 'orphan' | (string & {})

/** One changed entity. `beforeContent`/`afterContent` carry the entity's own source slices — the
 *  drill-in before/after renders straight from these (no `git show` needed). `null` on the side
 *  that doesn't exist (before for added, after for deleted). */
export interface SemChange {
  /** Fully-qualified stable-ish id: `file::type::name`. The future join key for BL-062. */
  entityId: string
  changeType: SemChangeType
  entityType: SemEntityType
  entityName: string
  /** Position in the new file (1-indexed). */
  startLine: number
  endLine: number
  /** Position in the old file; `null` when the entity is newly added. */
  oldStartLine: number | null
  oldEndLine: number | null
  /** Previous name, present on `renamed`. */
  oldEntityName: string | null
  filePath: string
  /** Previous path, present on `moved`. */
  oldFilePath: string | null
  oldParentId: string | null
  /** The entity's source before the change; `null` for `added`. */
  beforeContent: string | null
  /** The entity's source after the change; `null` for `deleted`. */
  afterContent: string | null
  commitSha: string | null
  author: string | null
  /** `true` = real structural/logic change, `false` = cosmetic (whitespace/comments) — lets the UI
   *  dim formatting-only changes. `null` when sem doesn't classify (e.g. pure additions). */
  structuralChange: boolean | null
}

/** Per-run counts, keyed by change kind (+ `binary`/`orphan`). */
export interface SemSummary {
  fileCount: number
  added: number
  modified: number
  deleted: number
  moved: number
  renamed: number
  reordered: number
  binary: number
  orphan: number
  total: number
}

/** The full `sem diff --format json` payload. */
export interface SemDiff {
  summary: SemSummary
  changes: SemChange[]
  binaryChanges: SemChange[]
}
