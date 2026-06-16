/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import React from 'react';
import * as Client from '@varshylinc/mobile-payments/client';
import { expectNamedExport, expectNotOnBarrel } from '../../../../vitest/barrel-contract-helpers.js';

afterEach(() => {
  cleanup();
});

describe('@varshylinc/mobile-payments/client barrel', () => {
  it('exports the expected named symbols', () => {
    expectNamedExport(Client, 'configureSubscriptions', 'function');
    expectNamedExport(Client, 'getSubscriptionService', 'function');
    expectNamedExport(Client, 'getSubscriptionTheme', 'function');
    expectNamedExport(Client, 'useSubscription', 'function');
    expectNamedExport(Client, 'subscriptionActions', 'const');
    expectNamedExport(Client, 'PaywallScreen', 'function');
    expectNamedExport(Client, 'FeatureGate', 'function');
    expectNamedExport(Client, 'ReadOnlyBanner', 'function');
    expectNamedExport(Client, 'RestoreButton', 'function');
    expectNamedExport(Client, 'DEFAULT_PAYMENTS_THEME', 'const');
    expectNamedExport(Client, 'createMockSubscriptionService', 'function');
    expectNamedExport(Client, 'MockSubscriptionService', 'function');
  });

  it('does not export internal symbols', () => {
    expectNotOnBarrel(Client, 'getClientConfig');
    expectNotOnBarrel(Client, 'getProductConfig');
    expectNotOnBarrel(Client, 'createSubscriptionStore');
    expectNotOnBarrel(Client, 'createRevenueCatSubscriptionService');
  });

  it('renders exported React components without crashing', () => {
    Client.configureSubscriptions({
      config: { orgId: 'org-1', userId: 'user-1' },
    });

    render(
      <>
        <Client.ReadOnlyBanner />
        <Client.RestoreButton />
        <Client.FeatureGate
          accessMode={{ canRead: true, canWrite: true }}
          fallback={<span>locked</span>}
        >
          <span>ok</span>
        </Client.FeatureGate>
        <Client.PaywallScreen platform="ios" price="$35.00" trialDays={90} />
      </>,
    );

    expect(document.body.textContent?.length).toBeGreaterThan(0);
  });
});
