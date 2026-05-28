import type { Pool } from 'pg';
import type { ServerModuleAdapter, OrgRole, TmMembership } from './types.js';
import { addMember, removeMember, changeRole, validateRoleChange } from './services/memberships.service.js';
import { listOrgMembers as listRawMembers } from './services/organizations.service.js';

export interface OrgMemberRecord {
  membership: TmMembership;
  email: string;
  name?: string;
}

export interface OrgHierarchyGroup {
  role: OrgRole;
  members: OrgMemberRecord[];
}

const ROLE_ORDER: OrgRole[] = ['owner', 'admin', 'member', 'viewer'];

async function enrichMembers(
  pool: Pool,
  adapter: ServerModuleAdapter,
  orgId: number,
  opts?: { includeRemoved?: boolean }
): Promise<OrgMemberRecord[]> {
  const members = await listRawMembers(pool, orgId, opts);
  const users = await adapter.getUsersByIds(members.map((m) => m.user_id));
  const userMap = new Map(users.map((u) => [u.id, u]));
  return members.map((m) => ({
    membership: m,
    email: userMap.get(m.user_id)?.email ?? '',
    name: userMap.get(m.user_id)?.name,
  }));
}

/** List org members with host user profile fields (email, name). */
export async function listOrgMembers(
  pool: Pool,
  adapter: ServerModuleAdapter,
  orgId: number,
  opts?: { includeRemoved?: boolean }
): Promise<OrgMemberRecord[]> {
  return enrichMembers(pool, adapter, orgId, opts);
}

/** Members grouped by role for hierarchy display. */
export async function getOrgHierarchy(
  pool: Pool,
  adapter: ServerModuleAdapter,
  orgId: number
): Promise<OrgHierarchyGroup[]> {
  const records = await enrichMembers(pool, adapter, orgId);
  return ROLE_ORDER.map((role) => ({
    role,
    members: records.filter((r) => r.membership.role === role),
  })).filter((g) => g.members.length > 0);
}

export async function addOrgMember(
  pool: Pool,
  adapter: ServerModuleAdapter,
  params: {
    orgId: number;
    email: string;
    role: OrgRole;
    name?: string;
    addedByUserId: number;
    onInvite?: (data: {
      email: string;
      orgId: number;
      role: OrgRole;
      userId: number;
    }) => void | Promise<void>;
  }
): Promise<OrgMemberRecord> {
  const { orgId, email, role, name, onInvite } = params;
  let user = await adapter.findUserByEmail(email);
  if (!user) {
    user = await adapter.createUserFromInvite({ email, orgId, role });
  }
  if (name && adapter.updateUserName) {
    await adapter.updateUserName(user.id, name);
  }
  await addMember(pool, { orgId, userId: user.id, role });
  if (onInvite) {
    await onInvite({ email, orgId, role, userId: user.id });
  }
  const records = await enrichMembers(pool, adapter, orgId);
  const record = records.find((r) => r.membership.user_id === user!.id);
  if (!record) throw new Error('Failed to load new member');
  return record;
}

export async function updateOrgMember(
  pool: Pool,
  adapter: ServerModuleAdapter,
  params: {
    orgId: number;
    userId: number;
    actorUserId: number;
    actorRole: OrgRole;
    role?: OrgRole;
    name?: string;
  }
): Promise<OrgMemberRecord> {
  const { orgId, userId, actorUserId, actorRole, role, name } = params;
  if (role) {
    await validateRoleChange(pool, { orgId, actorRole, targetUserId: userId, newRole: role });
    await changeRole(pool, { orgId, userId, newRole: role, changedByUserId: actorUserId });
  }
  if (name && adapter.updateUserName) {
    await adapter.updateUserName(userId, name);
  }
  const records = await enrichMembers(pool, adapter, orgId);
  const record = records.find((r) => r.membership.user_id === userId);
  if (!record) throw new Error('Member not found');
  return record;
}

export async function removeOrgMember(
  pool: Pool,
  params: {
    orgId: number;
    userId: number;
    removedByUserId: number;
    reason?: string;
  }
): Promise<void> {
  await removeMember(pool, params);
}
