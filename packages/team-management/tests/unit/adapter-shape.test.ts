import { describe, it, expect } from 'vitest';
import type { ServerModuleAdapter, TeamManagementConfig } from '../../src/server/types.js';

// This test verifies the adapter interface shape compiles correctly.
// If this file compiles, the adapter contract is sound.

describe('ServerModuleAdapter interface', () => {
  it('accepts a valid adapter implementation without TypeScript errors', () => {
    // Construct a minimal valid adapter — TS will error at compile time if shape is wrong
    const adapter: ServerModuleAdapter = {
      getCurrentUserId: async (_req) => 1,
      getOrganizationIdForUser: async (_userId) => 1,
      isUserOrgAdmin: async (_userId, _orgId) => true,
      logger: {
        info: (msg) => console.log('[info]', msg),
        warn: (msg) => console.warn('[warn]', msg),
        error: (msg) => console.error('[error]', msg),
      },
    };

    expect(adapter.logger).toBeDefined();
    expect(typeof adapter.getCurrentUserId).toBe('function');
    expect(typeof adapter.getOrganizationIdForUser).toBe('function');
    expect(typeof adapter.isUserOrgAdmin).toBe('function');
  });

  it('accepts valid TeamManagementConfig with all flags off', () => {
    const config: TeamManagementConfig = {
      featureFlags: {
        enableInvites: false,
        enableAuditLog: false,
      },
    };
    expect(config.featureFlags?.enableInvites).toBe(false);
    expect(config.featureFlags?.enableAuditLog).toBe(false);
  });

  it('accepts TeamManagementConfig with no featureFlags (all default off)', () => {
    const config: TeamManagementConfig = {};
    expect(config.featureFlags).toBeUndefined();
  });
});
