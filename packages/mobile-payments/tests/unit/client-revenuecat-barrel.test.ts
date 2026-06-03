import { describe, it } from 'vitest';
import * as RevenueCat from '@varshylinc/mobile-payments/client/revenuecat';
import { expectNamedExport, expectNotOnBarrel } from '../../../../vitest/barrel-contract-helpers.js';

describe('@varshylinc/mobile-payments/client/revenuecat barrel', () => {
  it('exports the expected named symbols', () => {
    expectNamedExport(RevenueCat, 'createRevenueCatSubscriptionService', 'function');
  });

  it('does not export internal symbols', () => {
    expectNotOnBarrel(RevenueCat, 'configureSubscriptions');
    expectNotOnBarrel(RevenueCat, 'PaywallScreen');
    expectNotOnBarrel(RevenueCat, 'createMockSubscriptionService');
  });
});
