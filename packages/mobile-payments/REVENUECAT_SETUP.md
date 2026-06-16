# RevenueCat Dashboard Setup — Step by Step

Quick reference for setting up RevenueCat correctly.
Common mistakes that cause payment rejections are marked ⚠️.

---

## 1. Products

Products map to what you created in App Store Connect / Google Play.

| Field | Value | Notes |
|---|---|---|
| Identifier | yourapp_monthly | Must match App Store Connect EXACTLY |
| Type | Auto-Renewable Subscription | Never use "Non-Consumable" for subscriptions |
| Duration | 1 Month | Match your pricing |

⚠️ The product identifier in RevenueCat must match
App Store Connect / Google Play character for character.
A mismatch causes silent purchase failures.

---

## 2. Entitlements

Entitlements are what your app checks to know if a user has access.

| Field | Value |
|---|---|
| Identifier | pro |
| Attached products | yourapp_monthly |

⚠️ If you rename your entitlement after launch, existing
subscribers lose access. Pick the name and keep it forever.

---

## 3. Offerings

Offerings are what your paywall displays.

| Field | Value |
|---|---|
| Identifier | default |
| Package identifier | $rc_monthly |
| Attached product | yourapp_monthly |

⚠️ The offering identifier must be exactly "default" unless
you are running A/B tests. The toolkit looks for "default".

---

## 4. API Keys

| Key | Where to find | Where to use |
|---|---|---|
| iOS public key | RevenueCat → Project Settings → API Keys | REVENUECAT_IOS_API_KEY env var |
| Android public key | Same location | REVENUECAT_ANDROID_API_KEY env var |
| Webhook secret | RevenueCat → Integrations → Webhooks | REVENUECAT_WEBHOOK_SECRET env var |

⚠️ iOS and Android keys are different. Do not use the iOS key
for Android or purchases will silently fail.

⚠️ Never commit API keys to git. Use environment variables only.

---

## 5. Apple App Store Connection

Connect RevenueCat to App Store Connect so it can validate receipts:

1. RevenueCat → Project Settings → iOS → App Store Connect API
2. Generate an API key in App Store Connect:
   Users and Access → Integrations → App Store Connect API
   Role: Finance (minimum required)
3. Upload the .p8 key file to RevenueCat
4. Enter your Issuer ID and Key ID

⚠️ Without this connection RevenueCat cannot validate
iOS receipts and all purchases will show as unverified.

---

## 6. Google Play Connection

1. RevenueCat → Project Settings → Android → Google Play
2. Go to Google Play Console → Setup → API Access
3. Link to a Google Cloud project
4. Create a service account with the following roles:
   - Financial data viewer (minimum)
   - Order management (for refunds)
5. Download the JSON key file
6. Upload to RevenueCat

⚠️ Google Play takes up to 24 hours to propagate
service account permissions. Test the connection
in RevenueCat after 24 hours, not immediately.

---

## 7. Sandbox Testing

| Platform | How to test |
|---|---|
| iOS | Create sandbox tester in App Store Connect. Sign out of real Apple ID on device. Sign in with sandbox account in Settings → App Store. |
| Android | Add Gmail account as license tester in Google Play Console → Setup → License Testing. |

RevenueCat sandbox purchases are free and do not charge real money.
Apple sandbox subscriptions renew every few minutes instead of monthly.

---

## Common Issues

| Symptom | Likely cause | Fix |
|---|---|---|
| "Product not found" error | Product identifier mismatch | Check RevenueCat vs App Store Connect identifier character for character |
| Purchase sheet never appears | RevenueCat not configured before purchase | Call configureMobilePayments() at app startup |
| Subscription granted but expires immediately | Sandbox renewal working correctly | Normal — sandbox renews every few minutes |
| Webhook not firing | Wrong endpoint URL or secret | Verify URL in RevenueCat → Integrations → Webhooks |
| iOS key rejected | Wrong key type | Use the PUBLIC API key, not the secret key |
| Android purchases fail | Service account permissions | Wait 24h after creating service account |
