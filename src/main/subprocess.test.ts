import { describe, it, expect } from 'vitest'
import { runNode } from './subprocess'

describe('runNode', () => {
  it('spawns a node subprocess and captures stdout', async () => {
    const out = await runNode(['-e', 'process.stdout.write("pong")'])
    expect(out).toBe('pong')
  })
})
