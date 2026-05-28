import { Router, type Request, type Response } from 'express';
import {
  createSubscriptionStore,
  assertCanWrite,
  createRevenueCatWebhookHandler,
  emitSubscriptionEvent,
  assignBuyerSeat,
  type PaymentsConfig,
  type NormalizedEvent,
} from '@varshylinc/mobile-payments';
import type { Pool } from 'pg';

export function createMobilePaymentsRouter(
  pool: Pool,
  config: PaymentsConfig,
  capture: { events: NormalizedEvent[] }
): Router {
  const router = Router();
  const paymentsConfig: PaymentsConfig = {
    ...config,
    onSubscriptionEvent: (event) => {
      capture.events.push(event);
      config.onSubscriptionEvent?.(event);
    },
  };
  const store = createSubscriptionStore(pool, paymentsConfig);

  router.get('/assert-can-write', async (req: Request, res: Response) => {
    const orgId = String(req.query.orgId ?? '');
    const userId = String(req.query.userId ?? '');
    if (!orgId || !userId) {
      res.status(400).json({ error: 'orgId and userId required' });
      return;
    }
    const allowed = await assertCanWrite(store, orgId, userId);
    res.json({ allowed });
  });

  router.post('/mock/sync', async (req: Request, res: Response) => {
    const { orgId, userId, status, seats, eventType, amount } = req.body as {
      orgId?: string;
      userId?: string;
      status?: 'trial' | 'active' | 'lapsed' | 'none';
      seats?: number;
      eventType?: string;
      amount?: number;
    };
    if (!orgId || !userId || !status) {
      res.status(400).json({ error: 'orgId, userId, status required' });
      return;
    }
    await store.upsertSubscription({
      orgId,
      productSlug: config.product.productSlug,
      status,
      seats: seats ?? 1,
      store: 'apple',
    });
    if (status === 'trial' || status === 'active') {
      await assignBuyerSeat(store, orgId, userId);
    }
    const event = await emitSubscriptionEvent(store, paymentsConfig, {
      orgId,
      productSlug: config.product.productSlug,
      eventType: eventType ?? 'MOCK_SYNC',
      status,
      amount: amount ?? null,
    });
    res.json({ ok: true, event });
  });

  router.post('/mock/force-lapse', async (req: Request, res: Response) => {
    const { orgId } = req.body as { orgId?: string };
    if (!orgId) {
      res.status(400).json({ error: 'orgId required' });
      return;
    }
    await store.upsertSubscription({
      orgId,
      productSlug: config.product.productSlug,
      status: 'lapsed',
      seats: 1,
    });
    res.json({ ok: true });
  });

  router.get('/test/events', (_req: Request, res: Response) => {
    res.json({ events: capture.events });
  });

  router.post('/webhooks/revenuecat', (req, res) => {
    void createRevenueCatWebhookHandler(store, paymentsConfig)(req, res);
  });

  return router;
}
