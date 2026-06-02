import type {
  ConsentModule,
  ConsentModuleConfig,
  RecordSignupConsentsInput,
  UserConsent,
} from '../shared/types.js';
import {
  recordConsent,
  recordSignupConsents,
  hasUserConsented,
  needsConsentUpdate,
  getCurrentConsents,
  getAuditTrail,
  getUserLatestConsents,
} from './lib/index.js';
import { DEFAULT_OCE_OPERATION_TIMEOUT_MS } from './pool.js';
import { withOceTimeout } from './timeout.js';

export { runMigrations, type RunMigrationsOptions } from './migrations.js';
export { seedStandardConsents } from './seed.js';
export { createOcePool, DEFAULT_OCE_CONNECTION_TIMEOUT_MS, DEFAULT_OCE_OPERATION_TIMEOUT_MS } from './pool.js';
export type { CreateOcePoolOptions } from './pool.js';
export { oceSelfTest, type OceSelfTestResult, type OceSelfTestOptions } from './selfTest.js';
export { OceError, type OceErrorCode } from './errors.js';

export function createConsentModule(config: ConsentModuleConfig): ConsentModule {
  const { pool, adapter } = config;
  const timeoutMs = config.timeoutMs ?? DEFAULT_OCE_OPERATION_TIMEOUT_MS;

  const notify = async (userId: string, key: string, granted: boolean) => {
    if (adapter?.onConsentRecorded) {
      await adapter.onConsentRecorded(userId, key, granted);
    }
  };

  return {
    async recordConsent(input) {
      const record = await recordConsent(pool, input);
      const keyResult = await pool.query<{ key: string }>(
        'SELECT key FROM oce_consent_definitions WHERE id = $1',
        [input.definitionId],
      );
      if (keyResult.rows.length > 0) {
        await notify(input.userId, keyResult.rows[0].key, input.granted);
      }
      return record;
    },

    async recordSignupConsents(input: RecordSignupConsentsInput): Promise<UserConsent[]> {
      const records = await withOceTimeout(recordSignupConsents(pool, input), timeoutMs);
      for (const c of input.consents) {
        await notify(input.userId, c.key, c.granted);
      }
      return records;
    },

    hasUserConsented: (userId, key) => hasUserConsented(pool, userId, key),
    needsConsentUpdate: (userId) => needsConsentUpdate(pool, userId),
    getCurrentConsents: (userId) => getCurrentConsents(pool, userId),
    getAuditTrail: (userId, limit) => getAuditTrail(pool, userId, limit),
    getUserLatestConsents: (userIds) => getUserLatestConsents(pool, userIds),
  };
}

// Re-export types and template helpers for convenience
export type {
  ConsentDefinition,
  UserConsent,
  ConsentVersionLog,
  RecordConsentInput,
  RecordSignupConsentsInput,
  ConsentStatus,
  AuditEntry,
  ConsentModuleAdapter,
  ConsentModuleConfig,
  ConsentModule,
} from '../shared/types.js';
export { STANDARD_CONSENTS, applyProductName } from './templates/index.js';
