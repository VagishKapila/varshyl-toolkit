import type { PaymentsConfig } from '../config.js';
import type { SubscriptionStatus, SubscriptionStoreType } from '../types.js';
import { emitSubscriptionEvent } from './events.js';
import { assignBuyerSeat } from './seats.js';
import type { SubscriptionStore } from './store.js';

export interface WebhookRequest {
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

export interface WebhookResponse {
  status(code: number): WebhookResponse;
  json(body: unknown): void;
}

export type WebhookHandler = (req: WebhookRequest, res: WebhookResponse) => void | Promise<void>;

interface RcWebhookBody {
  event?: {
    type?: string;
    app_user_id?: string;
    product_id?: string;
    price?: number;
    currency?: string;
    expiration_at_ms?: number;
    period_type?: string;
    store?: string;
  };
}

function mapStore(store?: string): SubscriptionStoreType | null {
  if (store === 'APP_STORE') return 'apple';
  if (store === 'PLAY_STORE') return 'google';
  return null;
}

function mapStatus(eventType?: string, periodType?: string): SubscriptionStatus {
  if (eventType === 'EXPIRATION' || eventType === 'BILLING_ISSUE') return 'lapsed';
  if (periodType === 'TRIAL' || eventType === 'INITIAL_PURCHASE') return 'trial';
  if (eventType === 'RENEWAL' || eventType === 'UNCANCELLATION') return 'active';
  return 'active';
}

function verifySecret(req: WebhookRequest, secret?: string): boolean {
  if (!secret) return process.env.NODE_ENV === 'test';
  const auth = req.headers.authorization ?? '';
  return auth === `Bearer ${secret}` || auth === secret;
}

export function createRevenueCatWebhookHandler(
  store: SubscriptionStore,
  config: PaymentsConfig
): WebhookHandler {
  return async (req, res) => {
    if (!verifySecret(req, config.revenueCatWebhookSecret)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = req.body as RcWebhookBody;
    const event = body.event;
    if (!event?.app_user_id) {
      res.status(400).json({ error: 'Missing app_user_id' });
      return;
    }

    const orgId = event.app_user_id;
    const status = mapStatus(event.type, event.period_type);
    const storeType = mapStore(event.store);
    const trialEndsAt =
      status === 'trial' && event.expiration_at_ms
        ? new Date(event.expiration_at_ms).toISOString()
        : null;
    const periodEnd = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

    await store.upsertSubscription({
      orgId,
      productSlug: config.product.productSlug,
      status,
      seats: 1,
      store: storeType,
      currentPeriodEnd: periodEnd,
      trialEndsAt,
      rcAppUserId: orgId,
    });

    const subscriberUserId =
      (event as { subscriber_attributes?: Record<string, { value?: string }> })
        .subscriber_attributes?.userId?.value ?? orgId;
    if (status === 'trial' || status === 'active') {
      await assignBuyerSeat(store, orgId, subscriberUserId);
    }

    const normalized = await emitSubscriptionEvent(store, config, {
      orgId,
      productSlug: config.product.productSlug,
      eventType: event.type ?? 'UNKNOWN',
      status,
      amount: event.price ?? null,
      currency: event.currency ?? null,
      raw: body as Record<string, unknown>,
    });

    res.status(200).json({ ok: true, event: normalized });
  };
}
