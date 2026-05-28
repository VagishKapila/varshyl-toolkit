/**
 * team-management ephemeral smoke — Org/People admin page + roster CRUD.
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.DEMO_HOST_URL ?? 'http://localhost:3000';

async function loginAsOwner(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: /Sarah Chen/i }).click();
  await page.waitForURL('**/team/**');
}

test('S0: /healthz returns ready', async ({ request }) => {
  const res = await request.get(`${BASE}/healthz`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('ready');
});

test.describe.serial('Org/People admin', () => {
  test('S1: OrgPeoplePage renders the roster for a seeded org', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/team/people');
    await expect(page.getByTestId('org-people-page')).toBeVisible();
    await expect(page.getByTestId('org-people-count')).toContainText('people on roster');
    await expect(page.getByTestId('hierarchy-owner')).toBeVisible();
    await expect(page.getByText('Sarah Chen')).toBeVisible();
  });

  test('S2: add member by email appears in roster, count increments', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/team/people');
    const before = await page.getByTestId('org-people-count').innerText();
    const beforeCount = parseInt(before, 10);
    const email = `roster-${Date.now()}@example.com`;
    await page.getByTestId('add-member-email').fill(email);
    await page.getByTestId('add-member-submit').click();
    await expect(page.getByText(email)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('org-people-count')).toContainText(
      `${beforeCount + 1} people on roster`
    );
  });

  test('S3: edit member role reflected in hierarchy', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/team/people');
    const email = `role-edit-${Date.now()}@example.com`;
    await page.getByTestId('add-member-email').fill(email);
    await page.getByTestId('add-member-submit').click();
    await expect(page.getByText(email)).toBeVisible({ timeout: 10000 });
    const row = page.locator('[data-testid^="member-row-"]').filter({ hasText: email });
    await row.locator('select').selectOption('admin');
    await expect(page.getByTestId('hierarchy-admin').getByText(email)).toBeVisible({
      timeout: 10000,
    });
  });

  test('S4: remove member with confirm disappears, count decrements', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/team/people');
    const before = await page.getByTestId('org-people-count').innerText();
    const beforeCount = parseInt(before, 10);
    const email = `remove-${Date.now()}@example.com`;
    await page.getByTestId('add-member-email').fill(email);
    await page.getByTestId('add-member-submit').click();
    await expect(page.getByText(email)).toBeVisible({ timeout: 10000 });
    const row = page.locator('[data-testid^="member-row-"]').filter({ hasText: email });
    page.once('dialog', (d) => d.accept());
    await row.getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByText(email)).toHaveCount(0, { timeout: 10000 });
    await expect(page.getByTestId('org-people-count')).toContainText(
      `${beforeCount} people on roster`
    );
  });

  test('S5: seat-usage panel renders disabled coming-soon state', async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/team/people');
    const panel = page.getByTestId('seat-usage-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('aria-disabled', 'true');
    await expect(panel).toContainText('paid seats coming soon');
    await expect(panel).toHaveClass(/pointer-events-none/);
  });
});
