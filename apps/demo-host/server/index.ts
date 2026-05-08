import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServerModule } from '@varshyl/team-management';
import { pool, testConnection } from './db.js';
import { demoAdapter } from './adapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const NODE_ENV = process.env.NODE_ENV ?? 'development';

async function boot(): Promise<void> {
  // ── Step 1: Connect to Postgres ───────────────────────────────────────────
  console.log('[boot] Connecting to Postgres...');
  try {
    await testConnection();
    console.log('[boot] Postgres connected ✓');
  } catch (err) {
    console.error('[boot] FATAL: Cannot connect to Postgres:', (err as Error).message);
    console.error('[boot] Refusing to start without DB. Check DATABASE_URL.');
    process.exit(1);
  }

  // ── Step 2: Run team-management migrations ────────────────────────────────
  console.log('[boot] Running team-management migrations...');
  const tm = createServerModule({
    adapter: demoAdapter,
    db: pool,
    config: {
      featureFlags: { enableInvites: false, enableAuditLog: false },
    },
  });

  try {
    const { applied, skipped } = await tm.runMigrations();
    if (applied.length > 0) console.log('[boot] Migrations applied:', applied);
    if (skipped.length > 0) console.log('[boot] Migrations skipped (already applied):', skipped);
    console.log('[boot] Migrations complete ✓');
  } catch (err) {
    console.error('[boot] FATAL: Migration failed:', (err as Error).message);
    console.error('[boot] Refusing to start with broken DB state.');
    process.exit(1);
  }

  // ── Step 3: Create Express app ────────────────────────────────────────────
  const app = express();
  app.use(express.json());

  // ── Step 4: Mount team-management router at /api/team ─────────────────────
  app.use('/api/team', tm.router);

  // ── Demo-host own health endpoint ─────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'demo-host',
      version: '0.0.1',
      env: NODE_ENV,
      uptime: Math.floor(process.uptime()),
    });
  });

  // ── Step 5: Serve built React client ──────────────────────────────────────
  const clientDist = path.join(__dirname, '../client'); // Vite outDir = dist/client/

  if (NODE_ENV === 'production') {
    app.use(express.static(clientDist));
    // SPA fallback — all non-API routes serve index.html
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Not found' });
      } else {
        res.sendFile(path.join(clientDist, 'index.html'));
      }
    });
  } else {
    app.get('/', (_req, res) => {
      res.send('<h1>demo-host dev mode — run Vite separately for client (pnpm --filter @varshyl/demo-host build:client)</h1>');
    });
  }

  // ── Step 6: Listen ────────────────────────────────────────────────────────
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[boot] demo-host listening on port ${PORT} (${NODE_ENV}) ✓`);
    console.log(`[boot] Endpoints:`);
    console.log(`[boot]   GET /api/health        → demo-host health`);
    console.log(`[boot]   GET /api/team/health   → team-management health`);
    console.log(`[boot]   GET /                  → React shell`);
    console.log(`[boot]   GET /team              → PlaceholderCard`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[boot] Shutting down gracefully...');
    await pool.end();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

boot().catch((err) => {
  console.error('[boot] Unhandled boot error:', err);
  process.exit(1);
});
