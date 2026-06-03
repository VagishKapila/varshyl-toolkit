import React from 'react';
import { useTeamManagementTheme } from '../team-management-theme.js';
import './TeamManagementStyles.css';

export interface SeatUsagePanelProps {
  memberCount: number;
  panelClassName?: string;
}

export function SeatUsagePanel({
  memberCount,
  panelClassName = '',
}: SeatUsagePanelProps): React.ReactElement {
  const { cssVars } = useTeamManagementTheme();

  return (
    <div
      data-testid="seat-usage-panel"
      className={`tm-card p-4 ${panelClassName}`.trim()}
      style={cssVars}
    >
      <h3 className="tm-heading text-sm font-semibold mb-2">Seat usage</h3>
      <p className="text-sm mb-2" style={{ color: 'var(--tm-ink)' }}>
        {memberCount} {memberCount === 1 ? 'member' : 'members'} on roster
      </p>
      <p className="text-xs tm-muted">
        Launch phase — unlimited seats. Billing ties to mobile-payments in Phase 2.
      </p>
    </div>
  );
}
