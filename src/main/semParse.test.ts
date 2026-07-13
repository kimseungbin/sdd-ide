import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseSemDiff } from './semParse'

// A real `sem diff --format json` payload captured against this repo (sem 0.21.0).
const fixture = readFileSync(
  fileURLToPath(new URL('./__fixtures__/sem-diff.json', import.meta.url)),
  'utf8',
)

describe('parseSemDiff', () => {
  it('parses the sem diff payload', () => {
    const diff = parseSemDiff(fixture)
    expect(diff.summary.total).toBeGreaterThan(0)
    expect(diff.changes.length).toBeGreaterThan(0)
    expect(diff.changes[0]).toHaveProperty('entityId')
    expect(diff.changes[0]).toHaveProperty('changeType')
  })

  it('tolerates a leading (stderr-style) telemetry preamble on stdout', () => {
    const withNoise = 'sem keeps anonymous usage stats on this machine.\n' + fixture
    expect(parseSemDiff(withNoise).summary.fileCount).toBeGreaterThan(0)
  })

  it('throws when there is no JSON at all', () => {
    expect(() => parseSemDiff('command not found: sem')).toThrow(/no JSON/)
  })
})
