import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServerModule } from '@varshylinc/team-management';
import {
  runMigrations as runOceMigrations,
  seedStandardConsents,
} from '@varshylinc/onboarding-consent-engine';
import { createMockAuthService } from '@varshylinc/auth-social';
import { pool, testConnection } from './db.js';
import {
  demoAdapter,
  createDemoSession,
  destroyDemoSession,
  getDemoUserById,
  listDemoUsers,
} from './adapter.js';
import { createConsentRouter } from './consent.js';
import { createAuthRouter } from './auth-social.js';
import { createMobilePaymentsRouter } from './mobile-payments.js';
import { createSorenDemoRouter } from './soren.js';
import { createHealthRouter } from './health.js';
import createGeoAuditRouter from './geo-audit.js';
import ttsRouter from './tts.js';
import type { NormalizedEvent } from '@varshylinc/mobile-payments';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const DEMO_HOST = process.env.DEMO_HOST ?? `http://localhost:${PORT}`;

const authCapture = { lastResetToken: null as string | null, lastResetEmail: null as string | null };
const authService = createMockAuthService(authCapture);
const paymentsEventCapture = { events: [] as NormalizedEvent[] };

// ── Demo data seed ─────────────────────────────────────────────────────────────

async function seedDemoData(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orgInsert = await client.query<{ id: number }>(`
      INSERT INTO tm_organizations (name, slug, owner_user_id, settings)
      VALUES ('Demo Construction Co.', 'demo-construction-co', 1, '{}')
      ON CONFLICT (slug) WHERE deleted_at IS NULL DO NOTHING
      RETURNING id
    `);

    let orgId: number;
    if (orgInsert.rows.length > 0) {
      orgId = orgInsert.rows[0].id;
      console.log(`[seed] Org created id=${orgId}`);
    } else {
      const found = await client.query<{ id: number }>(
        `SELECT id FROM tm_organizations WHERE slug = 'demo-construction-co' AND deleted_at IS NULL`
      );
      orgId = found.rows[0].id;
      console.log(`[seed] Org already exists id=${orgId}`);
    }

    const members: Array<{ userId: number; role: string }> = [
      { userId: 1, role: 'owner' },
      { userId: 2, role: 'admin' },
      { userId: 3, role: 'member' },
      { userId: 4, role: 'viewer' },
    ];

    for (const { userId, role } of members) {
      await client.query(
        `INSERT INTO tm_memberships (org_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (org_id, user_id) WHERE removed_at IS NULL DO NOTHING`,
        [orgId, userId, role]
      );
    }
    console.log('[seed] Memberships: Sarah(owner), Mike(admin), Jane(member), Tom(viewer) ✓');

    await client.query(
      `INSERT INTO tm_super_admins (user_id, granted_at)
       VALUES (1, NOW())
       ON CONFLICT (user_id) DO NOTHING`
    );
    console.log('[seed] Super-admin: Sarah Chen (id=1) ✓');

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] Seed failed (non-fatal):', (err as Error).message);
  } finally {
    client.release();
  }
}

