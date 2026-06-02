export type TmErrorCode = 'TM_MIGRATIONS_FAILED' | 'TM_UNKNOWN_KEY' | 'TM_TIMEOUT';

export class TmError extends Error {
  readonly code: TmErrorCode;

  constructor(message: string, code: TmErrorCode, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'TmError';
    this.code = code;
  }
}
