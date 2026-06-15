import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'server/index': 'src/server/index.ts',
    'reference/index': 'src/reference/index.ts',
    'react/index': 'src/react/index.tsx',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2020',
  external: ['react', 'react-dom', 'node:async_hooks'],
});
