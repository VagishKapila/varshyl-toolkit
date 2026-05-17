# STRIPE_KEYS.md — Stripe Key Strategy for Varshyl Toolkit

> **Role:** Canonical reference for how Stripe API keys are structured, where
> they live, and how the `@varshyl/stripe-subscriptions` module uses them.
>
> **Last updated:** 2026-05-17

---

## Key taxonomy

| Key type | Format prefix | Scope | Lives in |
|---|---|---|---|
| Live secret key | `sk_live_` | Full access — production only | `varshyl-secrets-vault` Railway env |
| Live publishable key | `pk_live_` | Client-side — safe to expose | `varshyl-secrets-vault` Railway env |
| Test secret key | `sk_test_` | Full access — test mode | Stripe Dashboard → API keys → Reveal test key |
| Test publishable key | `pk_test_` | Client-side — safe to expose | Stripe Dashboard → API keys |
| Restricted key | `rk_live_` / `rk_test_` | Scoped permissions | Created per-service in Stripe Dashboard |
| Webhook signing secret | `whsec_` | Per-endpoint, auto-generated | Railway env var `STRIPE_WEBHOOK_SECRET` |

---

## Stripe account

| Field | Value |
|---|---|
| Account ID | `acct_1TG76NAHP8NRRyLC` |
| Account name | ConstructInvoice AI (Varshyl Inc.) |
| Dashboard | https://dashboard.stripe.com |

---

## Webhook endpoints

### demo-host (varshyl-toolkit)

| Field | Value |
|---|---|
| Endpoint ID | `we_1TY4xoAHP8NRRyLC8gIwrH5v` |
| URL | `https://demo-host-production.up.railway.app/api/webhooks/stripe` |
| Status | enabled |
| Events | `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `invoice.payment_action_required`, `checkout.session.completed` |
| Signing secret | Set as `STRIPE_WEBHOOK_SECRET` in Railway demo-host production env |

**Railway env vars set (demo-host production):**
- `STRIPE_WEBHOOK_SECRET` = `whsec_...` (masked — see Railway dashboard or vault)
- `STRIPE_WEBHOOK_ENDPOINT_ID` = `we_1TY4xoAHP8NRRyLC8gIwrH5v`

---

## Restricted keys for `@varshyl/stripe-subscriptions`

> **Note:** Stripe restricted keys cannot be created via the REST API.
> They must be created in the Stripe Dashboard.

### How to create a restricted key for a new consumer

1. Go to Stripe Dashboard → Developers → API keys → Restricted keys → **+ Create restricted key**
2. Name it: `varshyl-<product>-subscriptions-<env>` (e.g. `varshyl-dailylog-subscriptions-test`)
3. Grant only the permissions the module needs:

| Resource | Permission needed |
|---|---|
| Customers | Read + Write |
| Subscriptions | Read + Write |
| Prices | Read |
| Products | Read |
| Payment methods | Read + Write |
| Invoices | Read |
| Checkout sessions | Read + Write |
| Webhook endpoints | Read (optional — for self-inspection) |

4. Click **Create key** → copy the `rk_test_...` or `rk_live_...` key
5. Set it as `STRIPE_SECRET_KEY` in the target Railway service env

### Current status

| Consumer | Env | Key created? | Railway env set? |
|---|---|---|---|
| `@varshyl/stripe-subscriptions` demo | test | ❌ Pending — create via Dashboard | ❌ |
| Daily Log AI | test | ❌ Pending | ❌ |
| Daily Log AI | live | ❌ Pending (after test is validated) | ❌ |

**Action required before building `@varshyl/stripe-subscriptions`:**
1. Create `rk_test_*` restricted key in Stripe Dashboard with permissions above
2. Set as `STRIPE_SECRET_KEY` in Railway demo-host env:
   ```
   STRIPE_SECRET_KEY=rk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. Retrieve test publishable key from Stripe Dashboard → Developers → API keys → Test mode

---

## Live key storage

Live keys (`sk_live_`, `pk_live_`) are stored in:
- **varshyl-secrets-vault** Railway project (`varshyl-secrets-vault` environment)
- **Local vault:** `claudeExtras/.varshyl-vault-master.age-key` (49 secrets, 6 bundles)
- **Memory:** `reference_api_keys.md` (operational DR reference)

**Never set `sk_live_` directly on demo-host or any non-production service.**
Always use restricted keys (`rk_live_`) in production where possible.

---

## Environment variable naming convention

All Stripe vars on Railway services follow this pattern:

| Var name | Contains |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_*` or `rk_live_*` or `rk_test_*` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_*` or `pk_test_*` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_*` (per-endpoint, auto-generated) |
| `STRIPE_WEBHOOK_ENDPOINT_ID` | `we_*` (reference only — not used in code) |

---

## Webhook verification (code pattern)

The `@varshyl/stripe-subscriptions` module will verify every incoming webhook:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err}`);
  }

  // Route events
  switch (event.type) {
    case 'customer.subscription.created': // ...
    case 'invoice.payment_succeeded':     // ...
    // etc.
  }

  res.json({ received: true });
});
```

---

*End of STRIPE_KEYS.md. When `@varshyl/stripe-subscriptions` design phase begins,
update the "Current status" table above with the actual restricted keys created.*
