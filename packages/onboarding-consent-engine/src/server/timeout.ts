import { OceError } from './errors.js';

export async function withOceTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  code: 'OCE_TIMEOUT' | 'OCE_MIGRATIONS_FAILED' = 'OCE_TIMEOUT',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new OceError(`Operation timed out after ${timeoutMs}ms`, code));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
