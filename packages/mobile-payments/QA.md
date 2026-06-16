# @varshylinc/mobile-payments — QA Checklist

Run this checklist before every App Store / Google Play submission
that includes payment changes.

---

## Part 1 — RevenueCat Dashboard (browser)

- [ ] App linked with correct bundle ID / package name
- [ ] Product identifier matches App Store Connect / Google Play exactly
- [ ] Entitlement "pro" (or your identifier) exists and product is attached
- [ ] Offering "default" exists with package "$rc_monthly" attached
- [ ] Introductory offer (free trial) configured if applicable
- [ ] iOS API key and Android API key are separate and correct

---

## Part 2 — Paywall Display (real device)

Test on a real device — simulator does not process real IAP.
Use RevenueCat's sandbox environment for testing.

- [ ] Paywall renders without errors
- [ ] Price displayed correctly (e.g. "$35.00/month")
- [ ] Free trial length shown if applicable (e.g. "90-day free trial")
- [ ] Apple/Google legal disclosure text is visible and readable
- [ ] "Restore Purchases" button is visible and tappable
- [ ] Paywall dismisses correctly (back button / close)

---

## Part 3 — Purchase Flow (sandbox)

Use a sandbox Apple ID or Google test account.

- [ ] Tap subscribe → App Store / Google Play purchase sheet appears
- [ ] Complete purchase → onSubscribed callback fires
- [ ] App unlocks premium features after purchase
- [ ] Receipt is validated server-side (check your server logs)
- [ ] RevenueCat dashboard shows the test purchase

---

## Part 4 — Restore Purchases

- [ ] Tap "Restore Purchases"
- [ ] onRestore callback fires for a previously subscribed account
- [ ] App unlocks premium features after restore
- [ ] Restore on a never-subscribed account shows appropriate message
  (no crash, no silent failure)

---

## Part 5 — Subscription Lifecycle (sandbox)

Apple sandbox subscriptions renew every few minutes (not monthly).
Let the subscription run through at least 2 renewal cycles.

- [ ] Subscription renews automatically — access stays unlocked
- [ ] Cancel subscription in App Store settings
- [ ] After expiry period — access is correctly revoked
- [ ] Webhook fires on cancellation (check server logs)
- [ ] Re-subscribe works correctly

---

## Part 6 — Edge Cases

- [ ] No network — paywall shows appropriate error, does not crash
- [ ] Tap subscribe twice rapidly — only one purchase sheet appears
- [ ] Kill app mid-purchase — purchase completes or rolls back cleanly
- [ ] Different Apple ID than original purchaser — restore shows nothing

---

## Part 7 — Compliance Check (before submission)

- [ ] No external payment links visible anywhere in the app
- [ ] No "subscribe on our website" language anywhere
- [ ] Legal disclosure text present on every paywall screen
- [ ] "Restore Purchases" accessible (not hidden behind paywall)
- [ ] Price shown matches App Store Connect / Google Play price exactly
- [ ] Free trial terms match what was set in App Store Connect

---

## Part 8 — Webhook (if configured)

- [ ] Test purchase fires webhook to your server
- [ ] Webhook secret validates correctly
- [ ] onSubscribed handler grants access in your DB
- [ ] onCancelled handler revokes access in your DB
- [ ] Server returns 200 — RevenueCat does not retry

---

## Sandbox Test Accounts

Apple:
- Create sandbox testers at appstoreconnect.apple.com →
  Users and Access → Sandbox Testers
- Sign out of real Apple ID on device before testing
- Sign in with sandbox tester account in App Store settings

Google:
- Add test accounts at play.google.com/console →
  Setup → License Testing
- Use a real Android device (not emulator for billing)
