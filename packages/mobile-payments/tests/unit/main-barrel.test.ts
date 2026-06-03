import { describe, it } from 'vitest';
import * as Main from '@varshylinc/mobile-payments';
import { expectNamedExport, expectNotOnBarrel } from '../../../../vitest/barrel-contract-helpers.js';

describe('@varshylinc/mobile-payments main barrel', () => {
  it('exports the expected named symbols', () => {
    expectNamedExport(Main, 'createSubscriptionStore', 'function');
    expectNamedExport(Main, 'runMigrations', 'function');
    expectNamedExport(Main, 'BOOTSTRAP_SQL', 'const');
    expectNamedExport(Main, 'assertCanWrite', 'function');
    expectNamedExport(Main, 'getAccessModeForUser', 'function');
    expectNamedExport(Main, 'createRevenueCatWebhookHandler', 'function');
    expectNamedExport(Main, 'createMockSubscriptionStore', 'function');
    expectNamedExport(Main, 'emitSubscriptionEvent', 'function');
    expectNamedExport(Main, 'assignBuyerSeat', 'function');
    expectNamedExport(Main, 'createMpPool', 'function');
    expectNamedExport(Main, 'mpSelfTest', 'function');
    expectNamedExport(Main, 'MpError', 'class');
    expectNamedExport(Main, 'DEFAULT_MP_CONNECTION_TIMEOUT_MS', 'const');
    expectNamedExport(Main, 'DEFAULT_MP_OPERATION_TIMEOUT_MS', 'const');
  });

  it('does not export internal symbols', () => {
    expectNotOnBarrel(Main, 'configureSubscriptions');
    expectNotOnBarrel(Main, 'PaywallScreen');
    expectNotOnBarrel(Main, 'getClientConfig');
    expectNotOnBarrel(Main, 'createRevenueCatSubscriptionService');
  });
});
