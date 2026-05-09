import { describe, it, expect } from 'vitest';
import { roleAtLeast } from '../../src/server/types.js';
import type { OrgRole } from '../../src/server/types.js';

// ---------------------------------------------------------------------------
// Permission matrix from spec
//
// ACTION                              | OWNER | ADMIN | MEMBER | VIEWER
// ------------------------------------|-------|-------|--------|--------
// View org info                       | ✓     | ✓     | ✓      | ✓
// List members                        | ✓     | ✓     | ✓      | ✓
// View audit log                      | ✓     | ✓     | ✗      | ✗
// Edit org settings (name/slug)       | ✓     | ✓     | ✗      | ✗
// Invite member                       | ✓     | ✓     | ✗      | ✗
// Revoke pending invite               | ✓     | ✓     | ✗      | ✗
// Change member role (not owner)      | ✓     | ✓     | ✗      | ✗
// Change another admin's role         | ✓     | ✗     | ✗      | ✗
// Remove member (not owner)           | ✓     | ✓     | ✗      | ✗
// Remove an admin                     | ✓     | ✗     | ✗      | ✗
// Initiate ownership transfer         | ✓     | ✗     | ✗      | ✗
// Delete org                          | ✓     | ✗     | ✗      | ✗
// Change own email                    | ✓     | ✓     | ✓      | ✓
// Reset own password                  | ✓     | ✓     | ✓      | ✓
// ---------------------------------------------------------------------------

const ALL_ROLES: OrgRole[] = ['owner', 'admin', 'member', 'viewer'];

// Helper: given a minimum role, returns whether each role in ALL_ROLES can perform the action.
function canDo(minRole: OrgRole): Record<OrgRole, boolean> {
  return {
    owner: roleAtLeast('owner', minRole),
    admin: roleAtLeast('admin', minRole),
    member: roleAtLeast('member', minRole),
    viewer: roleAtLeast('viewer', minRole),
  };
}

// ---------------------------------------------------------------------------
// View org info — minimum role: viewer (all roles allowed)
// ---------------------------------------------------------------------------
describe('View org info', () => {
  const perms = canDo('viewer');

  it('owner can view org info', () => expect(perms.owner).toBe(true));
  it('admin can view org info', () => expect(perms.admin).toBe(true));
  it('member can view org info', () => expect(perms.member).toBe(true));
  it('viewer can view org info', () => expect(perms.viewer).toBe(true));
});

// ---------------------------------------------------------------------------
// List members — minimum role: viewer (all roles allowed)
// ---------------------------------------------------------------------------
describe('List members', () => {
  const perms = canDo('viewer');

  it('owner can list members', () => expect(perms.owner).toBe(true));
  it('admin can list members', () => expect(perms.admin).toBe(true));
  it('member can list members', () => expect(perms.member).toBe(true));
  it('viewer can list members', () => expect(perms.viewer).toBe(true));
});

// ---------------------------------------------------------------------------
// View audit log — minimum role: admin
// ---------------------------------------------------------------------------
describe('View audit log', () => {
  const perms = canDo('admin');

  it('owner can view audit log', () => expect(perms.owner).toBe(true));
  it('admin can view audit log', () => expect(perms.admin).toBe(true));
  it('member cannot view audit log', () => expect(perms.member).toBe(false));
  it('viewer cannot view audit log', () => expect(perms.viewer).toBe(false));
});

// ---------------------------------------------------------------------------
// Edit org settings (name/slug) — minimum role: admin
// ---------------------------------------------------------------------------
describe('Edit org settings (name/slug)', () => {
  const perms = canDo('admin');

  it('owner can edit org settings', () => expect(perms.owner).toBe(true));
  it('admin can edit org settings', () => expect(perms.admin).toBe(true));
  it('member cannot edit org settings', () => expect(perms.member).toBe(false));
  it('viewer cannot edit org settings', () => expect(perms.viewer).toBe(false));
});

// ---------------------------------------------------------------------------
// Invite member — minimum role: admin
// ---------------------------------------------------------------------------
describe('Invite member', () => {
  const perms = canDo('admin');

  it('owner can invite member', () => expect(perms.owner).toBe(true));
  it('admin can invite member', () => expect(perms.admin).toBe(true));
  it('member cannot invite member', () => expect(perms.member).toBe(false));
  it('viewer cannot invite member', () => expect(perms.viewer).toBe(false));
});

// ---------------------------------------------------------------------------
// Revoke pending invite — minimum role: admin
// ---------------------------------------------------------------------------
describe('Revoke pending invite', () => {
  const perms = canDo('admin');

  it('owner can revoke pending invite', () => expect(perms.owner).toBe(true));
  it('admin can revoke pending invite', () => expect(perms.admin).toBe(true));
  it('member cannot revoke pending invite', () => expect(perms.member).toBe(false));
  it('viewer cannot revoke pending invite', () => expect(perms.viewer).toBe(false));
});

// ---------------------------------------------------------------------------
// Change member role (not owner) — minimum role: admin
// ---------------------------------------------------------------------------
describe('Change member role (not owner)', () => {
  const perms = canDo('admin');

  it('owner can change member role', () => expect(perms.owner).toBe(true));
  it('admin can change member role', () => expect(perms.admin).toBe(true));
  it('member cannot change member role', () => expect(perms.member).toBe(false));
  it('viewer cannot change member role', () => expect(perms.viewer).toBe(false));
});

