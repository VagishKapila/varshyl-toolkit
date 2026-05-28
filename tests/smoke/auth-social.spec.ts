/**
 * auth-social ephemeral smoke — mock-backed Playwright UI tests.
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.DEMO_HOST_URL ?? 'http://localhost:3000';

test('S0: /healthz returns ready', async ({ request }) => {
  const res = await request.get(`${BASE}/healthz`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('ready');
});

test('S1: web sign-in shows Google + email, not Apple', async ({ page }) => {
  await page.goto('/auth/signin');
  await expect(page.getByTestId('sign-in-screen')).toBeVisible();
  await expect(page.getByTestId('sign-in-google')).toBeVisible();
  await expect(page.getByTestId('sign-in-apple')).toHaveCount(0);
  await expect(page.getByTestId('sign-in-submit')).toBeVisible();
});

test('S2: mocked iOS shows Apple + email, not Google', async ({ page }) => {
  await page.addInitScript(() => {
    (globalThis as { __AS_PLATFORM__?: string }).__AS_PLATFORM__ = 'ios';
  });
  await page.goto('/auth/signin');
  await expect(page.getByTestId('sign-in-apple')).toBeVisible();
  await expect(page.getByTestId('sign-in-google')).toHaveCount(0);
});

test('S3: email sign-up then sign-in establishes session', async ({ page }) => {
  const email = `smoke-${Date.now()}@example.com`;
  const password = 'SmokePass123!';

  await page.goto('/auth/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('sign-in-submit').click();
  await expect(page.getByTestId('auth-authed')).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByTestId('sign-in-screen')).toBeVisible({ timeout: 10000 });

  await page.getByLabel('Email').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('sign-in-submit').click();
  await expect(page.getByTestId('auth-authed')).toBeVisible({ timeout: 10000 });
});

test('S4: forgot-password → reset → sign-in with new password', async ({ page, request }) => {
  const email = `reset-${Date.now()}@example.com`;
  const oldPassword = 'OldPass123!';
  const newPassword = 'NewPass456!';

  await request.post(`${BASE}/api/auth/signup`, { data: { email, password: oldPassword } });

  await page.goto('/auth/forgot-password');
  await page.getByLabel('Email').fill(email);
  await page.getByTestId('forgot-password-submit').click();
  await expect(page.getByTestId('reset-email-sent')).toBeVisible();

  const captureRes = await request.get(`${BASE}/api/auth/test/capture`);
  expect(captureRes.ok()).toBe(true);
  const capture = await captureRes.json() as { lastResetToken: string | null };
  expect(capture.lastResetToken).toBeTruthy();

  await page.goto(`/auth/reset-password?token=${encodeURIComponent(capture.lastResetToken!)}`);
  await page.getByLabel('New password').fill(newPassword);
  await page.getByLabel('Confirm password').fill(newPassword);
  await page.getByTestId('reset-password-submit').click();
  await expect(page.getByTestId('reset-password-done')).toBeVisible();

  await page.goto('/auth/signin');
  await page.getByLabel('Email').fill(email);
  await page.getByTestId('password-input').fill(newPassword);
  await page.getByTestId('sign-in-submit').click();
  await expect(page.getByTestId('auth-authed')).toBeVisible({ timeout: 10000 });
});

test('S5: social sign-in via mock provider establishes session', async ({ page }) => {
  await page.goto('/auth/signin');
  await page.getByTestId('sign-in-google').click();
  await expect(page.getByTestId('auth-authed')).toBeVisible({ timeout: 10000 });
});

test('S6: password field hidden by default; eye toggle reveals and hides', async ({ page }) => {
  await page.goto('/auth/signin');
  const passwordInput = page.getByTestId('password-input');
  await expect(passwordInput).toHaveAttribute('type', 'password');

  const toggle = page.getByTestId('password-visibility-toggle');
  await toggle.click();
  await expect(passwordInput).toHaveAttribute('type', 'text');

  await toggle.click();
  await expect(passwordInput).toHaveAttribute('type', 'password');
});

test('S7: eye toggle is keyboard-focusable with correct aria-label per state', async ({ page }) => {
  await page.goto('/auth/signin');
  const toggle = page.getByTestId('password-visibility-toggle');

  await toggle.focus();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-label', 'Show characters');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-label', 'Hide characters');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
});

test('S8: signup screen renders consent slot content', async ({ page }) => {
  await page.goto('/auth/signup');
  await expect(page.getByTestId('signup-consent-slot')).toBeVisible();
  await expect(page.getByRole('checkbox')).toBeVisible();
});

test('S9: sign-in mode does not render consent slot', async ({ page }) => {
  await page.goto('/auth/signin');
  await expect(page.getByTestId('signup-consent-slot')).toHaveCount(0);
});
