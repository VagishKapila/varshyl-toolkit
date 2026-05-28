import React from 'react';
import { Link } from 'react-router-dom';
import { OrgPeoplePage } from '@varshylinc/team-management/client';
import { DemoShell } from '../components/DemoShell.js';

export function TeamPeoplePage(): React.ReactElement {
  return (
    <DemoShell title="team-management — Org & People">
      <OrgPeoplePage orgId={1} />
      <p className="mt-6 text-sm text-center">
        <Link to="/" style={{ color: '#8B3A2F' }}>
          ← All screens
        </Link>
      </p>
    </DemoShell>
  );
}
