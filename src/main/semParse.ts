import type { SemDiff } from '../shared/sem'

/*
  Pure parser for `sem diff --format json` stdout — no electron/subprocess, so it's unit-testable
  (sem.ts wires it to the shell-out + IPC layer). sem prints a one-time telemetry notice to stderr,
  not stdout, but we still slice from the first `{` so any stray preamble can't break JSON.parse.
*/
export function parseSemDiff(raw: string): SemDiff {
  const start = raw.indexOf('{')
  if (start === -1) throw new Error('sem produced no JSON output')
  return JSON.parse(raw.slice(start)) as SemDiff
}
