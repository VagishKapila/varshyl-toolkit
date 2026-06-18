import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const pkgRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use soren-core source directly so tests don't require a prior build.
      '@varshylinc/soren-core': join(pkgRoot, '../soren-core/src/index.ts'),
    },
  },
  test: {
    globals: false,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
  },
});
