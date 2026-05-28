import type { ClientPaymentsConfig, ProductPaymentsConfig } from '../../config.js';
import type { SubscriptionState } from '../../types.js';
import { resolveClientAccessMode } from '../access.js';
import type { SubscriptionService } from './subscription-service.js';

type PurchasesClient = typeof import('@revenuecat/purchases-capacitor').Purchases;
type CustomerInfoResult = Awaited<ReturnType<PurchasesClient['getCustomerInfo']>>;

async function getPurchases(): Promise<PurchasesClient> {
  try {
    const mod = await import('@revenuecat/purchases-capacitor');
    return mod.Purchases;
  } catch {
    throw new Error(
      '@varshylinc/mobile-payments/client/revenuecat requires ' +
        '@revenuecat/purchases-capacitor to be installed in the host app. ' +
        'Install it as a regular dependency in your Capacitor product.'
    );
  }
}

function mapCustomerInfo(
  orgId: string,
  entitlementId: string,
  seats: number,
  info: CustomerInfoResult
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
    const Purchases = await getPurchases();
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
      const Purchases = await getPurchases();
      const info = await Purchases.getCustomerInfo();
      return mapCustomerInfo(orgId, product.entitlementId, 1, info);
    },

    async getOfferings() {
      await ensureConfigured();
      const Purchases = await getPurchases();
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
      const Purchases = await getPurchases();
      const { current } = await Purchases.getOfferings();
      const pkg = current?.availablePackages.find((p) => p.identifier === packageId);
      if (!pkg) throw new Error(`Package not found: ${packageId}`);
      const result = await Purchases.purchasePackage({ aPackage: pkg });
      return mapCustomerInfo(
        orgId,
        product.entitlementId,
        1,
        result as CustomerInfoResult
      );
    },

    async restore() {
      await ensureConfigured();
      const Purchases = await getPurchases();
      const result = await Purchases.restorePurchases();
      return mapCustomerInfo(
        orgId,
        product.entitlementId,
        1,
        result as CustomerInfoResult
      );
    },
  };
}
