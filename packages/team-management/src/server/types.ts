import type { Request } from 'express';

/**
 * ServerModuleAdapter — implemented by the host product.
 *
 * The team-management module NEVER queries product tables directly.
 * Instead it calls these adapter methods, which the host product
 * implements using its own DB and auth system.
 *
 * This interface is a STUB. The real interface is designed in the
 * Team Management design chat. Defaults here are intentionally
 * minimal — add methods as features are built.
 */
export interface ServerModuleAdapter {
  /** Return the currently authenticated user's ID, or null if unauthenticated. */
  getCurrentUserId(req: Request): Promise<number | null>;

  /** Return the primary organization ID for a user, or null if none. */
  getOrganizationIdForUser(userId: number): Promise<number | null>;

  /** Return true if the user has admin rights for the given org. */
  isUserOrgAdmin(userId: number, orgId: number): Promise<boolean>;

  /** Logger interface — host provides its own logger (console, pino, winston, etc.) */
  logger: {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
  };
}

/** Feature flags consumed by team-management. All default to false in stub. */
export interface TeamManagementFeatureFlags {
  /** Enable team invite flows. Default: false (stub). */
  enableInvites?: boolean;
  /** Enable audit log recording. Default: false (stub). */
  enableAuditLog?: boolean;
}

/** Config passed to createServerModule. */
export interface TeamManagementConfig {
  featureFlags?: TeamManagementFeatureFlags;
}

/** Return type of createServerModule. */
export interface TeamManagementServerModule {
  router: import('express').Router;
  runMigrations: () => Promise<{ applied: string[]; skipped: string[] }>;
  health: import('express').RequestHandler;
}
