/**
 * Shared types used by both server and client sides of team-management.
 * No Node.js or browser-specific APIs here.
 */

/** A team member as returned by the module's public API. */
export interface TeamMember {
  id: number;
  userId: number;
  organizationId: number;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string; // ISO 8601
}

/** An invite as returned by the module's public API (stub shape). */
export interface TeamInvite {
  id: number;
  organizationId: number;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
}
