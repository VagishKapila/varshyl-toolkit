import { Pool, type PoolConfig } from 'pg';

export const DEFAULT_TM_CONNECTION_TIMEOUT_MS = 10_000;
export const DEFAULT_TM_OPERATION_TIMEOUT_MS = 5_000;

export interface CreateTmPoolOptions {
  connectionString: string;
  connectionTimeoutMs?: number;
  pool?: Omit<PoolConfig, 'connectionString' | 'connectionTimeoutMillis'>;
}

/** Creates a pg Pool with TM default connection timeout (10s). */
export function createTmPool(opts: CreateTmPoolOptions): Pool {
  return new Pool({
    ...opts.pool,
    connectionString: opts.connectionString,
    connectionTimeoutMillis: opts.connectionTimeoutMs ?? DEFAULT_TM_CONNECTION_TIMEOUT_MS,
  });
}
