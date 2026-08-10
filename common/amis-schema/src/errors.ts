export class MetadataRevisionConflictError extends Error {
  readonly code = 'revision-conflict'

  constructor(message: string) {
    super(message)
    this.name = 'MetadataRevisionConflictError'
  }
}

export function metadataHostErrorCode(error: unknown): string {
  if (error instanceof MetadataRevisionConflictError) {
    return error.code
  }
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code
  }
  return 'host-error'
}
