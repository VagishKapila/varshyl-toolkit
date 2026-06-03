export { OrgPeoplePage } from './pages/OrgPeoplePage.js';
export { MembersPage } from './pages/MembersPage.js';
export { OrgSettingsPage } from './pages/OrgSettingsPage.js';
export { InvitationAcceptPage } from './pages/InvitationAcceptPage.js';
export { InvitationCodePage } from './pages/InvitationCodePage.js';
export { AuditLogPage } from './pages/AuditLogPage.js';
export { OwnershipTransferPage } from './pages/OwnershipTransferPage.js';
export { EmailChangePage } from './pages/EmailChangePage.js';
export { PasswordResetRequestPage } from './pages/PasswordResetRequestPage.js';
export { PasswordResetPage } from './pages/PasswordResetPage.js';
export { SuperAdminDashboard } from './pages/SuperAdminDashboard.js';

// Components
export { RoleBadge } from './components/RoleBadge.js';
export { RoleSelect } from './components/RoleSelect.js';
export { MemberRow } from './components/MemberRow.js';
export { InviteForm } from './components/InviteForm.js';
export { InvitationCodeDisplay } from './components/InvitationCodeDisplay.js';
export { AuditEventRow } from './components/AuditEventRow.js';
export { DangerZoneCard } from './components/DangerZoneCard.js';
export { CascadePreview } from './components/CascadePreview.js';
export { PendingTransferBanner } from './components/PendingTransferBanner.js';

// Hooks
export { useOrgMembers } from './hooks/useOrgMembers.js';
export { useCurrentMembership } from './hooks/useCurrentMembership.js';
export { useMembers } from './hooks/useMembers.js';
export { usePendingInvitations } from './hooks/usePendingInvitations.js';
export { usePendingTransfer } from './hooks/usePendingTransfer.js';

export { orgAdminActions } from './actions.js';
export {
  TeamManagementThemeProvider,
  useTeamManagementTheme,
} from './team-management-theme.js';
export type { TeamManagementThemeProviderProps } from './team-management-theme.js';
export { getTeamTheme, setTeamTheme, DEFAULT_TEAM_THEME } from './theme.js';
export { DEFAULT_TEAM_APP_THEME } from './team-theme-config.js';
export type { TeamManagementTheme, TeamAppTheme } from './team-theme-config.js';

// API
export {
  setTmApiBase,
  getOrg,
  updateOrg,
  deleteOrg,
  listMembers,
  addOrgMember,
  updateOrgMember,
  getOrgHierarchy,
  removeMember,
  changeMemberRole,
  listInvitations,
  createInvitation,
  revokeInvitation,
  resendInvitation,
  getInvitationCode,
  acceptInvitationByToken,
  acceptInvitationByCode,
  getMyMembership,
  requestEmailChange,
  verifyEmailChange,
  cancelEmailChange,
  requestPasswordReset,
  resetPassword,
  getPendingTransfer,
  initiateTransfer,
  acceptTransfer,
  cancelTransfer,
  getAuditLog,
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
} from './api.js';

// Shared types (also exported from root for server-side consumers)
export type { TeamMember, TeamInvite } from '../shared/types.js';

// Types
export type {
  OrgRole,
  TransferStatus,
  PublicOrg,
  PublicMember,
  PendingInvitation,
  AuditEvent,
  OwnershipTransfer,
  CurrentMembership,
  SuperAdminOrgSummary,
  ApiError,
  OrgHierarchyGroup,
} from './types.js';
