export type MpErrorCode = 'MP_MIGRATIONS_FAILED' | 'MP_TIMEOUT' | 'MP_UNKNOWN_KEY';

export class MpError extends Error {
  readonly code: MpErrorCode;

  constructor(message: string, code: MpErrorCode, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'MpError';
    this.code = code;
  }
}
