import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    express: 'src/express.ts',
  },
  tsconfig: 'tsconfig.tsup.json',
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  target: 'es2022',
  platform: 'node',
  external: ['express', 'pg', 'react', 'react-dom', 'react/jsx-runtime'],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
});
