import type { SubscriptionState, Offering } from '../../types.js';

export interface SubscriptionService {
  configure(orgId: string): Promise<void>;
  getState(): Promise<SubscriptionState>;
  getOfferings(): Promise<Offering[]>;
  purchase(packageId: string): Promise<SubscriptionState>;
  restore(): Promise<SubscriptionState>;
}
