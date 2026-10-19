export type ManagerErrorCode =
  | 'invalid-argument'
  | 'invalid-content'
  | 'not-found'
  | 'conflict'
  | 'forbidden'
  | 'unavailable'
  | 'io-error'

/** 可呈现给 WebUI / 模型的可预期失败。 */
export class ManagerError extends Error {
  constructor(
    readonly code: ManagerErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'ManagerError'
  }
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
