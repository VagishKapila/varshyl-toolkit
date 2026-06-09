# OPS-29 — Stripe Development Uses Dedicated Sandbox Account

**Status:** Active  
**Adopted:** 2026-05-17  
**Scope:** All `@varshyl/stripe-subscriptions` development and module testing

---

## Rule

**ALL Stripe module development uses the dedicated Sandbox account
(`acct_1TY5fkAl8GZyc2PN`). The live Varshyl Inc. account
(`acct_1TG76NAHP8NRRyLC`) is reserved for production consumers only.**

Never use live keys (`sk_live_`, `pk_live_`) for module development,
integration testing, or any non-production work.

---

## Rationale

- Stripe Sandbox accounts are fully isolated environments — test charges,
  customers, subscriptions, and webhooks cannot affect real money
- Module development requires creating/destroying Stripe resources freely;
  doing this on the live account would pollute production dashboards
- Restricted keys for the Sandbox can be created without approval overhead

---

## What goes where

| Work | Account | Keys |
|---|---|---|
| `@varshyl/stripe-subscriptions` module build + tests | Sandbox `acct_1TY5fkAl8GZyc2PN` | `sk_test_51TY5g4…` |
| ConstructIInv production | Live `acct_1TG76NAHP8NRRyLC` | `sk_live_51TG76N…` |
| Future product production deploy | Live `acct_1TG76NAHP8NRRyLC` | `sk_live_51TG76N…` (or restricted sub-key) |

---

## Railway env var convention (demo-host)

```
STRIPE_SECRET_KEY      = sk_test_51TY5g4…   # Sandbox secret
STRIPE_PUBLISHABLE_KEY = pk_test_51TY5g4…   # Sandbox publishable
STRIPE_ACCOUNT_ID      = acct_1TY5fkAl8GZyc2PN
STRIPE_MODE            = sandbox
STRIPE_WEBHOOK_SECRET  = whsec_…            # From Sandbox webhook endpoint
```

---

## Violation response

If a dev session accidentally uses live keys against demo-host:
1. Immediately rotate the affected live key in Stripe Dashboard
2. Update `varshyl-secrets-vault` with the new key
3. Update Railway ConstructIInv production env
4. Add a lesson entry in `docs/LESSONS.md`

---

> Insert as **OPS-29** in `docs/OPS_RULES.md` when PR #3 (`docs/foundation-2026-05-10`) is merged.
