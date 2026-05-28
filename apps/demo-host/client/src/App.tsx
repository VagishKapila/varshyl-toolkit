import React, { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useSearchParams,
  Navigate,
} from 'react-router-dom';
import {
  MembersPage,
  OrgPeoplePage,
  OrgSettingsPage,
  InvitationAcceptPage,
  InvitationCodePage,
  AuditLogPage,
  OwnershipTransferPage,
  EmailChangePage,
  PasswordResetRequestPage,
  PasswordResetPage,
  SuperAdminDashboard,
} from '@varshylinc/team-management/client';
import {
  AuthSignInPage,
  AuthSignUpPage,
  AuthForgotPasswordPage,
  AuthResetPasswordPage,
  AuthAuthedPage,
} from './AuthDemo.js';
import { PaymentsDemoPage } from './PaymentsDemo.js';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DemoUser {
  id: number;
  name: string;
  email: string;
}

// ── Demo constants ─────────────────────────────────────────────────────────────
// Demo org is always ID 1 (seeded on boot)
const DEMO_ORG_ID = 1;

const ROLE_LABELS: Record<number, string> = {
  1: 'Owner',
  2: 'Admin',
  3: 'Member',
  4: 'Viewer',
  5: 'Unaffiliated',
};

// ── Demo Login Page ────────────────────────────────────────────────────────────

function DemoLoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/demo/users')
      .then(r => r.json() as Promise<DemoUser[]>)
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
      if (res.ok) navigate('/team/members');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Demo Login</h1>
        <p className="text-slate-500 text-sm">
          Select a user to log in as. Password:{' '}
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

function DemoNav({ whoami }: { whoami: DemoUser | null }): React.ReactElement {
  const navigate = useNavigate();

  const logout = async () => {
    await fetch('/api/demo/logout', { method: 'POST', credentials: 'include' });
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
        <Link to="/team/people" className="text-sm text-slate-300 hover:text-white transition-colors">
          People
        </Link>
        <Link to="/team/audit" className="text-sm text-slate-300 hover:text-white transition-colors">
          Audit
        </Link>
        {/* Admin nav only shown to super-admin (user 1 = Sarah in demo) */}
        {whoami?.id === 1 && (
          <Link to="/admin" className="text-sm text-slate-300 hover:text-white transition-colors">
            Admin
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {whoami ? (
          <>
            <span className="text-xs text-slate-400">{whoami.name}</span>
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

function WithNav({
  children,
  whoami,
}: {
  children: React.ReactNode;
  whoami: DemoUser | null;
}): React.ReactElement {
  return (
    <div className="min-h-screen bg-slate-50">
      <DemoNav whoami={whoami} />
      <main>{children}</main>
    </div>
  );
}

// ── Route wrappers (extract URL params and pass as props) ──────────────────────

function InvitationAcceptRoute({ isAuthenticated }: { isAuthenticated: boolean }): React.ReactElement {
  const { token } = useParams<{ token: string }>();
  return (
    <InvitationAcceptPage
      token={token ?? ''}
      isAuthenticated={isAuthenticated}
      loginUrl="/login"
      signupUrl="/login"
    />
  );
}

function EmailChangeVerifyRoute(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  return <EmailChangePage mode="verify" token={token} />;
}

function EmailChangeCancelRoute(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  return <EmailChangePage mode="cancel" token={token} />;
}

function PasswordResetConfirmRoute(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  return <PasswordResetPage token={token} />;
}

// ── Home Page ──────────────────────────────────────────────────────────────────

function HomePage(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 min-h-[calc(100vh-52px)]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">varshyl-toolkit</h1>
        <p className="text-slate-500 text-sm">
          Demo host — verification harness for{' '}
          <code className="text-orange-600 text-xs">@varshylinc/team-management</code> v0.2.0
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
          to="/auth/signin"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-500 transition-colors"
        >
          Auth Social →
        </Link>
        <Link
          to="/payments/demo"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-500 transition-colors"
        >
          Mobile Payments →
        </Link>
        <Link
          to="/team/members"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-500 transition-colors"
        >
          Team Members →
        </Link>
      </div>
      <p className="text-xs text-slate-400 mt-4">
        varshyl-toolkit v0.2.0 · @varshylinc/team-management org/people admin
      </p>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

export default function App(): React.ReactElement {
  const [whoami, setWhoami] = useState<DemoUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Load session on mount and after navigation
  useEffect(() => {
    fetch('/api/demo/whoami', { credentials: 'include' })
      .then(r => (r.ok ? r.json() as Promise<DemoUser> : null))
      .then(u => { setWhoami(u); setAuthChecked(true); })
      .catch(() => { setWhoami(null); setAuthChecked(true); });
  }, []);

  if (!authChecked) return <div className="min-h-screen bg-slate-50" />;

  const isAuthenticated = whoami !== null;

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<DemoLoginPage />} />

      {/* Home */}
      <Route
        path="/"
        element={<WithNav whoami={whoami}><HomePage /></WithNav>}
      />

      {/* Team — redirect /team → /team/members */}
      <Route path="/team" element={<Navigate to="/team/members" replace />} />

      {/* Team pages — all need orgId */}
      <Route
        path="/team/people"
        element={<WithNav whoami={whoami}><OrgPeoplePage orgId={DEMO_ORG_ID} /></WithNav>}
      />
      <Route
        path="/team/members"
        element={<WithNav whoami={whoami}><MembersPage orgId={DEMO_ORG_ID} /></WithNav>}
      />
      <Route
        path="/team/settings"
        element={<WithNav whoami={whoami}><OrgSettingsPage orgId={DEMO_ORG_ID} /></WithNav>}
      />
      <Route
        path="/team/invites/accept/:token"
        element={<WithNav whoami={whoami}><InvitationAcceptRoute isAuthenticated={isAuthenticated} /></WithNav>}
      />
      <Route
        path="/team/invites/code"
        element={<WithNav whoami={whoami}><InvitationCodePage /></WithNav>}
      />
      <Route
        path="/team/audit"
        element={<WithNav whoami={whoami}><AuditLogPage orgId={DEMO_ORG_ID} /></WithNav>}
      />
      <Route
        path="/team/transfer"
        element={<WithNav whoami={whoami}><OwnershipTransferPage orgId={DEMO_ORG_ID} /></WithNav>}
      />

      {/* Email change — 3 modes */}
      <Route
        path="/team/email-change"
        element={<WithNav whoami={whoami}><EmailChangePage mode="request" /></WithNav>}
      />
      <Route
        path="/team/email-change/verify"
        element={<WithNav whoami={whoami}><EmailChangeVerifyRoute /></WithNav>}
      />
      <Route
        path="/team/email-change/cancel"
        element={<WithNav whoami={whoami}><EmailChangeCancelRoute /></WithNav>}
      />

      {/* Auth social demo */}
      <Route path="/auth/signin" element={<AuthSignInPage />} />
      <Route path="/auth/signup" element={<AuthSignUpPage />} />
      <Route path="/auth/forgot-password" element={<AuthForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<AuthResetPasswordPage />} />
      <Route path="/auth/authed" element={<AuthAuthedPage />} />

      {/* Mobile payments demo */}
      <Route path="/payments/demo" element={<PaymentsDemoPage />} />

      {/* Password reset (standalone, no nav) */}
      <Route path="/password-reset" element={<PasswordResetRequestPage />} />
      <Route path="/password-reset/confirm" element={<PasswordResetConfirmRoute />} />

      {/* Super admin */}
      <Route
        path="/admin"
        element={<WithNav whoami={whoami}><SuperAdminDashboard /></WithNav>}
      />
    </Routes>
  );
}
