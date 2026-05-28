import React from 'react';
import { Link } from 'react-router-dom';
import { DemoShell } from '../components/DemoShell.js';
import { shellStyles } from '../theme.js';

const screens = [
  { to: '/auth', label: 'Auth — sign in / sign up + password eye toggle' },
  { to: '/auth/forgot', label: 'Auth — forgot password' },
  { to: '/auth/reset', label: 'Auth — reset password' },
  { to: '/consent/signup', label: 'Consent — signup block (locked hybrid UX)' },
  { to: '/consent/welcome', label: 'Consent — welcome screen' },
  { to: '/consent/empty', label: 'Consent — empty state' },
  { to: '/payments/paywall', label: 'Payments — subscription paywall' },
  { to: '/payments/lapsed', label: 'Payments — read-only after lapse' },
  { to: '/team/people', label: 'Team — Org & People admin page' },
];

export function HomePage(): React.ReactElement {
  return (
    <DemoShell title="Toolkit live demo — all screens">
      <p className="max-w-2xl mb-6 text-sm leading-relaxed" style={{ color: shellStyles.brass }}>
        Click through every user-facing screen from the four @varshylinc packages. This demo runs
        entirely in your browser with mock services — no database, no API keys, no network calls
        to a backend.
      </p>
      <ul className="grid gap-3 max-w-2xl">
        {screens.map((screen) => (
          <li key={screen.to}>
            <Link
              to={screen.to}
              className="block rounded-lg border px-4 py-3 text-sm font-medium transition hover:shadow-sm"
              style={{ borderColor: '#E8DFD0', color: shellStyles.brick, backgroundColor: '#FFFDF8' }}
            >
              {screen.label}
            </Link>
          </li>
        ))}
      </ul>
    </DemoShell>
  );
}
