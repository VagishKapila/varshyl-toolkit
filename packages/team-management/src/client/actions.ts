import type { OrgRole, PublicMember, OrgHierarchyGroup } from './types.js';
import {
  addOrgMember as apiAddMember,
  updateOrgMember as apiUpdateMember,
  removeMember as apiRemoveMember,
  listMembers as apiListMembers,
  getOrgHierarchy as apiGetHierarchy,
} from './api.js';

export async function addMember(
  orgId: number,
  data: { email: string; role: OrgRole; name?: string }
): Promise<PublicMember> {
  return apiAddMember(orgId, data);
}

export async function updateMember(
  orgId: number,
  userId: number,
  data: { role?: OrgRole; name?: string }
): Promise<PublicMember> {
  return apiUpdateMember(orgId, userId, data);
}

export async function removeMember(orgId: number, userId: number): Promise<void> {
  return apiRemoveMember(orgId, userId);
}

export async function listMembers(orgId: number): Promise<PublicMember[]> {
  return apiListMembers(orgId);
}

export async function getHierarchy(orgId: number): Promise<OrgHierarchyGroup[]> {
  return apiGetHierarchy(orgId);
}

export const orgAdminActions = {
  addMember,
  updateMember,
  removeMember,
  listMembers,
};
