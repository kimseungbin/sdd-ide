import type { EdgeType } from './types'

/** Hard edges change what a session is *allowed* to do (D9). */
export const HARD_EDGE_TYPES = ['blocks', 'supersedes'] as const
/** Soft edges change what a session *should be aware of* (D9). */
export const SOFT_EDGE_TYPES = ['relates', 'informs'] as const

export function isHardEdge(type: EdgeType): boolean {
  return type === 'blocks' || type === 'supersedes'
}
