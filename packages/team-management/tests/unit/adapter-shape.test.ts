import { describe, it, expect } from 'vitest';
import { ROLE_HIERARCHY, roleAtLeast } from '../../src/server/types.js';
import type {
  ServerModuleAdapter,
  OrgRole,
  TeamManagementConfig,
} from '../../src/server/types.js';

// ---------------------------------------------------------------------------
// Compile-time shape check: build a complete valid adapter literal.
// If any required method is missing or mis-typed, tsc will error here.
// ---------------------------------------------------------------------------
const mockAdapter: ServerModuleAdapter = {
  async getCurrentUserId(_req: unknown) {
    return 1;
  },
  async getOrganizationIdForUser(_userId: number) {
    return 1;
  },
  async isUserOrgAdmin(_userId: number, _orgId: number) {
    return false;
  },
  logger: {
    info: (..._args: unknown[]) => {},
    warn: (..._args: unknown[]) => {},
    error: (..._args: unknown[]) => {},
  },
  async getUserById(_userId: number) {
    return { id: 1, email: 'test@example.com', name: 'Test User' };
  },
  async getUsersByIds(_userIds: number[]) {
    return [{ id: 1, email: 'test@example.com' }];
  },
  async findUserByEmail(_email: string) {
    return { id: 1, email: 'test@example.com' };
  },
  async createUserFromInvite(_params: { email: string; orgId: number; role: OrgRole }) {
    return { id: 2, email: 'invited@example.com' };
  },
  async setUserPassword(_userId: number, _hash: string) {},
  async hashPassword(_plain: string) {
    return 'hashed';
  },
  async verifyPassword(_plain: string, _hash: string) {
    return true;
  },
  async invalidateAllUserSessions(_userId: number) {},
  async sendInviteEmail(_params: {
    to: string;
    orgName: string;
    inviterName: string;
    role: OrgRole;
    magicLinkUrl: string;
    code: string;
  }) {},
  async sendOwnershipTransferEmail(_params: {
    to: string;
    orgName: string;
    fromName: string;
    transferUrl: string;
  }) {},
  async sendEmailChangeVerification(_params: { to: string; verifyUrl: string }) {},
  async sendEmailChangeOldNotice(_params: { to: string; newEmail: string; cancelUrl: string }) {},
  async sendEmailChangedFinalNotice(_params: {
    to: string;
    oldEmail: string;
    newEmail: string;
  }) {},
  async sendPasswordResetEmail(_params: { to: string; resetUrl: string }) {},
  async sendOrgDeletionNotice(_params: {
    to: string;
    orgName: string;
    scheduledFor: string;
  }) {},
  async emitNotification(_params: { userId: number; type: string; payload: unknown }) {},
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ServerModuleAdapter — shape (v0.1.0)', () => {
  it('has getCurrentUserId', () => {
    expect(typeof mockAdapter.getCurrentUserId).toBe('function');
  });

  it('has getOrganizationIdForUser', () => {
    expect(typeof mockAdapter.getOrganizationIdForUser).toBe('function');
  });

  it('has isUserOrgAdmin', () => {
    expect(typeof mockAdapter.isUserOrgAdmin).toBe('function');
  });

  it('has logger with info, warn, error', () => {
    expect(typeof mockAdapter.logger.info).toBe('function');
    expect(typeof mockAdapter.logger.warn).toBe('function');
    expect(typeof mockAdapter.logger.error).toBe('function');
  });

  it('has getUserById', () => {
    expect(typeof mockAdapter.getUserById).toBe('function');
  });

  it('has getUsersByIds', () => {
    expect(typeof mockAdapter.getUsersByIds).toBe('function');
  });

  it('has findUserByEmail', () => {
    expect(typeof mockAdapter.findUserByEmail).toBe('function');
  });

  it('has createUserFromInvite', () => {
    expect(typeof mockAdapter.createUserFromInvite).toBe('function');
  });

  it('has setUserPassword', () => {
    expect(typeof mockAdapter.setUserPassword).toBe('function');
  });

  it('has hashPassword', () => {
    expect(typeof mockAdapter.hashPassword).toBe('function');
  });

  it('has verifyPassword', () => {
    expect(typeof mockAdapter.verifyPassword).toBe('function');
  });

  it('has invalidateAllUserSessions', () => {
    expect(typeof mockAdapter.invalidateAllUserSessions).toBe('function');
  });

  it('has sendInviteEmail', () => {
    expect(typeof mockAdapter.sendInviteEmail).toBe('function');
  });

  it('has sendOwnershipTransferEmail', () => {
    expect(typeof mockAdapter.sendOwnershipTransferEmail).toBe('function');
  });

  it('has sendEmailChangeVerification', () => {
    expect(typeof mockAdapter.sendEmailChangeVerification).toBe('function');
  });

  it('has sendEmailChangeOldNotice', () => {
    expect(typeof mockAdapter.sendEmailChangeOldNotice).toBe('function');
  });

  it('has sendEmailChangedFinalNotice', () => {
    expect(typeof mockAdapter.sendEmailChangedFinalNotice).toBe('function');
  });

  it('has sendPasswordResetEmail', () => {
    expect(typeof mockAdapter.sendPasswordResetEmail).toBe('function');
  });

  it('has sendOrgDeletionNotice', () => {
    expect(typeof mockAdapter.sendOrgDeletionNotice).toBe('function');
  });

  it('has emitNotification', () => {
    expect(typeof mockAdapter.emitNotification).toBe('function');
  });
});

