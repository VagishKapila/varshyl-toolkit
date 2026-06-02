import { AsError } from './errors.js';

export async function withAsTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  code: 'AS_TIMEOUT' | 'AS_MIGRATIONS_FAILED' = 'AS_TIMEOUT',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new AsError(`Operation timed out after ${timeoutMs}ms`, code));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
