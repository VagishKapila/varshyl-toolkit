import React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@varshylinc/onboarding-consent-engine/client';
import { DemoShell } from '../components/DemoShell.js';

export function ConsentEmptyPage(): React.ReactElement {
  return (
    <DemoShell title="onboarding-consent-engine — Empty state">
      <div className="max-w-md mx-auto rounded-xl border bg-white" style={{ borderColor: '#E8DFD0' }}>
        <EmptyState
          title="No consent history yet"
          description="Once users complete onboarding, their consent audit trail appears here."
          action={
            <Link
              to="/consent/welcome"
              className="inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: '#8B3A2F' }}
            >
              Start onboarding
            </Link>
          }
        />
      </div>
      <p className="mt-4 text-sm text-center">
        <Link to="/" style={{ color: '#8B3A2F' }}>
          ← All screens
        </Link>
      </p>
    </DemoShell>
  );
}
