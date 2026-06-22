import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/react.ts',
    'src/server.ts',
    'src/adapters/jobsite.ts',
    'src/adapters/reference.ts',
  ],
  tsconfig: 'tsconfig.tsup.json',
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  target: 'es2022',
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'express',
    'pg',
    '@anthropic-ai/sdk',
    'openai',
    '@capacitor/core',
    '@capacitor-community/speech-recognition',
  ],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
});
