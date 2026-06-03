import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'tests/**/*.spec.ts'],
    environmentMatchGlobs: [['tests/unit/**/*.test.tsx', 'jsdom']],
    globalSetup: ['./tests/setup/global-setup.ts'],
    testTimeout: 120_000,
    // Run test files sequentially — integration tests share a single Postgres
    // instance with hardcoded seed IDs; parallel file execution causes race
    // conditions (duplicate-key / FK violations).
    fileParallelism: false,
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});

