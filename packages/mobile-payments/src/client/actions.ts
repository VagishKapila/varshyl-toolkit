import type { SubscriptionActionResult } from '../types.js';
import { getSubscriptionService } from './configure.js';

export async function openPaywall(): Promise<SubscriptionActionResult> {
  return { ok: true };
}

export async function purchase(packageId: string): Promise<SubscriptionActionResult> {
  try {
    const state = await getSubscriptionService().purchase(packageId);
    return { ok: true, state };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function restorePurchases(): Promise<SubscriptionActionResult> {
  try {
    const state = await getSubscriptionService().restore();
    return { ok: true, state };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function refreshState(): Promise<SubscriptionActionResult> {
  try {
    const state = await getSubscriptionService().getState();
    return { ok: true, state };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export const subscriptionActions = {
  openPaywall,
  purchase,
  restorePurchases,
  refreshState,
};