// ── Boot ───────────────────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  // 1. Postgres
  console.log('[boot] Connecting to Postgres...');
  try {
    await testConnection();
    console.log('[boot] Postgres connected ✓');
  } catch (err) {
    console.error('[boot] FATAL: Cannot connect to Postgres:', (err as Error).message);
    process.exit(1);
  }

  // 2. team-management migrations
  console.log('[boot] Running team-management migrations...');
  const tm = createServerModule({
    adapter: demoAdapter,
    db: pool,
    config: {
      baseUrl: DEMO_HOST,
      featureFlags: {
        enableInvites: true,
        enableAuditLog: true,
        enableOwnershipTransfer: true,
        enableEmailChange: true,
        enablePasswordReset: true,
        enableSuperAdmin: true,
        enableSharedAccess: false,
        enableHardDelete: false,
      },
    },
  });

  try {
    const { applied, skipped } = await tm.runMigrations();
    if (applied.length) console.log('[boot] TM applied:', applied);
    if (skipped.length) console.log('[boot] TM skipped:', skipped);
    console.log('[boot] team-management migrations complete ✓');
  } catch (err) {
    console.error('[boot] FATAL: team-management migration failed:', (err as Error).message);
    process.exit(1);
  }

  // 3. onboarding-consent-engine migrations + seed
  console.log('[boot] Running onboarding-consent-engine migrations...');
  try {
    const { applied, skipped } = await runOceMigrations(pool);
    if (applied.length) console.log('[boot] OCE applied:', applied);
    if (skipped.length) console.log('[boot] OCE skipped:', skipped);
    console.log('[boot] OCE migrations complete ✓');
    await seedStandardConsents(pool, 'ConstructInv');
    console.log('[boot] OCE standard consents seeded ✓');
  } catch (err) {
    console.error('[boot] FATAL: OCE migration/seed failed:', (err as Error).message);
    process.exit(1);
  }

  // 4. mobile-payments migrations
  console.log('[boot] Running mobile-payments migrations...');
  try {
    const { runMigrations: runMpMigrations } = await import('@varshylinc/mobile-payments');
    const mpResult = await runMpMigrations(pool);
    if (mpResult.applied.length) console.log('[boot] MP applied:', mpResult.applied);
    if (mpResult.skipped.length) console.log('[boot] MP skipped:', mpResult.skipped);
    console.log('[boot] mobile-payments migrations complete ✓');
  } catch (err) {
    console.error('[boot] FATAL: mobile-payments migration failed:', (err as Error).message);
    process.exit(1);
  }

  // 5. Seed demo data
  console.log('[boot] Seeding demo data...');
  await seedDemoData();

  // 6. Express app
  const app = express();
  app.use(express.json());

  // ── Readiness probe — responds only after all migrations + seed complete ───
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ready' });
  });

  // ── Demo auth endpoints ────────────────────────────────────────────────────

  app.post('/api/demo/login', (req, res) => {
    const { userId } = req.body as { userId?: number };
    const user = userId ? getDemoUserById(userId) : undefined;
    if (!user) {
      res.status(400).json({ error: 'Invalid userId. Valid IDs: 1–5.' });
      return;
    }
    const sid = createDemoSession(user.id);
    res.cookie('tm_session', sid, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: NODE_ENV === 'production',
    });
    res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  });

  app.post('/api/demo/logout', (req, res) => {
    const raw = req.headers.cookie ?? '';
    const m = /(?:^|;\s*)tm_session=([^;]+)/.exec(raw);
    if (m) destroyDemoSession(decodeURIComponent(m[1]));
    res.clearCookie('tm_session');
    res.json({ ok: true });
  });

  app.get('/api/demo/whoami', async (req, res) => {
    const uid = await demoAdapter.getCurrentUserId(req);
    if (!uid) { res.status(401).json({ error: 'Not logged in' }); return; }
    const user = getDemoUserById(uid);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ id: user.id, name: user.name, email: user.email });
  });

  app.get('/api/demo/users', (_req, res) => {
    res.json(listDemoUsers());
  });

  // ── team-management router ─────────────────────────────────────────────────
  app.use('/api/team', tm.router);

  // ── onboarding-consent-engine router ──────────────────────────────────────
  app.use('/api/consent', createConsentRouter(pool));

  // ── auth-social router (mock-backed for demo/smoke) ──────────────────────────
  app.use('/api/auth', createAuthRouter(authService, authCapture));

  // ── mobile-payments router (mock-backed for demo/smoke) ────────────────────
  app.use(
    '/api/payments',
    createMobilePaymentsRouter(pool, {
      product: {
        productSlug: 'jobsiteintel',
        entitlementId: 'premium',
        monthlyProductId: 'jobsiteintel_premium_monthly',
      },
    }, paymentsEventCapture)
  );

  // ── soren-screen router (keyword Q&A + portfolio demo) ─────────────────────
  app.use('/soren', createSorenDemoRouter());

  // ── Toolkit health dashboard (streaming NDJSON checks) ─────────────────────
  app.use('/api/health', createHealthRouter());

  // ── GEO audit scorer ────────────────────────────────────────────────────────
  app.use('/api/geo-audit', createGeoAuditRouter());

  // ── ElevenLabs TTS proxy ────────────────────────────────────────────────────
  app.use('/api/tts', ttsRouter);

  // ── Serve React client ─────────────────────────────────────────────────────
  const clientDist = path.join(__dirname, '../client');
  if (NODE_ENV === 'production' || NODE_ENV === 'test') {
    app.use(express.static(clientDist));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Not found' });
      } else {
        res.sendFile(path.join(clientDist, 'index.html'));
      }
    });
  } else {
    app.get('/', (_req, res) => {
      res.send('<h1>demo-host dev mode — run Vite separately for client</h1>');
    });
  }

  // ── Listen ─────────────────────────────────────────────────────────────────
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[boot] demo-host listening on :${PORT} (${NODE_ENV}) ✓`);
    console.log('[boot] Endpoints:');
    console.log('[boot]   GET  /healthz                     → readiness probe');
    console.log('[boot]   GET  /api/health                  → health + info');
    console.log('[boot]   GET  /api/health/run              → toolkit health checks (NDJSON stream)');
    console.log('[boot]   GET  /api/team/health             → team-management health');
    console.log('[boot]   POST /api/demo/login              → login as demo user { userId }');
    console.log('[boot]   POST /api/demo/logout             → logout');
    console.log('[boot]   GET  /api/demo/whoami             → current session user');
    console.log('[boot]   GET  /api/demo/users              → list demo users');
    console.log('[boot]   POST /api/geo-audit              → GEO AI discoverability score');
    console.log('[boot]   POST /api/tts                   → ElevenLabs TTS proxy');
    console.log('[boot]   GET  /api/consent/definitions     → OCE: all consent definitions');
    console.log('[boot]   POST /api/consent/signup          → OCE: record signup consents');
    console.log('[boot]   GET  /api/consent/status/:userId  → OCE: current status');
    console.log('[boot]   GET  /api/consent/pending/:userId → OCE: pending re-consents');
    console.log('[boot]   GET  /api/consent/audit/:userId   → OCE: audit trail');
    console.log('[boot]   POST /api/auth/signup              → auth-social: email signup');
    console.log('[boot]   POST /api/auth/signin              → auth-social: email signin');
    console.log('[boot]   POST /api/auth/signin/provider    → auth-social: social signin');
    console.log('[boot]   GET  /soren/qa                  → soren-screen: Q&A search');
    console.log('[boot]   GET  /soren/portfolio/:userId   → soren-screen: portfolio stats');
    console.log('[boot]   POST /soren/portfolio/:userId/pdf → soren-screen: PDF');
    console.log('[boot]   GET  /                            → React shell');
  });

  const shutdown = async () => {
    console.log('[boot] Graceful shutdown...');
    await pool.end();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

boot().catch(err => {
  console.error('[boot] Unhandled error:', err);
  process.exit(1);
});
