import { MpError } from './errors.js';

export async function withMpTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  code: 'MP_TIMEOUT' | 'MP_MIGRATIONS_FAILED' = 'MP_TIMEOUT',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new MpError(`Operation timed out after ${timeoutMs}ms`, code));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
