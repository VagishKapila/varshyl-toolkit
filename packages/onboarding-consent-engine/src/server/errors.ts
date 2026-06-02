export type OceErrorCode = 'OCE_MIGRATIONS_FAILED' | 'OCE_UNKNOWN_KEY' | 'OCE_TIMEOUT';

export class OceError extends Error {
  readonly code: OceErrorCode;

  constructor(message: string, code: OceErrorCode, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'OceError';
    this.code = code;
  }
}
