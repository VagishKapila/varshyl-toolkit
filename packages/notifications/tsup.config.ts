import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts', 'src/client.ts'],
  tsconfig: 'tsconfig.tsup.json',
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  target: 'node20',
  external: [
    'firebase-admin',
    'firebase-admin/app',
    'firebase-admin/messaging',
    'pg',
    '@capacitor/core',
    '@capacitor/local-notifications',
    '@capacitor/push-notifications',
  ],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
});
