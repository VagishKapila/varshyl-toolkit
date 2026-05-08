import type {
  PublicOrg,
  PublicMember,
  PendingInvitation,
  CurrentMembership,
  OwnershipTransfer,
  AuditEvent,
  SuperAdminOrgSummary,
  OrgRole,
  ApiError,
} from './types.js';

export let TM_API_BASE = '/api/team';

export function setTmApiBase(base: string): void {
  TM_API_BASE = base;
}

async function fetchTm<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${TM_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  const data = await res.json().catch(() => ({ error: res.statusText }));

  if (!res.ok) {
    const err = data as ApiError;
    const msg = err.details ? `${err.error}: ${err.details.join(', ')}` : err.error;
    throw new Error(msg ?? `HTTP ${res.status}`);
  }

  return data as T;
}

// ─── Orgs ────────────────────────────────────────────────────────────────────

export async function getOrg(orgId: number): Promise<PublicOrg> {
  return fetchTm<PublicOrg>(`/orgs/${orgId}`);
}

export async function updateOrg(
  orgId: number,
  data: { name?: string; slug?: string }
): Promise<PublicOrg> {
  return fetchTm<PublicOrg>(`/orgs/${orgId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteOrg(orgId: number, confirmName: string): Promise<void> {
  return fetchTm<void>(`/orgs/${orgId}`, {
    method: 'DELETE',
    body: JSON.stringify({ confirmName }),
  });
}

export async function listMembers(
  orgId: number,
  opts?: { includeFormer?: boolean }
): Promise<PublicMember[]> {
  const qs = opts?.includeFormer ? '?includeFormer=true' : '';
  return fetchTm<PublicMember[]>(`/orgs/${orgId}/members${qs}`);
}

export async function removeMember(
  orgId: number,
  userId: number,
  reason?: string
): Promise<void> {
  return fetchTm<void>(`/orgs/${orgId}/members/${userId}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
}

export async function changeMemberRole(
  orgId: number,
  userId: number,
  newRole: OrgRole
): Promise<PublicMember> {
  return fetchTm<PublicMember>(`/orgs/${orgId}/members/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role: newRole }),
  });
}

// ─── Invitations ─────────────────────────────────────────────────────────────

export async function listInvitations(orgId: number): Promise<PendingInvitation[]> {
  return fetchTm<PendingInvitation[]>(`/orgs/${orgId}/invitations`);
}

export async function createInvitation(
  orgId: number,
  data: { email: string; role: OrgRole }
): Promise<PendingInvitation> {
  return fetchTm<PendingInvitation>(`/orgs/${orgId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function revokeInvitation(orgId: number, invitationId: number): Promise<void> {
  return fetchTm<void>(`/orgs/${orgId}/invitations/${invitationId}`, {
    method: 'DELETE',
  });
}

export async function resendInvitation(orgId: number, invitationId: number): Promise<void> {
  return fetchTm<void>(`/orgs/${orgId}/invitations/${invitationId}/resend`, {
    method: 'POST',
  });
}

export async function getInvitationCode(
  orgId: number,
  invitationId: number
): Promise<{ code: string }> {
  return fetchTm<{ code: string }>(`/orgs/${orgId}/invitations/${invitationId}/code`);
}

export async function acceptInvitationByToken(
  token: string
): Promise<{ orgId: number; role: OrgRole }> {
  return fetchTm<{ orgId: number; role: OrgRole }>(`/invitations/accept`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function acceptInvitationByCode(
  email: string,
  code: string
): Promise<{ orgId: number; role: OrgRole }> {
  return fetchTm<{ orgId: number; role: OrgRole }>(`/invitations/accept-code`, {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

// ─── Me / self-service ───────────────────────────────────────────────────────

export async function getMyMembership(): Promise<CurrentMembership> {
  return fetchTm<CurrentMembership>(`/me/membership`);
}

export async function requestEmailChange(newEmail: string): Promise<void> {
  return fetchTm<void>(`/me/email-change`, {
    method: 'POST',
    body: JSON.stringify({ newEmail }),
  });
}

export async function verifyEmailChange(token: string): Promise<void> {
  return fetchTm<void>(`/me/email-change/verify`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function cancelEmailChange(token: string): Promise<void> {
  return fetchTm<void>(`/me/email-change/cancel`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  return fetchTm<void>(`/password-reset/request`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  return fetchTm<void>(`/password-reset/confirm`, {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

// ─── Ownership transfer ───────────────────────────────────────────────────────

export async function getPendingTransfer(orgId: number): Promise<OwnershipTransfer | null> {
  return fetchTm<OwnershipTransfer | null>(`/orgs/${orgId}/transfer`);
}

export async function initiateTransfer(
  orgId: number,
  toUserId: number
): Promise<OwnershipTransfer> {
  return fetchTm<OwnershipTransfer>(`/orgs/${orgId}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ toUserId }),
  });
}

export async function acceptTransfer(orgId: number): Promise<void> {
  return fetchTm<void>(`/orgs/${orgId}/transfer/accept`, {
    method: 'POST',
  });
}

export async function cancelTransfer(orgId: number): Promise<void> {
  return fetchTm<void>(`/orgs/${orgId}/transfer/cancel`, {
    method: 'POST',
  });
}

// ─── Audit log ───────────────────────────────────────────────────────────────

export async function getAuditLog(
  orgId: number,
  opts?: { page?: number; limit?: number; action?: string }
): Promise<{ events: AuditEvent[]; total: number; page: number }> {
  const params = new URLSearchParams();
  if (opts?.page !== undefined) params.set('page', String(opts.page));
  if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
  if (opts?.action) params.set('action', opts.action);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return fetchTm<{ events: AuditEvent[]; total: number; page: number }>(
    `/orgs/${orgId}/audit-log${qs}`
  );
}

// ─── Super-admin ─────────────────────────────────────────────────────────────

export async function adminListOrgs(): Promise<SuperAdminOrgSummary[]> {
  return fetchTm<SuperAdminOrgSummary[]>(`/admin/orgs`);
}

export async function adminGetOrg(
  orgId: number
): Promise<SuperAdminOrgSummary & { members: PublicMember[] }> {
  return fetchTm<SuperAdminOrgSummary & { members: PublicMember[] }>(`/admin/orgs/${orgId}`);
}

export async function adminRestoreOrg(orgId: number): Promise<void> {
  return fetchTm<void>(`/admin/orgs/${orgId}/restore`, { method: 'POST' });
}

export async function adminAppointOwner(
  orgId: number,
  targetUserId: number,
  reason: string
): Promise<void> {
  return fetchTm<void>(`/admin/orgs/${orgId}/appoint-owner`, {
    method: 'POST',
    body: JSON.stringify({ targetUserId, reason }),
  });
}

export async function adminHardDeleteOrg(orgId: number, legalBasis: string): Promise<void> {
  return fetchTm<void>(`/admin/orgs/${orgId}/hard-delete`, {
    method: 'DELETE',
    body: JSON.stringify({ legalBasis }),
  });
}

export async function adminAddMember(
  orgId: number,
  userId: number,
  role: OrgRole,
  reason: string
): Promise<void> {
  return fetchTm<void>(`/admin/orgs/${orgId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId, role, reason }),
  });
}

export async function adminRemoveMember(
  orgId: number,
  userId: number,
  reason: string
): Promise<void> {
  return fetchTm<void>(`/admin/orgs/${orgId}/members/${userId}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
}

export async function adminLockUser(userId: number, reason: string): Promise<void> {
  return fetchTm<void>(`/admin/users/${userId}/lock`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function adminUnlockUser(userId: number, reason: string): Promise<void> {
  return fetchTm<void>(`/admin/users/${userId}/unlock`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function adminResetPassword(userId: number, reason: string): Promise<void> {
  return fetchTm<void>(`/admin/users/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
