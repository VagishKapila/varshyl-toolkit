import {
  configureAuth,
  createMockSocialProvider,
  setAuthTheme,
} from '@varshylinc/auth-social/client';
import {
  configureSubscriptions,
  createMockSubscriptionService,
} from '@varshylinc/mobile-payments/client';
import { setTeamTheme } from '@varshylinc/team-management/client';
import { getAuthThemeOverrides } from './theme.js';

export const paymentsMock = createMockSubscriptionService({
  orgId: 'demo-org-1',
  userId: 'user-1',
});

const authTheme = getAuthThemeOverrides();

configureAuth({
  apiBaseUrl: '/api/auth',
  socialProvider: createMockSocialProvider('demo-user', 'demo@varshyl.com'),
  theme: authTheme,
});
setAuthTheme(authTheme);

configureSubscriptions({
  service: paymentsMock,
  config: { orgId: 'demo-org-1', userId: 'user-1' },
});

setTeamTheme({
  paper: '#FAF7F0',
  brick: '#8B3A2F',
  brass: '#B8893E',
  ink: '#211D18',
  fontHeading: '"Fraunces", Georgia, serif',
  fontBody: '"Inter", system-ui, sans-serif',
});