describe('TeamManagementConfig — feature flags', () => {
  it('accepts config with all flags enabled', () => {
    const config: TeamManagementConfig = {
      adapter: mockAdapter,
      featureFlags: {
        enableInvites: true,
        enableAuditLog: true,
        enableOwnershipTransfer: true,
        enableEmailChange: true,
        enablePasswordReset: true,
        enableSuperAdmin: true,
        enableSharedAccess: true,
        enableHardDelete: true,
      },
    };
    expect(config.featureFlags?.enableInvites).toBe(true);
    expect(config.featureFlags?.enableAuditLog).toBe(true);
    expect(config.featureFlags?.enableOwnershipTransfer).toBe(true);
    expect(config.featureFlags?.enableEmailChange).toBe(true);
    expect(config.featureFlags?.enablePasswordReset).toBe(true);
    expect(config.featureFlags?.enableSuperAdmin).toBe(true);
    expect(config.featureFlags?.enableSharedAccess).toBe(true);
    expect(config.featureFlags?.enableHardDelete).toBe(true);
  });

  it('accepts config with all flags disabled', () => {
    const config: TeamManagementConfig = {
      adapter: mockAdapter,
      featureFlags: {
        enableInvites: false,
        enableAuditLog: false,
        enableOwnershipTransfer: false,
        enableEmailChange: false,
        enablePasswordReset: false,
        enableSuperAdmin: false,
        enableSharedAccess: false,
        enableHardDelete: false,
      },
    };
    expect(config.featureFlags?.enableInvites).toBe(false);
  });

  it('accepts config with no featureFlags (all optional)', () => {
    const config: TeamManagementConfig = {
      adapter: mockAdapter,
    };
    expect(config.featureFlags).toBeUndefined();
  });

  it('accepts config with partial featureFlags', () => {
    const config: TeamManagementConfig = {
      adapter: mockAdapter,
      featureFlags: {
        enableInvites: true,
      },
    };
    expect(config.featureFlags?.enableInvites).toBe(true);
    expect(config.featureFlags?.enableAuditLog).toBeUndefined();
  });
});

describe('OrgRole — valid type values', () => {
  it('owner is a valid OrgRole', () => {
    const role: OrgRole = 'owner';
    expect(role).toBe('owner');
  });

  it('admin is a valid OrgRole', () => {
    const role: OrgRole = 'admin';
    expect(role).toBe('admin');
  });

  it('member is a valid OrgRole', () => {
    const role: OrgRole = 'member';
    expect(role).toBe('member');
  });

  it('viewer is a valid OrgRole', () => {
    const role: OrgRole = 'viewer';
    expect(role).toBe('viewer');
  });
});

describe('ROLE_HIERARCHY — numeric values', () => {
  it('owner = 40', () => {
    expect(ROLE_HIERARCHY['owner']).toBe(40);
  });

  it('admin = 30', () => {
    expect(ROLE_HIERARCHY['admin']).toBe(30);
  });

  it('member = 20', () => {
    expect(ROLE_HIERARCHY['member']).toBe(20);
  });

  it('viewer = 10', () => {
    expect(ROLE_HIERARCHY['viewer']).toBe(10);
  });
});

describe('roleAtLeast — permission matrix', () => {
  it('roleAtLeast("owner", "viewer") = true', () => {
    expect(roleAtLeast('owner', 'viewer')).toBe(true);
  });

  it('roleAtLeast("viewer", "admin") = false', () => {
    expect(roleAtLeast('viewer', 'admin')).toBe(false);
  });

  it('roleAtLeast("admin", "admin") = true (equal roles)', () => {
    expect(roleAtLeast('admin', 'admin')).toBe(true);
  });

  it('roleAtLeast("owner", "owner") = true', () => {
    expect(roleAtLeast('owner', 'owner')).toBe(true);
  });

  it('roleAtLeast("owner", "admin") = true', () => {
    expect(roleAtLeast('owner', 'admin')).toBe(true);
  });

  it('roleAtLeast("owner", "member") = true', () => {
    expect(roleAtLeast('owner', 'member')).toBe(true);
  });

  it('roleAtLeast("admin", "member") = true', () => {
    expect(roleAtLeast('admin', 'member')).toBe(true);
  });

  it('roleAtLeast("admin", "viewer") = true', () => {
    expect(roleAtLeast('admin', 'viewer')).toBe(true);
  });

  it('roleAtLeast("member", "member") = true', () => {
    expect(roleAtLeast('member', 'member')).toBe(true);
  });

  it('roleAtLeast("member", "viewer") = true', () => {
    expect(roleAtLeast('member', 'viewer')).toBe(true);
  });

  it('roleAtLeast("viewer", "viewer") = true', () => {
    expect(roleAtLeast('viewer', 'viewer')).toBe(true);
  });

  it('roleAtLeast("viewer", "member") = false', () => {
    expect(roleAtLeast('viewer', 'member')).toBe(false);
  });

  it('roleAtLeast("viewer", "owner") = false', () => {
    expect(roleAtLeast('viewer', 'owner')).toBe(false);
  });

  it('roleAtLeast("member", "admin") = false', () => {
    expect(roleAtLeast('member', 'admin')).toBe(false);
  });

  it('roleAtLeast("member", "owner") = false', () => {
    expect(roleAtLeast('member', 'owner')).toBe(false);
  });

  it('roleAtLeast("admin", "owner") = false', () => {
    expect(roleAtLeast('admin', 'owner')).toBe(false);
  });
});
