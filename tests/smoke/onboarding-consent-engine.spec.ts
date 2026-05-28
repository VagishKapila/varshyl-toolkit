/**
 * OCE ephemeral smoke — onboarding-consent-engine
 *
 * Runs against an ephemeral demo-host booted from the PR branch inside
 * the GitHub Actions runner. Not against Railway. See TOOLKIT_STANDARDS.md.
 *
 * Full consent-demo flow:
 *   render (GET /api/consent/definitions)
 *   → check required consents (assert required=true rows exist)
 *   → submit (POST /api/consent/signup)
 *   → assert DB row (GET /api/consent/audit/:userId)
 *   → assert pending empty (GET /api/consent/pending/:userId)
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.DEMO_HOST_URL ?? 'http://localhost:3000';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getDefinitions(request: Parameters<typeof test>[1] extends { request: infer R } ? R : never) {
  const res = await request.get(`${BASE}/api/consent/definitions`);
  expect(res.ok(), `GET /api/consent/definitions → ${res.status()}`).toBe(true);
  return (await res.json()) as Array<{
    id: number; key: string; version: number;
    required: boolean; display_text: string; legal_url: string | null;
  }>;
}

// ── S0: /healthz is reachable (confirms ephemeral server is up) ───────────────
test('S0: /healthz returns 200 (ephemeral demo-host is ready)', async ({ request }) => {
  const res = await request.get(`${BASE}/healthz`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('ready');
});

// ── S1–S5: Full consent-demo flow ────────────────────────────────────────────
test('full consent-demo flow — render → required check → submit → DB assert → pending empty', async ({ request }) => {
  const userId = `smoke-flow-${Date.now()}`;

  // S1: render — definitions endpoint returns all standard consents
  const definitions = await getDefinitions(request);
  expect(definitions.length).toBeGreaterThanOrEqual(4);
  const keys = definitions.map((d) => d.key);
  expect(keys).toContain('terms_of_service');
  expect(keys).toContain('privacy_policy');
  expect(keys).toContain('marketing_emails');
  expect(keys).toContain('ai_training');

  // S2: check required consents — at least 2 required=true definitions
  const requiredDefs = definitions.filter((d) => d.required);
  expect(requiredDefs.length).toBeGreaterThanOrEqual(2);
  const requiredKeys = requiredDefs.map((d) => d.key);
  expect(requiredKeys).toContain('terms_of_service');
  expect(requiredKeys).toContain('privacy_policy');

  // S3: submit — POST signup with all required + one optional
  const submitRes = await request.post(`${BASE}/api/consent/signup`, {
    data: {
      userId,
      consents: [
        { key: 'terms_of_service', granted: true },
        { key: 'privacy_policy', granted: true },
        { key: 'marketing_emails', granted: false },
      ],
      ipAddress: '127.0.0.1',
      userAgent: 'playwright-smoke',
    },
  });
  expect(submitRes.status(), 'POST /api/consent/signup should return 200').toBe(200);
  const records = await submitRes.json();
  expect(Array.isArray(records)).toBe(true);
  expect(records).toHaveLength(3);
  expect(records.every((r: { user_id: string }) => r.user_id === userId)).toBe(true);
  // All records have an id (confirm DB row was created)
  expect(records.every((r: { id: number }) => typeof r.id === 'number')).toBe(true);

  // S4: assert DB row — audit trail confirms rows persisted
  const auditRes = await request.get(`${BASE}/api/consent/audit/${userId}`);
  expect(auditRes.ok()).toBe(true);
  const trail = await auditRes.json();
  expect(trail.length).toBeGreaterThanOrEqual(3);
  expect(trail[0].user_id).toBe(userId);
  // Confirm oce_user_consents rows: terms and privacy granted, marketing not granted
  const byKey = Object.fromEntries(
    trail.map((e: { key: string; granted: boolean }) => [e.key, e.granted])
  );
  expect(byKey['terms_of_service']).toBe(true);
  expect(byKey['privacy_policy']).toBe(true);
  expect(byKey['marketing_emails']).toBe(false);

  // S5: assert pending empty — user has consented to all required
  const pendingRes = await request.get(`${BASE}/api/consent/pending/${userId}`);
  expect(pendingRes.ok()).toBe(true);
  const pending = await pendingRes.json();
  expect(pending, 'User should have no pending required consents after signup').toHaveLength(0);
});

// S7: hybrid signup — ai_training unchecked by default, still recorded explicitly
test('S7: hybrid signup records ai_training=false when checkbox unchecked', async ({ request }) => {
  const userId = `smoke-hybrid-${Date.now()}`;
  const submitRes = await request.post(`${BASE}/api/consent/signup`, {
    data: {
      userId,
      consents: [
        { key: 'terms_of_service', granted: true },
        { key: 'privacy_policy', granted: true },
        { key: 'ai_training', granted: false },
      ],
    },
  });
  expect(submitRes.status()).toBe(200);

  const auditRes = await request.get(`${BASE}/api/consent/audit/${userId}`);
  const trail = await auditRes.json();
  const byKey = Object.fromEntries(
    trail.map((e: { key: string; granted: boolean }) => [e.key, e.granted]),
  );
  expect(byKey['terms_of_service']).toBe(true);
  expect(byKey['privacy_policy']).toBe(true);
  expect(byKey['ai_training']).toBe(false);
});

// ── S6: Error path — unknown consent key returns 400 ─────────────────────────
test('S6: POST /api/consent/signup with unknown key returns 400', async ({ request }) => {
  const res = await request.post(`${BASE}/api/consent/signup`, {
    data: {
      userId: `smoke-err-${Date.now()}`,
      consents: [{ key: 'nonexistent_key_xyz', granted: true }],
    },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/Unknown consent key/);
});
