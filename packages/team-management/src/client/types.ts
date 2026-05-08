export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TransferStatus = 'pending' | 'accepted' | 'cancelled' | 'expired';

export interface PublicOrg {
  id: number;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface PublicMember {
  id: number;
  user_id: number;
  org_id: number;
  role: OrgRole;
  email: string;
  name?: string;
  joined_at: string;
  removed_at?: string;
  removed_by_user_id?: number;
  removal_reason?: string;
}

export interface PendingInvitation {
  id: number;
  org_id: number;
  email: string;
  role: OrgRole;
  invited_by_user_id: number;
  expires_at: string;
  resent_count: number;
  created_at: string;
  code?: string; // decrypted, only returned to admins on explicit request
}

export interface AuditEvent {
  id: string;
  org_id: number | null;
  actor_user_id: number | null;
  actor_display_name: string; // 'Varshyl Support' for super_admin entries
  actor_type: 'user' | 'super_admin';
  action: string;
  target_type: string | null;
  target_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
}

export interface OwnershipTransfer {
  id: number;
  org_id: number;
  from_user_id: number;
  to_user_id: number;
  status: TransferStatus;
  initiated_at: string;
  expires_at: string;
}

export interface CurrentMembership {
  org: PublicOrg;
  user_id: number;
  role: OrgRole;
  joined_at: string;
}

export interface SuperAdminOrgSummary {
  id: number;
  name: string;
  slug: string;
  member_count: number;
  owner_email: string;
  deleted_at: string | null;
  created_at: string;
}

export type ApiError = { error: string; details?: string[] };
