import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import {
  MembersPage,
  OrgSettingsPage,
  InvitationAcceptPage,
  InvitationCodePage,
  AuditLogPage,
  OwnershipTransferPage,
  EmailChangePage,
  PasswordResetRequestPage,
  PasswordResetPage,
  SuperAdminDashboard,
} from '@varshyl/team-management/client';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DemoUser {
  id: number;
  name: string;
  email: string;
}

// ── Demo Login Page ────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<number, string> = {
  1: 'Owner',
  2: 'Admin',
  3: 'Member',
  4: 'Viewer',
  5: 'Unaffiliated',
};

function DemoLoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/demo/users')
      .then(r => r.json())
      .then(setUsers)
      .catch(console.error);
  }, []);

  const loginAs = async (userId: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/demo/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        credentials: 'include',
      });
      if (res.ok) {
        navigate('/team/members');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Demo Login</h1>
        <p className="text-slate-500 text-sm">
          Select a user to log in as. All users share password:{' '}
          <code className="bg-slate-100 px-1 rounded text-xs">demo1234</code>
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {users.map(u => (
          <button
            key={u.id}
            onClick={() => loginAs(u.id)}
            disabled={loading}
            className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-orange-400 hover:shadow-sm transition-all text-left disabled:opacity-50"
          >
            <div>
              <div className="font-medium text-slate-900">{u.name}</div>
              <div className="text-xs text-slate-500">{u.email}</div>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-600">
              {ROLE_LABELS[u.id] ?? 'User'}
            </span>
          </button>
        ))}
      </div>

      <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
        ← Back to home
      </Link>
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────

function DemoNav(): React.ReactElement {
  const navigate = useNavigate();
  const [whoami, setWhoami] = useState<DemoUser | null>(null);

  useEffect(() => {
    fetch('/api/demo/whoami', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(setWhoami)
      .catch(() => setWhoami(null));
  }, []);

  const logout = async () => {
    await fetch('/api/demo/logout', { method: 'POST', credentials: 'include' });
    setWhoami(null);
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="font-semibold text-orange-400 hover:text-orange-300 transition-colors">
          varshyl-toolkit
        </Link>
        <Link to="/team/members" className="text-sm text-slate-300 hover:text-white transition-colors">
          Team
        </Link>
        <Link to="/team/audit" className="text-sm text-slate-300 hover:text-white transition-colors">
          Audit
        </Link>
        <Link to="/admin" className="text-sm text-slate-300 hover:text-white transition-colors">
          Admin
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {whoami ? (
          <>
            <span className="text-xs text-slate-400">
              {whoami.name}
            </span>
            <button
              onClick={logout}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Switch user
            </button>
          </>
        ) : (
          <Link to="/login" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
            Login →
          </Link>
        )}
      </div>
    </nav>
  );
}

// ── Layout with Nav ────────────────────────────────────────────────────────────

function WithNav({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="min-h-screen bg-slate-50">
      <DemoNav />
      <main>{children}</main>
    </div>
  );
}

// ── Home Page ──────────────────────────────────────────────────────────────────

function HomePage(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 min-h-[calc(100vh-52px)]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">varshyl-toolkit</h1>
        <p className="text-slate-500 text-sm">
          Demo host — verification harness for{' '}
          <code className="text-orange-600 text-xs">@varshyl/team-management</code> v0.1.0
        </p>
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        <a
          href="/api/health"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors"
        >
          /api/health
        </a>
        <a
          href="/api/team/health"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors"
        >
          /api/team/health
        </a>
        <Link
          to="/login"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-500 transition-colors"
        >
          Demo Login →
        </Link>
        <Link
          to="/team/members"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-500 transition-colors"
        >
          Team Members →
        </Link>
      </div>

      <div className="mt-4 text-center text-xs text-slate-400 space-y-1">
        <p>varshyl-toolkit v0.1.0 · @varshyl/team-management first feature release</p>
        <p>
          Demo users: sarah / mike / jane / tom / alex @ demo.varshyl.com · password: demo1234
        </p>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

export default function App(): React.ReactElement {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<DemoLoginPage />} />

      {/* Home */}
      <Route path="/" element={<WithNav><HomePage /></WithNav>} />

      {/* Team */}
      <Route path="/team" element={<Navigate to="/team/members" replace />} />
      <Route path="/team/members" element={<WithNav><MembersPage /></WithNav>} />
      <Route path="/team/settings" element={<WithNav><OrgSettingsPage /></WithNav>} />
      <Route path="/team/invites/accept" element={<WithNav><InvitationAcceptPage /></WithNav>} />
      <Route path="/team/invites/code" element={<WithNav><InvitationCodePage /></WithNav>} />
      <Route path="/team/audit" element={<WithNav><AuditLogPage /></WithNav>} />
      <Route path="/team/transfer" element={<WithNav><OwnershipTransferPage /></WithNav>} />
      <Route path="/team/email-change" element={<WithNav><EmailChangePage /></WithNav>} />

      {/* Password reset (no nav — standalone pages) */}
      <Route path="/password-reset" element={<PasswordResetRequestPage />} />
      <Route path="/password-reset/confirm" element={<PasswordResetPage />} />

      {/* Super admin */}
      <Route path="/admin" element={<WithNav><SuperAdminDashboard /></WithNav>} />
    </Routes>
  );
}
