import { defineConfig, devices } from '@playwright/test';

// Ephemeral CI: DEMO_HOST_URL=http://localhost:3001 (set by smoke-oce job)
// Post-deploy verification: set DEMO_HOST_URL to the live Railway URL
const DEMO_HOST_URL =
  process.env.DEMO_HOST_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/smoke',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'qa-evidence/smoke-results.json' }],
  ],
  use: {
    baseURL: DEMO_HOST_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results',
});
