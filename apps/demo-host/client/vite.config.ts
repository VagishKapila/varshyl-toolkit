import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../dist/client'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  resolve: {
    alias: {
      '@varshylinc/team-management/client': path.resolve(__dirname, '../../../packages/team-management/src/client/index.ts'),
      '@varshylinc/auth-social/client': path.resolve(__dirname, '../../../packages/auth-social/src/client.ts'),
    },
  },
});
