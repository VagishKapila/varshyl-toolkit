import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@varshylinc/team-management/client': path.resolve(
        __dirname,
        '../../packages/team-management/src/client/index.ts'
      ),
      '@varshylinc/auth-social/client': path.resolve(
        __dirname,
        '../../packages/auth-social/src/client.ts'
      ),
    },
  },
});
