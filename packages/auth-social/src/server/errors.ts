export type AsErrorCode = 'AS_MIGRATIONS_FAILED' | 'AS_UNKNOWN_KEY' | 'AS_TIMEOUT';

export class AsError extends Error {
  readonly code: AsErrorCode;

  constructor(message: string, code: AsErrorCode, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AsError';
    this.code = code;
  }
}
