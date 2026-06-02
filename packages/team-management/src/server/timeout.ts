import { TmError } from './errors.js';

export async function withTmTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  code: 'TM_TIMEOUT' | 'TM_MIGRATIONS_FAILED' = 'TM_TIMEOUT',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new TmError(`Operation timed out after ${timeoutMs}ms`, code));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
