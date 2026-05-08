import React, { useState, useEffect } from 'react';
import {
  adminListOrgs,
  adminGetOrg,
  adminRestoreOrg,
  adminAppointOwner,
  adminHardDeleteOrg,
  adminAddMember,
  adminRemoveMember,
  adminLockUser,
  adminUnlockUser,
  adminResetPassword,
} from '../api.js';
import type { SuperAdminOrgSummary, PublicMember, OrgRole } from '../types.js';
import { RoleBadge } from '../components/RoleBadge.js';

interface ActionModalState {
  type:
    | 'restore'
    | 'appoint_owner'
    | 'hard_delete'
    | 'add_member'
    | 'remove_member'
    | 'lock_user'
    | 'unlock_user'
    | 'reset_password'
    | null;
  orgId?: number;
  userId?: number;
}

export function SuperAdminDashboard() {
  const [orgs, setOrgs] = useState<SuperAdminOrgSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedOrg, setExpandedOrg] = useState<number | null>(null);
  const [orgDetail, setOrgDetail] = useState<(SuperAdminOrgSummary & { members: PublicMember[] }) | null>(null);
  const [modal, setModal] = useState<ActionModalState>({ type: null });
  const [reason, setReason] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [addRole, setAddRole] = useState<OrgRole>('member');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    adminListOrgs()
      .then(setOrgs)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function expandOrg(id: number) {
    if (expandedOrg === id) { setExpandedOrg(null); setOrgDetail(null); return; }
    setExpandedOrg(id);
    setOrgDetail(null);
    try {
      const detail = await adminGetOrg(id);
      setOrgDetail(detail);
    } catch (e) {
      console.error(e);
    }
  }

  function openModal(type: ActionModalState['type'], orgId?: number, userId?: number) {
    setModal({ type, orgId, userId });
    setReason('');
    setTargetUserId('');
    setAddRole('member');
    setActionError(null);
    setActionSuccess(null);
  }

  async function handleAction() {
    if (!modal.type) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const uid = parseInt(targetUserId, 10);
      switch (modal.type) {
        case 'restore':
          await adminRestoreOrg(modal.orgId!);
          setActionSuccess('Organization restored.');
          break;
        case 'appoint_owner':
          await adminAppointOwner(modal.orgId!, uid, reason);
          setActionSuccess('Owner appointed.');
          break;
        case 'hard_delete':
          await adminHardDeleteOrg(modal.orgId!, reason);
          setActionSuccess('Organization hard-deleted.');
          break;
        case 'add_member':
          await adminAddMember(modal.orgId!, uid, addRole, reason);
          setActionSuccess('Member added.');
          break;
        case 'remove_member':
          await adminRemoveMember(modal.orgId!, modal.userId ?? uid, reason);
          setActionSuccess('Member removed.');
          break;
        case 'lock_user':
          await adminLockUser(modal.userId ?? uid, reason);
          setActionSuccess('User locked.');
          break;
        case 'unlock_user':
          await adminUnlockUser(modal.userId ?? uid, reason);
          setActionSuccess('User unlocked.');
          break;
        case 'reset_password':
          await adminResetPassword(modal.userId ?? uid, reason);
          setActionSuccess('Password reset email sent.');
          break;
      }
      // Refresh org list
      const updated = await adminListOrgs();
      setOrgs(updated);
      if (modal.orgId && expandedOrg === modal.orgId) {
        const detail = await adminGetOrg(modal.orgId);
        setOrgDetail(detail);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = orgs.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase()) ||
      o.owner_email.toLowerCase().includes(search.toLowerCase())
  );

  const modalTitles: Record<NonNullable<ActionModalState['type']>, string> = {
    restore: 'Restore Organization',
    appoint_owner: 'Appoint New Owner',
    hard_delete: 'Hard Delete Organization',
    add_member: 'Add Member',
    remove_member: 'Remove Member',
    lock_user: 'Lock User',
    unlock_user: 'Unlock User',
    reset_password: 'Reset User Password',
  };

  const needsTargetUser = (type: ActionModalState['type']) =>
    ['appoint_owner', 'add_member', 'lock_user', 'unlock_user', 'reset_password'].includes(type ?? '');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
          SUPER ADMIN
        </span>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orgs by name, slug, or owner email…"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((org) => (
            <div key={org.id} className="rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              {/* Org header row */}
              <div className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
                <button
                  onClick={() => expandOrg(org.id)}
                  className="flex-1 flex items-center gap-4 text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{org.name}</span>
                      <span className="text-xs text-slate-400 font-mono">/{org.slug}</span>
                      {org.deleted_at && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          Deleted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-0.5 text-xs text-slate-500">
                      <span>Owner: {org.owner_email}</span>
                      <span>{org.member_count} members</span>
                      <span>Created {new Date(org.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <svg
                    className={`h-4 w-4 text-slate-400 transition-transform ${expandedOrg === org.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Quick actions */}
                <div className="flex gap-2 shrink-0">
                  {org.deleted_at ? (
                    <button
                      onClick={() => openModal('restore', org.id)}
                      className="text-xs text-green-600 hover:text-green-800 font-medium border border-green-300 rounded px-2 py-1 hover:bg-green-50 transition-colors"
                    >
                      Restore
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => openModal('appoint_owner', org.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-300 rounded px-2 py-1 hover:bg-blue-50 transition-colors"
                      >
                        Appoint Owner
                      </button>
                      <button
                        onClick={() => openModal('add_member', org.id)}
                        className="text-xs text-slate-600 hover:text-slate-800 font-medium border border-slate-300 rounded px-2 py-1 hover:bg-slate-50 transition-colors"
                      >
                        Add Member
                      </button>
                      <button
                        onClick={() => openModal('hard_delete', org.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium border border-red-300 rounded px-2 py-1 hover:bg-red-50 transition-colors"
                      >
                        Hard Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded member list */}
              {expandedOrg === org.id && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                  {!orgDetail ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                      Loading members…
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-500 border-b border-slate-200">
                          <th className="pb-2 text-left font-medium">Member</th>
                          <th className="pb-2 text-left font-medium">Role</th>
                          <th className="pb-2 text-left font-medium">Joined</th>
                          <th className="pb-2 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orgDetail.members.map((m) => (
                          <tr key={m.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 pr-4">
                              <div>
                                <span className="font-medium text-slate-800">{m.name ?? m.email}</span>
                                {m.name && <span className="ml-2 text-xs text-slate-400">{m.email}</span>}
                              </div>
                            </td>
                            <td className="py-2 pr-4"><RoleBadge role={m.role} /></td>
                            <td className="py-2 pr-4 text-xs text-slate-500">
                              {new Date(m.joined_at).toLocaleDateString()}
                            </td>
                            <td className="py-2 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openModal('lock_user', org.id, m.user_id)}
                                  className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                                >
                                  Lock
                                </button>
                                <button
                                  onClick={() => openModal('unlock_user', org.id, m.user_id)}
                                  className="text-xs text-green-600 hover:text-green-800 font-medium"
                                >
                                  Unlock
                                </button>
                                <button
                                  onClick={() => openModal('reset_password', org.id, m.user_id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Reset PW
                                </button>
                                <button
                                  onClick={() => openModal('remove_member', org.id, m.user_id)}
                                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-8">No organizations found.</p>
          )}
        </div>
      )}

      {/* Action Modal */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {modalTitles[modal.type]}
            </h2>

            {needsTargetUser(modal.type) && !modal.userId && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Target User ID</label>
                <input
                  type="number"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="User ID"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {modal.type === 'add_member' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as OrgRole)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Provide a reason for this action (required for audit log)"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
            {actionSuccess && <p className="mb-3 text-sm text-green-600">{actionSuccess}</p>}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModal({ type: null })}
                disabled={submitting}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {actionSuccess ? 'Close' : 'Cancel'}
              </button>
              {!actionSuccess && (
                <button
                  onClick={handleAction}
                  disabled={submitting || !reason.trim()}
                  className={`rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    modal.type === 'hard_delete' || modal.type === 'remove_member' || modal.type === 'lock_user'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  {submitting ? 'Processing…' : 'Confirm'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
