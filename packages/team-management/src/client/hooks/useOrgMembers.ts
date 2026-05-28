import { useState, useEffect, useCallback } from 'react';
import type { OrgRole, PublicMember, OrgHierarchyGroup } from '../types.js';
import { orgAdminActions } from '../actions.js';
import { getOrgHierarchy } from '../api.js';

export function useOrgMembers(orgId: number) {
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [hierarchy, setHierarchy] = useState<OrgHierarchyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, tree] = await Promise.all([
        orgAdminActions.listMembers(orgId),
        getOrgHierarchy(orgId),
      ]);
      setMembers(list);
      if (tree.length > 0) {
        setHierarchy(tree);
      } else {
        const roles: OrgRole[] = ['owner', 'admin', 'member', 'viewer'];
        setHierarchy(
          roles
            .map((role) => ({ role, members: list.filter((m) => m.role === role) }))
            .filter((g) => g.members.length > 0)
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addMember = useCallback(
    async (data: { email: string; role: OrgRole; name?: string }) => {
      const created = await orgAdminActions.addMember(orgId, data);
      await refresh();
      return created;
    },
    [orgId, refresh]
  );

  const updateMember = useCallback(
    async (userId: number, data: { role?: OrgRole; name?: string }) => {
      await orgAdminActions.updateMember(orgId, userId, data);
      await refresh();
    },
    [orgId, refresh]
  );

  const removeMember = useCallback(
    async (userId: number) => {
      await orgAdminActions.removeMember(orgId, userId);
      await refresh();
    },
    [orgId, refresh]
  );

  return {
    members,
    hierarchy,
    loading,
    error,
    refresh,
    addMember,
    updateMember,
    removeMember,
    memberCount: members.length,
  };
}