// ---------------------------------------------------------------------------
// Change another admin's role — minimum role: owner
// ---------------------------------------------------------------------------
describe("Change another admin's role", () => {
  const perms = canDo('owner');

  it("owner can change another admin's role", () => expect(perms.owner).toBe(true));
  it("admin cannot change another admin's role", () => expect(perms.admin).toBe(false));
  it("member cannot change another admin's role", () => expect(perms.member).toBe(false));
  it("viewer cannot change another admin's role", () => expect(perms.viewer).toBe(false));
});

// ---------------------------------------------------------------------------
// Remove member (not owner) — minimum role: admin
// ---------------------------------------------------------------------------
describe('Remove member (not owner)', () => {
  const perms = canDo('admin');

  it('owner can remove member', () => expect(perms.owner).toBe(true));
  it('admin can remove member', () => expect(perms.admin).toBe(true));
  it('member cannot remove member', () => expect(perms.member).toBe(false));
  it('viewer cannot remove member', () => expect(perms.viewer).toBe(false));
});

// ---------------------------------------------------------------------------
// Remove an admin — minimum role: owner
// ---------------------------------------------------------------------------
describe('Remove an admin', () => {
  const perms = canDo('owner');

  it('owner can remove an admin', () => expect(perms.owner).toBe(true));
  it('admin cannot remove an admin', () => expect(perms.admin).toBe(false));
  it('member cannot remove an admin', () => expect(perms.member).toBe(false));
  it('viewer cannot remove an admin', () => expect(perms.viewer).toBe(false));
});

// ---------------------------------------------------------------------------
// Initiate ownership transfer — minimum role: owner
// ---------------------------------------------------------------------------
describe('Initiate ownership transfer', () => {
  const perms = canDo('owner');

  it('owner can initiate ownership transfer', () => expect(perms.owner).toBe(true));
  it('admin cannot initiate ownership transfer', () => expect(perms.admin).toBe(false));
  it('member cannot initiate ownership transfer', () => expect(perms.member).toBe(false));
  it('viewer cannot initiate ownership transfer', () => expect(perms.viewer).toBe(false));
});

// ---------------------------------------------------------------------------
// Delete org — minimum role: owner
// ---------------------------------------------------------------------------
describe('Delete org', () => {
  const perms = canDo('owner');

  it('owner can delete org', () => expect(perms.owner).toBe(true));
  it('admin cannot delete org', () => expect(perms.admin).toBe(false));
  it('member cannot delete org', () => expect(perms.member).toBe(false));
  it('viewer cannot delete org', () => expect(perms.viewer).toBe(false));
});

// ---------------------------------------------------------------------------
// Change own email — minimum role: viewer (all roles allowed)
// ---------------------------------------------------------------------------
describe('Change own email', () => {
  const perms = canDo('viewer');

  it('owner can change own email', () => expect(perms.owner).toBe(true));
  it('admin can change own email', () => expect(perms.admin).toBe(true));
  it('member can change own email', () => expect(perms.member).toBe(true));
  it('viewer can change own email', () => expect(perms.viewer).toBe(true));
});

// ---------------------------------------------------------------------------
// Reset own password — minimum role: viewer (all roles allowed)
// ---------------------------------------------------------------------------
describe('Reset own password', () => {
  const perms = canDo('viewer');

  it('owner can reset own password', () => expect(perms.owner).toBe(true));
  it('admin can reset own password', () => expect(perms.admin).toBe(true));
  it('member can reset own password', () => expect(perms.member).toBe(true));
  it('viewer can reset own password', () => expect(perms.viewer).toBe(true));
});

// ---------------------------------------------------------------------------
// Cross-cutting: exhaustive matrix spot-checks
// ---------------------------------------------------------------------------
describe('Full permission matrix — exhaustive spot-checks', () => {
  it('owner has highest privilege (passes all checks)', () => {
    for (const role of ALL_ROLES) {
      expect(roleAtLeast('owner', role)).toBe(true);
    }
  });

  it('viewer has lowest privilege (only passes viewer check)', () => {
    expect(roleAtLeast('viewer', 'viewer')).toBe(true);
    expect(roleAtLeast('viewer', 'member')).toBe(false);
    expect(roleAtLeast('viewer', 'admin')).toBe(false);
    expect(roleAtLeast('viewer', 'owner')).toBe(false);
  });

  it('admin passes admin and below, fails owner', () => {
    expect(roleAtLeast('admin', 'viewer')).toBe(true);
    expect(roleAtLeast('admin', 'member')).toBe(true);
    expect(roleAtLeast('admin', 'admin')).toBe(true);
    expect(roleAtLeast('admin', 'owner')).toBe(false);
  });

  it('member passes member and viewer, fails admin and owner', () => {
    expect(roleAtLeast('member', 'viewer')).toBe(true);
    expect(roleAtLeast('member', 'member')).toBe(true);
    expect(roleAtLeast('member', 'admin')).toBe(false);
    expect(roleAtLeast('member', 'owner')).toBe(false);
  });
});
