import type { Request } from 'express';
import type { Pool } from 'pg';

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';
export type AuditActorType = 'user' | 'super_admin';
export type TransferStatus = 'pending' | 'accepted' | 'cancelled' | 'expired';

export interface TmOrganization {
  id: number;
  name: string;
  slug: string;
  owner_user_id: number;
  settings: Record<string, unknown>;
  deleted_at: Date | null;
  delete_scheduled_for: Date | null;
  deleted_by_user_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface TmMembership {
  id: number;
  org_id: number;
  user_id: number;
  role: OrgRole;
  joined_at: Date;
  removed_at: Date | null;
  removed_by_user_id: number | null;
  removal_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TmInvitation {
  id: number;
  org_id: number;
  invited_by_user_id: number;
  email: string;
  role: OrgRole;
  token_hash: string;
  code_encrypted: string;
  expires_at: Date;
  accepted_at: Date | null;
  revoked_at: Date | null;
  revoked_by_user_id: number | null;
  resent_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface TmAuditEvent {
  id: string;
  org_id: number | null;
  actor_user_id: number | null;
  actor_type: AuditActorType;
  action: string;
  target_type: string | null;
  target_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  reason: string | null;
  created_at: Date;
}

export interface TmOwnershipTransfer {
  id: number;
  org_id: number;
  from_user_id: number;
  to_user_id: number;
  status: TransferStatus;
  initiated_at: Date;
  accepted_at: Date | null;
  cancelled_at: Date | null;
  cancelled_by_user_id: number | null;
  expires_at: Date;
}

export interface TmPasswordResetRequest {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export interface ServerModuleAdapter {
  // v0.0.1
  getCurrentUserId(req: Request): Promise<number | null>;
  getOrganizationIdForUser(userId: number): Promise<number | null>;
  isUserOrgAdmin(userId: number, orgId: number): Promise<boolean>;
  logger: {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
  };
  // v0.1.0 additions
  getUserById(userId: number): Promise<{ id: number; email: string; name?: string } | null>;
  getUsersByIds(userIds: number[]): Promise<Array<{ id: number; email: string; name?: string }>>;
  findUserByEmail(email: string): Promise<{ id: number; email: string } | null>;
  createUserFromInvite(data: { email: string; orgId: number; role: OrgRole }): Promise<{ id: number; email: string }>;
  setUserPassword(userId: number, passwordHash: string): Promise<void>;
  hashPassword(plaintext: string): Promise<string>;
  verifyPassword(plaintext: string, hash: string): Promise<boolean>;
  invalidateAllUserSessions(userId: number): Promise<void>;
  sendInviteEmail(data: { to: string; orgName: string; inviterName: string; role: OrgRole; magicLinkUrl: string; code: string }): Promise<void>;
  sendOwnershipTransferEmail(data: { to: string; orgName: string; fromName: string; transferUrl: string }): Promise<void>;
  sendEmailChangeVerification(data: { to: string; verifyUrl: string }): Promise<void>;
  sendEmailChangeOldNotice(data: { to: string; newEmail: string; cancelUrl: string }): Promise<void>;
  sendEmailChangedFinalNotice(data: { to: string; oldEmail: string; newEmail: string }): Promise<void>;
  sendPasswordResetEmail(data: { to: string; resetUrl: string }): Promise<void>;
  sendOrgDeletionNotice(data: { to: string; orgName: string; scheduledFor: Date }): Promise<void>;
  emitNotification(data: { userId: number; type: string; payload: Record<string, unknown> }): Promise<void>;
}

export interface TeamManagementFeatureFlags {
  enableInvites?: boolean;
  enableAuditLog?: boolean;
  enableOwnershipTransfer?: boolean;
  enableEmailChange?: boolean;
  enablePasswordReset?: boolean;
  enableSuperAdmin?: boolean;
  enableSharedAccess?: boolean;
  enableHardDelete?: boolean;
}

export interface TeamManagementConfig {
  featureFlags?: TeamManagementFeatureFlags;
  baseUrl?: string;
}

export interface TeamManagementServerModule {
  router: import('express').Router;
  runMigrations(): Promise<{ applied: string[]; skipped: string[] }>;
}

// Role permission helpers
export const ROLE_HIERARCHY: Record<OrgRole, number> = { viewer: 0, member: 1, admin: 2, owner: 3 };

export function roleAtLeast(userRole: OrgRole, required: OrgRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}
