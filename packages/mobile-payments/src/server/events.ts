import type { PaymentsConfig } from '../config.js';
import type { NormalizedEvent, SubscriptionStatus } from '../types.js';
import type { SubscriptionStore } from './store.js';

export async function emitSubscriptionEvent(
  store: SubscriptionStore,
  config: PaymentsConfig,
  input: {
    orgId: string;
    productSlug: string;
    eventType: string;
    status: SubscriptionStatus;
    amount?: number | null;
    currency?: string | null;
    raw?: Record<string, unknown> | null;
  }
): Promise<NormalizedEvent> {
  const timestamp = new Date().toISOString();
  const normalized: NormalizedEvent = {
    product_slug: input.productSlug,
    amount: input.amount ?? null,
    status: input.status,
    timestamp,
  };

  await store.appendEvent({
    orgId: input.orgId,
    productSlug: input.productSlug,
    eventType: input.eventType,
    status: input.status,
    amount: input.amount ?? null,
    currency: input.currency ?? null,
    occurredAt: timestamp,
    raw: input.raw ?? null,
  });

  config.onSubscriptionEvent?.(normalized);
  return normalized;
}
