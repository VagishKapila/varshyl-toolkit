import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2020',
  external: ['react', 'react-dom', 'react/jsx-runtime', 'livekit-client', '@varshylinc/soren-core'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
