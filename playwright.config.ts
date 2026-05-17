import { defineConfig, devices } from '@playwright/test';

const DEMO_HOST_URL =
  process.env.DEMO_HOST_URL ?? 'https://demo-host-production.up.railway.app';

export default defineConfig({
  testDir: './tests/smoke',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'qa-evidence/team-management-v0.1.0/smoke-results.json' }],
  ],
  use: {
    baseURL: DEMO_HOST_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    /* Visual regression snapshots live here */
    snapshotDir: 'tests/smoke/__screenshots__',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /* Output folder for test artifacts */
  outputDir: 'test-results',
});
