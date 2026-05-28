import type { ClientPaymentsConfig, ProductPaymentsConfig } from '../../config.js';
import type { SubscriptionState } from '../../types.js';
import { resolveClientAccessMode } from '../access.js';
import type { SubscriptionService } from './subscription-service.js';
import { Purchases } from '@revenuecat/purchases-capacitor';

function mapCustomerInfo(
  orgId: string,
  entitlementId: string,
  seats: number,
  info: Awaited<ReturnType<typeof Purchases.getCustomerInfo>>
): SubscriptionState {
  const active = info.customerInfo.entitlements.active[entitlementId];
  const status = active ? 'active' : 'none';
  const expiresAt = active?.expirationDate ?? null;
  return {
    orgId,
    status,
    seats: active ? seats : 0,
    isActive: Boolean(active),
    isInTrial: false,
    expiresAt,
    accessMode: resolveClientAccessMode(status, Boolean(active)),
  };
}

export function createRevenueCatSubscriptionService(
  clientConfig: ClientPaymentsConfig,
  product: ProductPaymentsConfig
): SubscriptionService {
  let orgId = clientConfig.orgId;
  let configured = false;

  async function ensureConfigured() {
    if (configured || !clientConfig.revenueCatApiKey) return;
    await Purchases.configure({
      apiKey: clientConfig.revenueCatApiKey,
      appUserID: orgId,
    });
    configured = true;
  }

  return {
    async configure(nextOrgId) {
      orgId = nextOrgId;
      configured = false;
      await ensureConfigured();
    },

    async getState() {
      await ensureConfigured();
      const info = await Purchases.getCustomerInfo();
      return mapCustomerInfo(orgId, product.entitlementId, 1, info);
    },

    async getOfferings() {
      await ensureConfigured();
      const { current } = await Purchases.getOfferings();
      if (!current) return [];
      return [
        {
          identifier: current.identifier,
          packages: current.availablePackages.map((p) => ({
            identifier: p.identifier,
            priceString: p.product.priceString,
            trialLabel: p.product.introPrice
              ? `${p.product.introPrice.periodNumberOfUnits}-day free trial`
              : null,
          })),
        },
      ];
    },

    async purchase(packageId) {
      await ensureConfigured();
      const { current } = await Purchases.getOfferings();
      const pkg = current?.availablePackages.find((p) => p.identifier === packageId);
      if (!pkg) throw new Error(`Package not found: ${packageId}`);
      const result = await Purchases.purchasePackage({ aPackage: pkg });
      return mapCustomerInfo(
        orgId,
        product.entitlementId,
        1,
        result as Awaited<ReturnType<typeof Purchases.getCustomerInfo>>
      );
    },

    async restore() {
      await ensureConfigured();
      const result = await Purchases.restorePurchases();
      return mapCustomerInfo(
        orgId,
        product.entitlementId,
        1,
        result as Awaited<ReturnType<typeof Purchases.getCustomerInfo>>
      );
    },
  };
}
