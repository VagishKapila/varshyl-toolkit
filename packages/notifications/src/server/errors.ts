export type NtErrorCode =
  | 'NT_MIGRATIONS_FAILED'
  | 'NT_PUSH_DISABLED'
  | 'NT_PUSH_SEND_FAILED';

export class NtError extends Error {
  readonly code: NtErrorCode;

  constructor(message: string, code: NtErrorCode, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'NtError';
    this.code = code;
  }
}
