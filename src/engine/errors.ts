/** Validation failures from the mutation API (BL-011). Every rejected mutation throws one. */
export type SpecEngineErrorCode =
  | 'NODE_NOT_FOUND'
  | 'INVALID_TYPE'
  | 'INVALID_PATCH'
  | 'CYCLE'
  | 'EDGE_NOT_FOUND'
  | 'DUPLICATE_EDGE'
  | 'SELF_EDGE'

export class SpecEngineError extends Error {
  readonly code: SpecEngineErrorCode

  constructor(code: SpecEngineErrorCode, message: string) {
    super(message)
    this.name = 'SpecEngineError'
    this.code = code
  }
}
