import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: 'tests/setup/global-setup.ts',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
