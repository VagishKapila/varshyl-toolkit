import React from 'react';
import type { OrgRole } from '../types.js';
import { useOrgMembers } from '../hooks/useOrgMembers.js';
import { useCurrentMembership } from '../hooks/useCurrentMembership.js';
import { AddMemberForm } from '../components/AddMemberForm.js';
import { OrgPeopleRoster } from '../components/OrgPeopleRoster.js';
import { SeatUsagePanel } from '../components/SeatUsagePanel.js';
import { useTeamManagementTheme } from '../team-management-theme.js';
import '../components/TeamManagementStyles.css';

export interface OrgPeoplePageProps {
  orgId: number;
  /** Optional hook for real email invites in Phase 2 — no-op by default. */
  onInvite?: (data: {
    email: string;
    orgId: number;
    role: OrgRole;
    userId: number;
  }) => void | Promise<void>;
  pageClassName?: string;
  headerClassName?: string;
}

export function OrgPeoplePage({
  orgId,
  onInvite,
  pageClassName = '',
  headerClassName = '',
}: OrgPeoplePageProps): React.ReactElement {
  const { cssVars } = useTeamManagementTheme();
  const { membership } = useCurrentMembership();
  const { hierarchy, loading, error, addMember, updateMember, removeMember, memberCount } =
    useOrgMembers(orgId);

  const currentRole = membership?.role ?? 'viewer';
  const canManage = currentRole === 'owner' || currentRole === 'admin';

  async function handleAdd(data: { email: string; role: OrgRole; name?: string }) {
    const added = await addMember(data);
    if (onInvite) {
      await onInvite({ email: data.email, orgId, role: data.role, userId: added.user_id });
    }
  }

  async function handleRoleChange(userId: number, role: OrgRole) {
    try {
      await updateMember(userId, { role });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update role');
    }
  }

  async function handleRemove(userId: number) {
    if (!confirm('Remove this person from the organization?')) return;
    try {
      await removeMember(userId);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to remove member');
    }
  }

  return (
    <div
      data-testid="org-people-page"
      className={`tm-page max-w-4xl mx-auto px-4 py-8 min-h-screen ${pageClassName}`.trim()}
      style={cssVars}
    >
      <header className={`mb-6 ${headerClassName}`.trim()}>
        <h1 className="tm-heading text-2xl font-bold mb-1">Org &amp; People</h1>
        <p className="text-sm tm-muted">
          Build your roster free during launch — billing enforcement arrives in Phase 2.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2">
          {canManage && <AddMemberForm onSubmit={handleAdd} />}
        </div>
        <SeatUsagePanel memberCount={memberCount} />
      </div>

      <div data-testid="org-people-count" className="text-sm mb-4 font-medium">
        {memberCount} {memberCount === 1 ? 'person' : 'people'} on roster
      </div>

      {loading && (
        <div data-testid="org-people-loading" className="py-12 text-center text-sm tm-muted">
          Loading roster…
        </div>
      )}
      {error && (
        <div className="tm-error rounded-md border px-4 py-3" data-testid="org-people-error">
          {error}
        </div>
      )}
      {!loading && !error && (
        <OrgPeopleRoster
          hierarchy={hierarchy}
          canManage={canManage}
          onRoleChange={handleRoleChange}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}
