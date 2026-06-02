import { Pool, type PoolConfig } from 'pg';

export const DEFAULT_AS_CONNECTION_TIMEOUT_MS = 10_000;
export const DEFAULT_AS_OPERATION_TIMEOUT_MS = 5_000;

export interface CreateAsPoolOptions {
  connectionString: string;
  connectionTimeoutMs?: number;
  pool?: Omit<PoolConfig, 'connectionString' | 'connectionTimeoutMillis'>;
}

/** Creates a pg Pool with auth-social default connection timeout (10s). */
export function createAsPool(opts: CreateAsPoolOptions): Pool {
  return new Pool({
    ...opts.pool,
    connectionString: opts.connectionString,
    connectionTimeoutMillis: opts.connectionTimeoutMs ?? DEFAULT_AS_CONNECTION_TIMEOUT_MS,
  });
}
