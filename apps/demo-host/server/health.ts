import { Router } from 'express';
import { HEALTH_CHECKS } from './health-checks.js';
import type { HealthCheckResult } from './health-types.js';

async function runOneCheck(
  name: string,
  run: () => Promise<Omit<HealthCheckResult, 'duration' | 'check'>>,
): Promise<HealthCheckResult> {
  const start = performance.now();
  try {
    const outcome = await run();
    return { check: name, duration: Math.round(performance.now() - start), ...outcome };
  } catch (err) {
    return {
      check: name,
      status: 'fail',
      duration: Math.round(performance.now() - start),
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'demo-host',
      version: '0.1.0',
      env: process.env.NODE_ENV ?? 'development',
      uptime: Math.floor(process.uptime()),
    });
  });

  router.get('/run', async (_req, res) => {
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    for (const def of HEALTH_CHECKS) {
      const result = await runOneCheck(def.name, def.run);
      res.write(`${JSON.stringify(result)}\n`);
    }
    res.end();
  });

  return router;
}
