import React, { useState } from 'react';
import { useMembers } from '../hooks/useMembers.js';
import { usePendingInvitations } from '../hooks/usePendingInvitations.js';
import { usePendingTransfer } from '../hooks/usePendingTransfer.js';
import { useCurrentMembership } from '../hooks/useCurrentMembership.js';
import { MemberRow } from '../components/MemberRow.js';
import { InviteForm } from '../components/InviteForm.js';
import { PendingTransferBanner } from '../components/PendingTransferBanner.js';
import { RoleBadge } from '../components/RoleBadge.js';
import { removeMember, changeMemberRole, revokeInvitation, resendInvitation } from '../api.js';
import type { OrgRole } from '../types.js';

interface MembersPageProps {
  orgId: number;
}

type ActiveTab = 'active' | 'former' | 'invitations';

export function MembersPage({ orgId }: MembersPageProps) {
  const [tab, setTab] = useState<ActiveTab>('active');
  const { membership } = useCurrentMembership();
  const { members, loading: membersLoading, error: membersError, refresh: refreshMembers } = useMembers(orgId);
  const { members: formerMembers, loading: formerLoading, error: formerError } = useMembers(orgId, { includeFormer: true });
  const { invitations, loading: invLoading, error: invError, refresh: refreshInvitations } = usePendingInvitations(orgId);
  const { transfer, refresh: refreshTransfer } = usePendingTransfer(orgId);

  const currentRole: OrgRole = membership?.role ?? 'viewer';
  const canManage = currentRole === 'owner' || currentRole === 'admin';

  async function handleRemove(userId: number) {
    if (!confirm('Remove this member from the organization?')) return;
    try {
      await removeMember(orgId, userId);
      refreshMembers();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to remove member');
    }
  }

  async function handleRoleChange(userId: number, newRole: OrgRole) {
    try {
      await changeMemberRole(orgId, userId, newRole);
      refreshMembers();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to change role');
    }
  }

  async function handleRevoke(invitationId: number) {
    if (!confirm('Revoke this invitation?')) return;
    try {
      await revokeInvitation(orgId, invitationId);
      refreshInvitations();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to revoke invitation');
    }
  }

  async function handleResend(invitationId: number) {
    try {
      await resendInvitation(orgId, invitationId);
      alert('Invitation resent!');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to resend invitation');
    }
  }

  const activeMembers = members.filter((m) => !m.removed_at);
  const formerOnly = formerMembers.filter((m) => m.removed_at);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Team Members</h1>

      {transfer && membership && (
        <div className="mb-6">
          <PendingTransferBanner
            transfer={transfer}
            currentUserId={membership.user_id}
            orgId={orgId}
            onAction={refreshTransfer}
          />
        </div>
      )}

      {canManage && (
        <div className="mb-6">
          <InviteForm orgId={orgId} onSuccess={refreshInvitations} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-4">
        {(['active', 'invitations', 'former'] as ActiveTab[]).map((t) => (
          (t === 'former' || t === 'invitations') && !canManage ? null : (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'active' ? 'Active' : t === 'invitations' ? 'Pending Invitations' : 'Former Members'}
              {t === 'active' && (
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                  {activeMembers.length}
                </span>
              )}
              {t === 'invitations' && (
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600">
                  {invitations.length}
                </span>
              )}
            </button>
          )
        ))}
      </div>

      {/* Active Members Tab */}
      {tab === 'active' && (
        <div>
          {membersLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          )}
          {membersError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {membersError}
            </div>
          )}
          {!membersLoading && !membersError && (
            <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Member</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {activeMembers.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      currentUserRole={currentRole}
                      onRemove={handleRemove}
                      onRoleChange={handleRoleChange}
                    />
                  ))}
                  {activeMembers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                        No active members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pending Invitations Tab */}
      {tab === 'invitations' && canManage && (
        <div>
          {invLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          )}
          {invError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {invError}
            </div>
          )}
          {!invLoading && !invError && (
            <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Expires</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-900">{inv.email}</td>
                      <td className="py-3 px-4"><RoleBadge role={inv.role} /></td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleResend(inv.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Resend
                          </button>
                          <button
                            onClick={() => handleRevoke(inv.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invitations.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                        No pending invitations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Former Members Tab */}
      {tab === 'former' && canManage && (
        <div>
          {formerLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          )}
          {formerError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formerError}
            </div>
          )}
          {!formerLoading && !formerError && (
            <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Member</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Former Role</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Removed</th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {formerOnly.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">{member.name ?? member.email}</span>
                          {member.name && <span className="text-xs text-slate-400">{member.email}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4"><RoleBadge role={member.role} /></td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {member.removed_at ? new Date(member.removed_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {member.removal_reason ?? '—'}
                      </td>
                    </tr>
                  ))}
                  {formerOnly.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                        No former members.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
