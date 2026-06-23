import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/react.ts'],
  tsconfig: 'tsconfig.tsup.json',
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  target: 'es2022',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
});
