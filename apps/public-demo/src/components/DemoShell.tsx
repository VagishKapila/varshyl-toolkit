import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { shellStyles, TOOLKIT_THEME_NOTE } from '../theme.js';

interface DemoShellProps {
  title: string;
  children: React.ReactNode;
}

export function DemoShell({ title, children }: DemoShellProps): React.ReactElement {
  const location = useLocation();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: shellStyles.paper, color: shellStyles.ink, fontFamily: shellStyles.fontBody }}
    >
      <header
        className="border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3"
        style={{ borderColor: '#E8DFD0', backgroundColor: '#FFFDF8' }}
      >
        <div>
          <Link to="/" style={{ color: shellStyles.brick, fontFamily: shellStyles.fontHeading, fontWeight: 700 }}>
            Varshyl Toolkit Demo
          </Link>
          <p className="text-xs mt-0.5" style={{ color: shellStyles.brass }}>
            {TOOLKIT_THEME_NOTE}
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link to="/" className="underline" style={{ color: shellStyles.ink }}>
            Home
          </Link>
          {!location.pathname.startsWith('/auth') && (
            <Link to="/auth" className="underline" style={{ color: shellStyles.brick }}>
              Auth
            </Link>
          )}
        </nav>
      </header>
      <main className="px-4 py-6">
        <h1
          className="text-2xl font-bold mb-4"
          style={{ fontFamily: shellStyles.fontHeading, color: shellStyles.brick }}
        >
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
