/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/onboarding-consent-engine/src/client/**/*.{ts,tsx}',
    '../../packages/team-management/src/client/**/*.{ts,tsx}',
    '../../packages/mobile-payments/src/client/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
