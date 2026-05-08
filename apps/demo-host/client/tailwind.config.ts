import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        varshyl: {
          orange: '#E8622A',
          navy: '#1A2230',
        },
      },
    },
  },
  plugins: [],
};
export default config;
