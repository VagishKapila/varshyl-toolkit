import { Router, type Request, type Response } from 'express';
import type { Pool } from 'pg';
import Stripe from 'stripe';
import {
  addCredits,
  deductCredits,
  getCreditBalance,
  hasProcessedSession,
} from './credits-db.js';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

const CORS = (res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
};

function priceIdForCredits(credits: 5 | 25 | 100): string | undefined {
  if (credits === 5) return process.env.STRIPE_PRICE_5;
  if (credits === 25) return process.env.STRIPE_PRICE_25;
  return process.env.STRIPE_PRICE_100;
}

export function createCreditsWebhookHandler(pool: Pool) {
  return async (req: Request, res: Response): Promise<void> => {
    const stripe = getStripe();
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !sig || !webhookSecret) {
      res.status(400).json({ error: 'Missing signature' });
      return;
    }

    let event: Stripe.Event;
    try {
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody ?? req.body;
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSecret,
      );
    } catch (err) {
      console.error('Webhook signature failed:', err);
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    if (event.type !== 'checkout.session.completed') {
      res.json({ received: true });
      return;
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.metadata?.email;
    const credits = parseInt(session.metadata?.credits ?? '0', 10);

    if (!email || !credits) {
      res.status(400).json({ error: 'Missing metadata' });
      return;
    }

    const client = await pool.connect();
    try {
      if (await hasProcessedSession(client, session.id)) {
        res.json({ received: true });
        return;
      }
    } finally {
      client.release();
    }

    try {
      await addCredits(pool, email, credits, session.id);
      console.log(`✅ ${credits} credits added to ${email}`);
      res.json({ received: true });
    } catch (err) {
      console.error('Credit add failed:', err);
      res.status(500).json({ error: 'Credit processing failed' });
    }
  };
}

export function createCreditsRouter(pool: Pool): Router {
  const router: Router = Router();

  router.options('*', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
  });

  router.get('/balance', async (req, res) => {
    CORS(res);
    const { email } = req.query as { email?: string };
    if (!email) {
      res.status(400).json({ error: 'email required' });
      return;
    }

    try {
      const balance = await getCreditBalance(pool, email);
      res.json({ balance });
    } catch (err) {
      console.error('Balance fetch failed:', err);
      res.status(500).json({ error: 'Balance fetch failed' });
    }
  });

  router.post('/checkout', async (req, res) => {
    CORS(res);
    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: 'Stripe not configured' });
      return;
    }

    const {
      email,
      credits,
      siteUrl,
      successUrl,
      cancelUrl,
    } = req.body as {
      email: string;
      credits: 5 | 25 | 100;
      siteUrl?: string;
      successUrl: string;
      cancelUrl: string;
    };

    if (!email || !credits || !successUrl) {
      res.status(400).json({
        error: 'email, credits, successUrl required',
      });
      return;
    }

    const priceId = priceIdForCredits(credits);
    if (!priceId) {
      res.status(400).json({ error: 'Invalid credit amount' });
      return;
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email,
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: {
          email,
          credits: credits.toString(),
          siteUrl: siteUrl ?? '',
          product: 'soren-fixes-it',
        },
      });

      res.json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } catch (err) {
      console.error('Checkout error:', err);
      res.status(500).json({ error: 'Checkout creation failed' });
    }
  });

  router.post('/deduct', async (req, res) => {
    CORS(res);
    const { email, amount, description } = req.body as {
      email: string;
      amount: number;
      description: string;
    };

    if (!email || !amount) {
      res.status(400).json({ error: 'email and amount required' });
      return;
    }

    try {
      const result = await deductCredits(
        pool,
        email,
        amount,
        description ?? 'Soren fix applied',
      );

      if (!result.success) {
        res.status(402).json({
          error: 'Insufficient credits',
          balance: result.balance,
          required: amount,
        });
        return;
      }

      res.json({
        success: true,
        balance: result.balance,
      });
    } catch (err) {
      console.error('Deduct error:', err);
      res.status(500).json({ error: 'Credit deduction failed' });
    }
  });

  return router;
}
