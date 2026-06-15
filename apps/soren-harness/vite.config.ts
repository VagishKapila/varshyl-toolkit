import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const pkg = (p: string) => fileURLToPath(new URL(`../../packages/soren/src/${p}`, import.meta.url));

// Resolve workspace subpaths to source so the harness runs without a prebuild.
// (server is intentionally NOT aliased — the harness is browser-only.)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@varshylinc/soren/reference': pkg('reference/index.ts'),
      '@varshylinc/soren/react': pkg('react/index.tsx'),
      '@varshylinc/soren': pkg('index.ts'),
    },
  },
});
