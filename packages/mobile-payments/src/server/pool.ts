import { Pool, type PoolConfig } from 'pg';

export const DEFAULT_MP_CONNECTION_TIMEOUT_MS = 10_000;
export const DEFAULT_MP_OPERATION_TIMEOUT_MS = 5_000;

export interface CreateMpPoolOptions {
  connectionString: string;
  connectionTimeoutMs?: number;
  pool?: Omit<PoolConfig, 'connectionString' | 'connectionTimeoutMillis'>;
}

/** Creates a pg Pool with mobile-payments default connection timeout (10s). */
export function createMpPool(opts: CreateMpPoolOptions): Pool {
  return new Pool({
    ...opts.pool,
    connectionString: opts.connectionString,
    connectionTimeoutMillis: opts.connectionTimeoutMs ?? DEFAULT_MP_CONNECTION_TIMEOUT_MS,
  });
}
