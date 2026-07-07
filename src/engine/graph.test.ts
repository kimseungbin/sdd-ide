import { describe, it, expect } from 'vitest'
import { createSpecEngine } from './engine'

function threeNodes() {
  const engine = createSpecEngine()
  const a = engine.createNode({ type: 'task', title: 'A' })
  const b = engine.createNode({ type: 'task', title: 'B' })
  const c = engine.createNode({ type: 'task', title: 'C' })
  return { engine, a: a.id, b: b.id, c: c.id }
}

describe('dependency graph', () => {
  it('adds edges and queries outgoing/incoming', () => {
    const { engine, a, b } = threeNodes()
    const edge = engine.addEdge({ from: a, to: b, type: 'blocks' })

    expect(edge).toMatchObject({ from: a, to: b, type: 'blocks' })
    expect(engine.getEdges()).toHaveLength(1)
    expect(engine.getOutgoingEdges(a).map((e) => e.to)).toEqual([b])
    expect(engine.getIncomingEdges(b).map((e) => e.from)).toEqual([a])
  })

  it('rejects an edge to a missing node', () => {
    const { engine, a } = threeNodes()
    expect(() => engine.addEdge({ from: a, to: 'nope', type: 'relates' })).toThrow(
      expect.objectContaining({ code: 'NODE_NOT_FOUND' }),
    )
  })

  it('rejects self-edges and duplicates', () => {
    const { engine, a, b } = threeNodes()
    expect(() => engine.addEdge({ from: a, to: a, type: 'relates' })).toThrow(
      expect.objectContaining({ code: 'SELF_EDGE' }),
    )
    engine.addEdge({ from: a, to: b, type: 'relates' })
    expect(() => engine.addEdge({ from: a, to: b, type: 'relates' })).toThrow(
      expect.objectContaining({ code: 'DUPLICATE_EDGE' }),
    )
  })

  it('allows soft-edge cycles but rejects hard-edge cycles (BL-014/D24)', () => {
    const { engine, a, b, c } = threeNodes()
    // soft cycle: fine
    engine.addEdge({ from: a, to: b, type: 'relates' })
    expect(() => engine.addEdge({ from: b, to: a, type: 'relates' })).not.toThrow()

    // hard cycle: A blocks B blocks C, then C blocks A would deadlock → rejected
    engine.addEdge({ from: a, to: b, type: 'blocks' })
    engine.addEdge({ from: b, to: c, type: 'blocks' })
    expect(() => engine.addEdge({ from: c, to: a, type: 'blocks' })).toThrow(
      expect.objectContaining({ code: 'CYCLE' }),
    )
  })

  it('computes fan-in (in-degree), optionally by type', () => {
    const { engine, a, b, c } = threeNodes()
    engine.addEdge({ from: a, to: c, type: 'blocks' })
    engine.addEdge({ from: b, to: c, type: 'relates' })

    expect(engine.getInDegree(c)).toBe(2)
    expect(engine.getInDegree(c, 'blocks')).toBe(1)
    expect(engine.getInDegree(a)).toBe(0)
  })

  it('computes transitive hard-edge reachability (D12 importance floor)', () => {
    const { engine, a, b, c } = threeNodes()
    engine.addEdge({ from: a, to: b, type: 'blocks' })
    engine.addEdge({ from: b, to: c, type: 'supersedes' })
    engine.addEdge({ from: a, to: c, type: 'relates' }) // soft — not followed

    const reachable = engine.getHardReachable(a).sort()
    expect(reachable).toEqual([b, c].sort())
  })

  it('prunes edges when a node is deleted', () => {
    const { engine, a, b } = threeNodes()
    engine.addEdge({ from: a, to: b, type: 'blocks' })
    engine.deleteNode(b)
    expect(engine.getEdges()).toHaveLength(0)
  })

  it('removes edges and rejects unknown edge ids', () => {
    const { engine, a, b } = threeNodes()
    const edge = engine.addEdge({ from: a, to: b, type: 'informs' })
    engine.removeEdge(edge.id)
    expect(engine.getEdges()).toHaveLength(0)
    expect(() => engine.removeEdge(edge.id)).toThrow(
      expect.objectContaining({ code: 'EDGE_NOT_FOUND' }),
    )
  })

  it('round-trips edges through a snapshot', () => {
    const { engine, a, b } = threeNodes()
    engine.addEdge({ from: a, to: b, type: 'blocks' })

    const snapshot = engine.toSnapshot()
    const restored = createSpecEngine(snapshot)
    expect(restored.toSnapshot()).toEqual(snapshot)
    expect(restored.getOutgoingEdges(a)).toHaveLength(1)
  })
})
