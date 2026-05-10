import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServerModule } from '@varshyl/team-management';
import { pool, testConnection } from './db.js';
import {
  demoAdapter,
  createDemoSession,
  destroyDemoSession,
  getDemoUserById,
  listDemoUsers,
} from './adapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const DEMO_HOST = process.env.DEMO_HOST ?? `http://localhost:${PORT}`;

// ── Demo data seed ─────────────────────────────────────────────────────────────

async function seedDemoData(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Upsert org
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

    // Upsert memberships
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

    // Upsert super-admin for Sarah Chen (user_id=1)
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

  // 2. Migrations
  console.log('[boot] Running migrations...');
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
    if (applied.length) console.log('[boot] Applied:', applied);
    if (skipped.length) console.log('[boot] Skipped:', skipped);
    console.log('[boot] Migrations complete ✓');
  } catch (err) {
    console.error('[boot] FATAL: Migration failed:', (err as Error).message);
    process.exit(1);
  }

  // 3. Seed demo data
  console.log('[boot] Seeding demo data...');
  await seedDemoData();

  // 4. Express app
  const app = express();
  app.use(express.json());

  // ── Demo auth endpoints ────────────────────────────────────────────────────

  // POST /api/demo/login { userId: number }
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

  // POST /api/demo/logout
  app.post('/api/demo/logout', (req, res) => {
    const raw = req.headers.cookie ?? '';
    const m = /(?:^|;\s*)tm_session=([^;]+)/.exec(raw);
    if (m) destroyDemoSession(decodeURIComponent(m[1]));
    res.clearCookie('tm_session');
    res.json({ ok: true });
  });

  // GET /api/demo/whoami
  app.get('/api/demo/whoami', async (req, res) => {
    const uid = await demoAdapter.getCurrentUserId(req);
    if (!uid) { res.status(401).json({ error: 'Not logged in' }); return; }
    const user = getDemoUserById(uid);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ id: user.id, name: user.name, email: user.email });
  });

  // GET /api/demo/users
  app.get('/api/demo/users', (_req, res) => {
    res.json(listDemoUsers());
  });

  // ── team-management router ─────────────────────────────────────────────────
  app.use('/api/team', tm.router);

  // ── Own health endpoint ────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'demo-host',
      version: '0.1.0',
      env: NODE_ENV,
      uptime: Math.floor(process.uptime()),
    });
  });

  // ── Serve React client ─────────────────────────────────────────────────────
  const clientDist = path.join(__dirname, '../client');
  if (NODE_ENV === 'production') {
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
    console.log('[boot]   GET  /api/health          → demo-host health');
    console.log('[boot]   GET  /api/team/health     → team-management health');
    console.log('[boot]   POST /api/demo/login      → login as demo user { userId }');
    console.log('[boot]   POST /api/demo/logout     → logout');
    console.log('[boot]   GET  /api/demo/whoami     → current session user');
    console.log('[boot]   GET  /api/demo/users      → list demo users');
    console.log('[boot]   GET  /                    → React shell');
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
