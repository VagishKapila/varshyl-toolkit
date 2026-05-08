import type { Request } from 'express';
import type { ServerModuleAdapter } from '@varshyl/team-management';

/**
 * Demo adapter — intentionally simple.
 * Returns hardcoded values because demo-host is a verification harness,
 * not a real product. Real products implement this properly.
 */
export const demoAdapter: ServerModuleAdapter = {
  getCurrentUserId: async (_req: Request) => 1,
  getOrganizationIdForUser: async (_userId: number) => 1,
  isUserOrgAdmin: async (_userId: number, _orgId: number) => true,
  logger: {
    info: (msg: string, meta?: Record<string, unknown>) =>
      console.log('[team-management]', msg, meta ?? ''),
    warn: (msg: string, meta?: Record<string, unknown>) =>
      console.warn('[team-management:warn]', msg, meta ?? ''),
    error: (msg: string, meta?: Record<string, unknown>) =>
      console.error('[team-management:error]', msg, meta ?? ''),
  },
};
