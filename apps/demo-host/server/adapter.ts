import type { ServerModuleAdapter } from '@varshyl/team-management';

/**
 * Demo adapter — intentionally simple.
 * Returns hardcoded values because demo-host is a verification harness,
 * not a real product. Real products implement this properly.
 */
export const demoAdapter: ServerModuleAdapter = {
  getCurrentUserId: async (_req) => 1,
  getOrganizationIdForUser: async (_userId) => 1,
  isUserOrgAdmin: async (_userId, _orgId) => true,
  logger: {
    info: (msg, meta) => console.log('[team-management]', msg, meta ?? ''),
    warn: (msg, meta) => console.warn('[team-management:warn]', msg, meta ?? ''),
    error: (msg, meta) => console.error('[team-management:error]', msg, meta ?? ''),
  },
};
