/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import React from 'react';
import * as Client from '@varshylinc/team-management/client';
import { expectNamedExport, expectNotOnBarrel } from '../../../../vitest/barrel-contract-helpers.js';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
      text: async () => '',
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('@varshylinc/team-management/client barrel', () => {
  it('exports the expected named symbols', () => {
    expectNamedExport(Client, 'OrgPeoplePage', 'function');
    expectNamedExport(Client, 'MembersPage', 'function');
    expectNamedExport(Client, 'OrgSettingsPage', 'function');
    expectNamedExport(Client, 'InvitationAcceptPage', 'function');
    expectNamedExport(Client, 'InvitationCodePage', 'function');
    expectNamedExport(Client, 'AuditLogPage', 'function');
    expectNamedExport(Client, 'OwnershipTransferPage', 'function');
    expectNamedExport(Client, 'EmailChangePage', 'function');
    expectNamedExport(Client, 'PasswordResetRequestPage', 'function');
    expectNamedExport(Client, 'PasswordResetPage', 'function');
    expectNamedExport(Client, 'SuperAdminDashboard', 'function');
    expectNamedExport(Client, 'RoleBadge', 'function');
    expectNamedExport(Client, 'RoleSelect', 'function');
    expectNamedExport(Client, 'MemberRow', 'function');
    expectNamedExport(Client, 'InviteForm', 'function');
    expectNamedExport(Client, 'InvitationCodeDisplay', 'function');
    expectNamedExport(Client, 'AuditEventRow', 'function');
    expectNamedExport(Client, 'DangerZoneCard', 'function');
    expectNamedExport(Client, 'CascadePreview', 'function');
    expectNamedExport(Client, 'PendingTransferBanner', 'function');
    expectNamedExport(Client, 'useOrgMembers', 'function');
    expectNamedExport(Client, 'useCurrentMembership', 'function');
    expectNamedExport(Client, 'useMembers', 'function');
    expectNamedExport(Client, 'usePendingInvitations', 'function');
    expectNamedExport(Client, 'usePendingTransfer', 'function');
    expectNamedExport(Client, 'orgAdminActions', 'const');
    expectNamedExport(Client, 'getTeamTheme', 'function');
    expectNamedExport(Client, 'setTeamTheme', 'function');
    expectNamedExport(Client, 'DEFAULT_TEAM_THEME', 'const');

    const apiFns = [
      'setTmApiBase',
      'getOrg',
      'updateOrg',
      'deleteOrg',
      'listMembers',
      'addOrgMember',
      'updateOrgMember',
      'getOrgHierarchy',
      'removeMember',
      'changeMemberRole',
      'listInvitations',
      'createInvitation',
      'revokeInvitation',
      'resendInvitation',
      'getInvitationCode',
      'acceptInvitationByToken',
      'acceptInvitationByCode',
      'getMyMembership',
      'requestEmailChange',
      'verifyEmailChange',
      'cancelEmailChange',
      'requestPasswordReset',
      'resetPassword',
      'getPendingTransfer',
      'initiateTransfer',
      'acceptTransfer',
      'cancelTransfer',
      'getAuditLog',
      'adminListOrgs',
      'adminGetOrg',
      'adminRestoreOrg',
      'adminAppointOwner',
      'adminHardDeleteOrg',
      'adminAddMember',
      'adminRemoveMember',
      'adminLockUser',
      'adminUnlockUser',
      'adminResetPassword',
    ] as const;
    for (const name of apiFns) {
      expectNamedExport(Client, name, 'function');
    }
  });

  it('does not export internal symbols', () => {
    expectNotOnBarrel(Client, 'createServerModule');
    expectNotOnBarrel(Client, 'runMigrations');
    expectNotOnBarrel(Client, 'ROLE_HIERARCHY');
    expectNotOnBarrel(Client, 'AddMemberForm');
  });

  it('renders exported React components without crashing', () => {
    render(
      <>
        <Client.RoleBadge role="member" />
        <Client.RoleSelect value="member" onChange={() => {}} />
        <Client.InviteForm orgId={1} onSuccess={() => {}} />
        <Client.OrgPeoplePage orgId={1} />
      </>,
    );
    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });
});
