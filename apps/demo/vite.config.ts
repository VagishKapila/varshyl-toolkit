import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const fromHere = (p: string): string => fileURLToPath(new URL(p, import.meta.url));

// Alias the workspace packages to their source so the demo runs (and builds)
// straight from src — no prebuild step needed for phone QA.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@varshylinc/soren-core': fromHere('../../packages/soren-core/src/index.ts'),
      '@varshylinc/soren-react': fromHere('../../packages/soren-react/src/index.ts'),
    },
  },
  server: {
    host: true,
    port: 5174,
  },
});
