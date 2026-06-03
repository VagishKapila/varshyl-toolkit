import { describe, expect, it } from 'vitest';
import * as AuthMain from '@varshylinc/auth-social';
import * as AuthClient from '@varshylinc/auth-social/client';
import * as AuthCapgo from '@varshylinc/auth-social/client/capgo';
import * as TmMain from '@varshylinc/team-management';
import * as TmServer from '@varshylinc/team-management/server';
import * as TmClient from '@varshylinc/team-management/client';
import * as MpMain from '@varshylinc/mobile-payments';
import * as MpClient from '@varshylinc/mobile-payments/client';
import * as MpRevenueCat from '@varshylinc/mobile-payments/client/revenuecat';
import * as OceMain from '@varshylinc/onboarding-consent-engine';
import * as OceClient from '@varshylinc/onboarding-consent-engine/client';

const surfaces = [
  { label: '@varshylinc/auth-social', mod: AuthMain, key: 'createAuthService' },
  { label: '@varshylinc/auth-social/client', mod: AuthClient, key: 'configureAuth' },
  { label: '@varshylinc/auth-social/client/capgo', mod: AuthCapgo, key: 'createCapgoSocialProvider' },
  { label: '@varshylinc/team-management', mod: TmMain, key: 'createServerModule' },
  { label: '@varshylinc/team-management/server', mod: TmServer, key: 'createServerModule' },
  { label: '@varshylinc/team-management/client', mod: TmClient, key: 'OrgPeoplePage' },
  { label: '@varshylinc/mobile-payments', mod: MpMain, key: 'createSubscriptionStore' },
  { label: '@varshylinc/mobile-payments/client', mod: MpClient, key: 'configureSubscriptions' },
  {
    label: '@varshylinc/mobile-payments/client/revenuecat',
    mod: MpRevenueCat,
    key: 'createRevenueCatSubscriptionService',
  },
  { label: '@varshylinc/onboarding-consent-engine', mod: OceMain, key: 'createConsentModule' },
  { label: '@varshylinc/onboarding-consent-engine/client', mod: OceClient, key: 'consentActions' },
] as const;

describe('cross-package public barrel imports', () => {
  for (const { label, mod, key } of surfaces) {
    it(`resolves ${label} via workspace links`, () => {
      expect(mod[key], `${label} missing ${key}`).toBeDefined();
      if (key === 'consentActions' || key === 'authActions') {
        expect(typeof mod[key]).toBe('object');
      } else {
        expect(typeof mod[key]).toBe('function');
      }
    });
  }
});
