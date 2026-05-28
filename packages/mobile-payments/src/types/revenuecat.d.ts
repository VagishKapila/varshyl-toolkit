declare module '@revenuecat/purchases-capacitor' {
  export const Purchases: {
    configure(options: { apiKey: string; appUserID: string }): Promise<void>;
    getCustomerInfo(): Promise<{
      customerInfo: {
        entitlements: { active: Record<string, { expirationDate?: string | null }> };
      };
    }>;
    getOfferings(): Promise<{
      current?: {
        identifier: string;
        availablePackages: Array<{
          identifier: string;
          product: {
            priceString: string;
            introPrice?: { periodNumberOfUnits: number; periodUnit: string } | null;
          };
        }>;
      } | null;
    }>;
    purchasePackage(options: { aPackage: unknown }): Promise<{ customerInfo: unknown }>;
    restorePurchases(): Promise<{ customerInfo: unknown }>;
  };
}
