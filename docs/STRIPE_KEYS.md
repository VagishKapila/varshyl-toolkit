# STRIPE_KEYS.md — Stripe Key Strategy for Varshyl Toolkit

> **Role:** Canonical reference for how Stripe API keys are structured, where
> they live, and how the `@varshyl/stripe-subscriptions` module uses them.
>
> **Last updated:** 2026-05-17 (Sandbox account added)

---

## Account architecture

| Account | ID | Purpose |
|---|---|---|
| ConstructInvoice AI (Varshyl Inc.) | `acct_1TG76NAHP8NRRyLC` | **Production only.** Live keys for ConstructIInv. Never used for module development. |
| Stripe Sandbox | `acct_1TY5fkAl8GZyc2PN` | **Module development.** All `@varshyl/stripe-subscriptions` dev and testing happens here. Fully isolated from the live account. |

**Rule (OPS-29):** Module development always uses the Sandbox account. The live Varshyl Inc. account is reserved for production consumers (ConstructIInv) only.

---

## Key taxonomy

| Key type | Format prefix | Scope | Lives in |
|---|---|---|---|
| Live secret key | `sk_live_` | Full access — production only | `varshyl-secrets-vault` Railway env |
| Live publishable key | `pk_live_` | Client-side — safe to expose | `varshyl-secrets-vault` Railway env |
| Sandbox secret key | `sk_test_51TY5g4…` | Full access — Sandbox account | Railway demo-host env (`STRIPE_SECRET_KEY`) |
| Sandbox publishable key | `pk_test_51TY5g4…` | Client-side — Sandbox account | Railway demo-host env (`STRIPE_PUBLISHABLE_KEY`) |
| Webhook signing secret | `whsec_` | Per-endpoint, auto-generated | Railway env var `STRIPE_WEBHOOK_SECRET` |

---

## Railway environment variables — demo-host (production env)

| Var | Value | Source |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_51TY5g4…` (Sandbox) | Stripe Dashboard → Sandbox → Developers → API keys |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_51TY5g4…` (Sandbox) | Stripe Dashboard → Sandbox → Developers → API keys |
| `STRIPE_ACCOUNT_ID` | `acct_1TY5fkAl8GZyc2PN` | Stripe Sandbox account ID |
| `STRIPE_MODE` | `sandbox` | Literal string — used by module to log/assert mode |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (Sandbox endpoint) | Created when Sandbox webhook endpoint is set up |
| `STRIPE_WEBHOOK_ENDPOINT_ID` | `we_…` (Sandbox) | Reference only |

> **Note:** The old `STRIPE_WEBHOOK_SECRET` (`whsec_DBlJzw3PjpUnZ9bVSeYlDQXqMtp0NaZQ`)
> was created against the live account (`acct_1TG76NAHP8NRRyLC`) and must be
> replaced with the Sandbox endpoint's signing secret before the subscriptions
> module goes live on demo-host.

---

## Webhook endpoints

### Live account — ConstructIInv production

| Field | Value |
|---|---|
| Endpoint ID | `we_1TK4WjAHP8NRRyLCoqgLDoK8` |
| URL | `https://constructinv.varshyl.com/api/stripe/webhook` |
| Status | enabled |

### Live account — toolkit demo-host (STALE — created against wrong account)

| Field | Value |
|---|---|
| Endpoint ID | `we_1TY4xoAHP8NRRyLC8gIwrH5v` |
| URL | `https://demo-host-production.up.railway.app/api/webhooks/stripe` |
| Status | enabled |
| Note | ⚠ Created on live account (`acct_1TG76NAHP8NRRyLC`) by mistake. Should be recreated on Sandbox account. |

### Sandbox account — toolkit demo-host (TO CREATE)

| Field | Value |
|---|---|
| URL | `https://demo-host-production.up.railway.app/api/stripe/webhook` |
| Events | `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.trial_will_end`, `invoice.paid`, `invoice.payment_failed`, `invoice.upcoming`, `checkout.session.completed`, `charge.refunded` |
| Status | ❌ Pending — needs Sandbox secret key set first |

---

## Webhook verification (code pattern for @varshyl/stripe-subscriptions)

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err}`);
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'invoice.paid':
    case 'invoice.payment_failed':
    case 'checkout.session.completed':
      // ... handle
      break;
  }

  res.json({ received: true });
});
```

---

## Key rotation procedure

1. Generate new key in Stripe Dashboard → Sandbox → Developers → API keys → Roll key
2. Update `STRIPE_SECRET_KEY` in Railway demo-host env via Railway dashboard or CLI
3. Redeploy demo-host (Railway auto-redeploys on env change)
4. Verify `/api/health` returns 200 after new deploy
5. Update `reference_api_keys.md` memory entry and `varshyl-secrets-vault`

---

*End of STRIPE_KEYS.md. Live account (`acct_1TG76NAHP8NRRyLC`) keys are in `varshyl-secrets-vault`.*
