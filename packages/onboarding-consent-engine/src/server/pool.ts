import { Pool, type PoolConfig } from 'pg';

export const DEFAULT_OCE_CONNECTION_TIMEOUT_MS = 10_000;
export const DEFAULT_OCE_OPERATION_TIMEOUT_MS = 5_000;

export interface CreateOcePoolOptions {
  connectionString: string;
  connectionTimeoutMs?: number;
  pool?: Omit<PoolConfig, 'connectionString' | 'connectionTimeoutMillis'>;
}

/** Creates a pg Pool with OCE default connection timeout (10s). */
export function createOcePool(opts: CreateOcePoolOptions): Pool {
  return new Pool({
    ...opts.pool,
    connectionString: opts.connectionString,
    connectionTimeoutMillis: opts.connectionTimeoutMs ?? DEFAULT_OCE_CONNECTION_TIMEOUT_MS,
  });
}
