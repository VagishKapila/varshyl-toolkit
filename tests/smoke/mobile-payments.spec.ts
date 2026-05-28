/**
 * mobile-payments ephemeral smoke — mock-backed Playwright UI tests.
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.DEMO_HOST_URL ?? 'http://localhost:3000';
const DEMO_ORG = 'demo-org-1';
const BUYER = 'user-1';
const OTHER = 'user-2';

test('S0: /healthz returns ready', async ({ request }) => {
  const res = await request.get(`${BASE}/healthz`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('ready');
});

test('S1–S6: paywall → subscribe → seat guard → lapse → restore → event', async ({
  page,
  request,
}) => {
  await page.goto('/payments/demo');
  await expect(page.getByTestId('paywall-screen')).toBeVisible();
  await expect(page.getByTestId('paywall-price')).toContainText('$35');
  await expect(page.getByTestId('paywall-price')).toContainText('/mo');
  await expect(page.getByTestId('paywall-trial')).toContainText('90-day');
  await expect(page.getByTestId('paywall-subscribe')).toBeVisible();
  await expect(page.getByTestId('paywall-restore')).toBeVisible();

  await page.getByTestId('paywall-subscribe').click();
  await expect(page.getByTestId('payments-status')).toContainText('trial', { timeout: 10000 });
  await expect(page.getByTestId('payments-create-log')).toBeEnabled();

  const buyerRes = await request.get(
    `${BASE}/api/payments/assert-can-write?orgId=${DEMO_ORG}&userId=${BUYER}`
  );
  expect(await buyerRes.json()).toEqual({ allowed: true });

  const otherRes = await request.get(
    `${BASE}/api/payments/assert-can-write?orgId=${DEMO_ORG}&userId=${OTHER}`
  );
  expect(await otherRes.json()).toEqual({ allowed: false });

  await page.getByTestId('payments-force-lapse').click();
  await expect(page.getByTestId('read-only-banner')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('feature-gate-blocked')).toBeVisible();
  await expect(page.getByTestId('payments-read-data')).toBeVisible();

  await page.getByTestId('paywall-restore').click();
  await expect(page.getByTestId('payments-status')).toContainText('active', { timeout: 10000 });
  await expect(page.getByTestId('payments-create-log')).toBeEnabled();

  const eventsRes = await request.get(`${BASE}/api/payments/test/events`);
  const { events } = await eventsRes.json() as { events: Array<{ product_slug: string; amount: number | null; status: string; timestamp: string }> };
  expect(events.length).toBeGreaterThan(0);
  const subscribeEvent = events.find((e) => e.status === 'trial');
  expect(subscribeEvent).toBeTruthy();
  expect(subscribeEvent!.product_slug).toBe('jobsiteintel');
  expect(subscribeEvent!.amount).toBe(35);
  expect(subscribeEvent!.timestamp).toBeTruthy();
});
