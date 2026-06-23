# @varshylinc/mobile-payments

In-app subscription payments for iOS and Android.
Built on RevenueCat. Apple 3.1.1 + Google Play Billing compliant.
Drop-in paywall, feature gates, restore purchases — ready in 30 minutes.

---

## What this package does

- Wraps RevenueCat's Capacitor SDK into a clean TypeScript API
- Renders a compliant paywall with all required Apple + Google legal text
- Gates features behind an active subscription
- Handles purchase, restore, webhook verification, and seat tracking
- Works on iOS (App Store) and Android (Google Play)

---

## Requirements

- RevenueCat account (free at revenuecat.com)
- Apple Developer account (for iOS)
- Google Play Developer account (for Android)
- Capacitor app (iOS + Android)

---

## Step 1 — RevenueCat Dashboard Setup (browser, ~15 min)

Do this ONCE before writing any code.

### 1a. Create your app in RevenueCat
1. Go to app.revenuecat.com → New Project
2. Add iOS app → enter your bundle ID (e.g. com.yourcompany.yourapp)
3. Add Android app → enter your package name
4. Copy your iOS API key and Android API key — you'll need these in Step 3

### 1b. Create a Product
1. Go to Products → New Product
2. Product identifier: match exactly what you set in App Store Connect / Google Play
   Example: yourapp_monthly
3. Type: Auto-Renewable Subscription
4. Duration: 1 month
5. If offering a free trial: set it here as an Introductory Offer

### 1c. Create an Entitlement
1. Go to Entitlements → New Entitlement
2. Identifier: pro (or whatever gates your premium features)
3. Attach your product to this entitlement

### 1d. Create an Offering
1. Go to Offerings → New Offering
2. Identifier: default (must be exactly "default")
3. Add a Package → identifier: $rc_monthly
4. Attach your product to this package

### 1e. Verify in RevenueCat dashboard
Before moving to code, confirm:
- ✅ App linked with correct bundle ID
- ✅ Product created and attached to entitlement
- ✅ Offering "default" exists with package "$rc_monthly"
- ✅ API keys copied (iOS + Android separate keys)

---

## Step 2 — App Store Connect Setup (browser, ~10 min)

1. Go to appstoreconnect.apple.com → your app → Subscriptions
2. Create Subscription Group (e.g. "Pro Access")
3. Create subscription matching your RevenueCat product identifier
4. Set price + duration (must match RevenueCat)
5. Add Introductory Offer if applicable (free trial)
6. Submit for review (Apple reviews subscription products separately)

---

## Step 3 — Install + Configure (code, ~10 min)

### Install
```bash
pnpm add @varshylinc/mobile-payments
```

### Configure (run once at app startup, before any paywall)
```typescript
import { configureMobilePayments } from '@varshylinc/mobile-payments';

await configureMobilePayments({
  revenueCatApiKey: platform === 'ios'
    ? process.env.REVENUECAT_IOS_KEY
    : process.env.REVENUECAT_ANDROID_KEY,
  platform: 'ios', // or 'android'
  price: '$35.00',
  period: 'month',
  trialDays: 90,      // omit if no trial
  entitlement: 'pro', // must match RevenueCat dashboard
});
```

---

## Step 4 — Add the Paywall (code, ~5 min)

```tsx
import { PaywallScreen } from '@varshylinc/mobile-payments/client';

<PaywallScreen
  platform="ios"
  price="$35.00"
  period="month"
  trialDays={90}
  onSubscribed={() => {
    // user successfully subscribed — unlock your app
    router.push('/dashboard');
  }}
  onRestore={() => {
    // user restored a previous purchase
    router.push('/dashboard');
  }}
/>
```

The paywall automatically includes all required Apple + Google
legal disclosure text. Do not add it yourself — doing so twice
will cause App Store rejection.

---

## Step 5 — Gate Features

```tsx
import { FeatureGate } from '@varshylinc/mobile-payments/client';

<FeatureGate fallback={<PaywallScreen ... />}>
  <YourPremiumFeature />
</FeatureGate>
```

---

## Step 6 — Restore Purchases (required by Apple)

Apple requires a "Restore Purchases" button be accessible to users.
This is included automatically in PaywallScreen.
If you build a custom paywall, include RestoreButton:

```tsx
import { RestoreButton } from '@varshylinc/mobile-payments/client';

<RestoreButton onRestore={() => router.push('/dashboard')} />
```

---

## Apple + Google Compliance

This package handles compliance automatically. Here is what
is included and why — so you understand what App Store review
will look for:

### Apple (guideline 3.1.1)
- ✅ All purchases go through Apple IAP — no external payment links
- ✅ Price and period displayed clearly on paywall
- ✅ "Payment will be charged to your App Store account at
     confirmation of purchase" — required exact language
- ✅ Auto-renewal notice — required
- ✅ Cancel/manage instructions linking to App Store settings
- ✅ Restore Purchases button — required and accessible
- ✅ Free trial length stated clearly if applicable

### Google Play Billing
- ✅ All purchases go through Google Play Billing
- ✅ Same disclosure text, store-aware (shows "Google Play" copy)
- ✅ Subscription management instructions

### What you must NOT do (causes rejection)
- ❌ Do not add a "Buy on our website" or "Subscribe at yoursite.com" link
- ❌ Do not mention prices outside the paywall that differ from IAP price
- ❌ Do not show external payment forms inside the app
- ❌ Do not duplicate the legal disclosure text — it is already included

---

## Environment Variables

Add these to your .env (never commit real keys):

```
REVENUECAT_IOS_API_KEY=appl_xxxxxxxxxxxx
REVENUECAT_ANDROID_API_KEY=goog_xxxxxxxxxxxx
```

---

## Webhook Setup (optional but recommended)

Webhooks let your server know when subscriptions change
(renewal, cancellation, billing issue) without polling.

1. RevenueCat dashboard → Integrations → Webhooks
2. Add endpoint: https://yourapi.com/webhooks/revenuecat
3. Use the server-side webhook handler:

```typescript
import { handleRevenueCatWebhook } from '@varshylinc/mobile-payments';

app.post('/webhooks/revenuecat', async (req, res) => {
  const result = await handleRevenueCatWebhook(req, {
    secret: process.env.REVENUECAT_WEBHOOK_SECRET,
    onSubscribed: async (userId) => { /* grant access */ },
    onCancelled: async (userId) => { /* revoke access */ },
    onBillingIssue: async (userId) => { /* notify user */ },
  });
  res.json(result);
});
```

---

## Grants admin API (optional)

Mount the Express router for promo codes and manual grants (beta access, support overrides):

```typescript
import { grantsRouter } from '@varshylinc/mobile-payments/express';

app.use('/api/grants', grantsRouter(pool));
```

Grant helpers (`hasGrantedAccess`, `grantAccess`, etc.) remain on the main package entry.

---

## What developers usually add next

These are not required — but they pair naturally
with this package:

💡 @varshylinc/onboarding-consent-engine — capture
payment consent at sign up. Required in many regions.

💡 @varshylinc/notifications — re-engage users whose
trials are ending or subscriptions have lapsed.

## Steps to complete your RevenueCat setup

1. Create a free account at revenuecat.com
2. Add your iOS app bundle ID or Android package name
3. Upload your App Store subscription key
4. Create a subscription product and entitlement
5. Copy your iOS Public API Key (starts with appl_)
6. Pass it to configureMobilePayments()

---

## QA Checklist (run before App Store submission)

See QA.md for the full checklist.
