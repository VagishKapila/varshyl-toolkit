import React from 'react';
import { getTeamTheme } from '../theme.js';

/** PHASE 2: seat assignment — see VARSHYL_TOOLKIT_ROADMAP.md §4 */
export function SeatUsagePanel({ memberCount }: { memberCount: number }): React.ReactElement {
  const theme = getTeamTheme();

  return (
    <section
      data-testid="seat-usage-panel"
      aria-disabled="true"
      className="rounded-lg border p-4 opacity-70 pointer-events-none select-none"
      style={{
        backgroundColor: theme.paper,
        borderColor: theme.brass,
        color: theme.ink,
        fontFamily: theme.fontBody,
      }}
    >
      <h2
        className="text-sm font-semibold mb-1"
        style={{ fontFamily: theme.fontHeading, color: theme.brick }}
      >
        Seat usage
      </h2>
      <p className="text-sm mb-2" style={{ color: theme.ink }}>
        Seats: unlimited during launch — paid seats coming soon.
      </p>
      <p className="text-xs" style={{ color: theme.brass }}>
        {memberCount} people on roster · assignment controls disabled until Phase 2 billing
      </p>
    </section>
  );
}
