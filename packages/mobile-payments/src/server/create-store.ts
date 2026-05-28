import type { Pool } from 'pg';
import type { PaymentsConfig } from '../config.js';
import { createPgSubscriptionStore } from './pg-subscription-store.js';

export function createSubscriptionStore(pool: Pool, config: PaymentsConfig) {
  return createPgSubscriptionStore(pool, config);
}

export type { SubscriptionStore } from './store.js';
