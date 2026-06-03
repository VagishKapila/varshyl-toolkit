import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const pkgRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@capgo/capacitor-social-login': join(pkgRoot, 'tests/mocks/capgo-social-login.ts'),
    },
  },
  test: {
    globals: false,
    environment: 'jsdom',
    environmentMatchGlobs: [['tests/unit/*-barrel.test.tsx', 'jsdom']],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'tests/**/*.spec.ts'],
    globalSetup: ['./tests/setup/global-setup.ts'],
  },
});
