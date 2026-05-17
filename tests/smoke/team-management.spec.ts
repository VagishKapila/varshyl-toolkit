/**
 * Smoke tests — @varshyl/team-management v0.1.0
 *
 * Runs against the live demo-host at DEMO_HOST_URL.
 * Login uses the demo API endpoint (POST /api/demo/login {userId})
 * which sets the tm_session cookie in the same browser context.
 *
 * Scenarios
 * ---------
 * S1 – Home page renders the toolkit version banner
 * S2 – Owner login → members page lists all 4 org members
 * S3 – Owner sees and can submit the invite form
 * S4 – Audit log page loads and shows at least one entry
 * S5 – Super-admin dashboard accessible; shows "Demo Construction Co."
 * S6 – Viewer (Tom Nakamura) cannot see the invite form or admin controls
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const EVIDENCE_DIR = 'qa-evidence/team-management-v0.1.0';

async function loginAs(page: Page, userId: number) {
  // POST via page.request so cookie is injected into the browser context
  const res = await page.request.post('/api/demo/login', {
    data: { userId },
  });
  expect(res.status()).toBe(200);
}

async function saveScreenshot(page: Page, filename: string) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, filename),
    fullPage: true,
  });
}

// ─── S1: Home page ──────────────────────────────────────────────────────────

test('S1 – home page renders varshyl-toolkit version banner', async ({ page }) => {
  await page.goto('/');
  await saveScreenshot(page, 'S1-home-page.png');
  await expect(page.getByText(/varshyl-toolkit/i)).toBeVisible();
});

// ─── S2: Owner login → members page ─────────────────────────────────────────

test('S2 – owner login shows all 4 org members', async ({ page }) => {
  await loginAs(page, 1); // Sarah Chen — Owner
  await page.goto('/team/members');
  await saveScreenshot(page, 'S2-members-page.png');

  // All 4 org members must be visible
  await expect(page.getByText('Sarah Chen')).toBeVisible();
  await expect(page.getByText('Mike Torres')).toBeVisible();
  await expect(page.getByText('Jane Williams')).toBeVisible();
  await expect(page.getByText('Tom Nakamura')).toBeVisible();
});

// ─── S3: Invite form visible and submittable ─────────────────────────────────

test('S3 – owner can see invite form and send an invitation', async ({ page }) => {
  await loginAs(page, 1); // Sarah Chen — Owner
  await page.goto('/team/members');

  // Invite form should be visible
  const emailInput = page.getByPlaceholder('colleague@company.com');
  await expect(emailInput).toBeVisible();

  // Fill and submit
  await emailInput.fill('smoke-test@example.com');
  await page.getByRole('button', { name: /send invite/i }).click();

  await saveScreenshot(page, 'S3-invite-sent.png');
  await expect(page.getByText(/invitation sent successfully/i)).toBeVisible();
});

// ─── S4: Audit log page ───────────────────────────────────────────────────────

test('S4 – audit log page loads with entries', async ({ page }) => {
  await loginAs(page, 1); // Sarah Chen — Owner
  await page.goto('/team/audit');
  await saveScreenshot(page, 'S4-audit-log.png');

  // Audit log must render (not error page)
  await expect(page).not.toHaveURL(/error/i);
  // At least one audit entry exists (seeded at boot)
  const rows = page.locator('table tbody tr, [data-testid="audit-row"], li[class*="audit"]');
  await expect(rows.first()).toBeVisible({ timeout: 10_000 });
});

// ─── S5: Super-admin dashboard ───────────────────────────────────────────────

test('S5 – super-admin can see org list with Demo Construction Co.', async ({ page }) => {
  await loginAs(page, 1); // Sarah Chen — Owner + super-admin
  await page.goto('/admin');
  await saveScreenshot(page, 'S5-super-admin-dashboard.png');

  await expect(page.getByText(/Demo Construction Co/i)).toBeVisible();
});

// ─── S6: Viewer role restrictions ────────────────────────────────────────────

test('S6 – viewer (Tom Nakamura) cannot see invite form or admin controls', async ({ page }) => {
  await loginAs(page, 4); // Tom Nakamura — Viewer
  await page.goto('/team/members');
  await saveScreenshot(page, 'S6-viewer-restrictions.png');

  // Tom can see the member list
  await expect(page.getByText('Sarah Chen')).toBeVisible();

  // Invite form must NOT be visible for a Viewer
  const emailInput = page.getByPlaceholder('colleague@company.com');
  await expect(emailInput).not.toBeVisible();

  // /admin should be inaccessible
  await page.goto('/admin');
  await saveScreenshot(page, 'S6-viewer-admin-blocked.png');
  // Should redirect away or show access denied — not show the org list
  await expect(page.getByText(/Demo Construction Co/i)).not.toBeVisible({ timeout: 5_000 });
});
