# Varshyl Toolkit — Marketing Source Write-Up

> **How to use this doc:** This is raw source material. Feed it to ChatGPT (or write directly) to produce platform-specific posts. It contains the story, the facts, the technical substance, and per-platform angles. The honest-builder framing throughout is deliberate — see "Tone" at the end. Don't let any tool turn this into hype; on developer channels, hype gets punished and authenticity gets upvoted.

---

## The one-line version
A set of four open-source npm packages that handle the boring-but-hard parts of building a mobile + web SaaS app — login, subscriptions, consent, and team management — so you don't rebuild them for every product.

## What it actually is
**Varshyl Toolkit** is a public monorepo of four independent, composable TypeScript packages, published under the `@varshylinc` scope on npm, Apache-2.0 licensed:

- **`@varshylinc/auth-social`** — Authentication for Capacitor + web apps. Apple sign-in, Google sign-in, email/password, sessions, password reset, a show/hide password toggle, and a consent slot. You keep your own user database (adapter pattern) instead of handing users to a vendor.
- **`@varshylinc/onboarding-consent-engine`** — Onboarding and legal consent. Terms/Privacy acceptance, GDPR/CCPA-style data-use consent with a proper audit trail, and a ready-made signup consent block that gets the legal pattern right (more on that below).
- **`@varshylinc/mobile-payments`** — In-app subscriptions for Capacitor apps via RevenueCat. Apple IAP + Google Play Billing, free trials, paywall UI, read-only enforcement when a subscription lapses. Built seat-aware from day one so team billing drops in later without a migration.
- **`@varshylinc/team-management`** — Organization and team management. Member roster, roles, hierarchy, an admin "People" page, and a seat-ready data model.

Each works on its own. They're designed to compose (auth-social's signup screen has a slot that onboarding-consent-engine's consent block drops into) but never depend on each other — the *app* wires them together. So you can take just the one you need.

## Why it exists (the origin story — true, use it)
I'm building construction-tech products at Varshyl. Every product needs the same foundation: people log in, agree to terms, maybe pay, maybe invite their team. I was rebuilding that foundation per product, and getting it subtly wrong in different ways each time. So I pulled it out into a shared toolkit, hardened it, and open-sourced the parts that aren't my competitive edge. The products are the business; the plumbing is just plumbing — and plumbing is better when it's shared, battle-tested, and out in the open.

## The technical substance (this is what earns respect on HN/Reddit)

**1. A pre-publish "rail" that encodes hard-won bugs.**
The first two packages cost me multiple follow-up patches each, always for the same handful of mistakes: a broken `exports` map missing the CommonJS `require` condition; SQL migrations that didn't get included in the published tarball; a `./client` entry point pointing at a file the build never actually produced (so the React components silently didn't ship); a native SDK imported at the top level so the package crashed in any non-mobile environment; a missing CHANGELOG entry that failed the publish gate; a branch quietly out of date with main.

So I built a single script — `pnpm prepush <package>` — that runs all of those checks before anything is pushed, plus a CI job that re-runs the packaging checks on every PR. The keystone check actually packs the tarball, installs it in a clean temp directory, and tries to `require()` and `import()` every entry point — the only way to truly catch "it works in the workspace but breaks for consumers." It even verifies that optional native-SDK entry points load *without* the SDK installed. The rail paid for itself on its first use: it caught a package whose UI components were never shipping.

**2. You own your data.**
Auth doesn't hand your users to a third-party identity service — the package owns its own auth tables, and your app's canonical user records stay in your database, connected through an adapter. Same philosophy across the toolkit: each package owns its own prefixed tables (`as_`, `oce_`, `mp_`, `tm_`) in your Postgres. Raw `pg` + SQL migrations, no ORM.

**3. Native SDKs are optional and lazy.**
The payment package (RevenueCat) and the social-login package (Capacitor plugins) wrap native mobile SDKs. Those are declared as *optional peer dependencies* and loaded via guarded dynamic import — so the packages install and import cleanly in a plain Node or web environment, and only require the native SDK if you actually call the native path. This is the thing most wrappers get wrong.

**4. The consent pattern is legally correct by construction.**
The signup consent block enforces a hybrid: Terms of Service + Privacy Policy are implied-by-action (clickable links, no checkbox — standard and fine), while any AI-training / secondary-data-use consent is a **separate, explicit, unchecked-by-default, optional** checkbox. That separation isn't a UX preference — under GDPR/CCPA, consent for secondary data use has to be freely given, specific, and unbundled, or it's invalid. The component makes it hard to get this wrong, and records a deliberate decline (not just an absence) for audit defensibility.

**5. Release engineering.**
Monorepo, changesets for versioning, per-package git tags trigger publishes via GitHub Actions, each package gates merges on its own mock-backed CI smoke test plus a shared pre-publish packaging check. TypeScript strict, no `any`, files kept small and single-purpose.

## Who it's for
Solo founders and small teams building **Capacitor (Ionic) + web** SaaS apps who want the auth/payments/consent/team foundation without adopting a heavyweight identity vendor or rebuilding it per product. Especially anyone shipping a mobile app that needs Apple IAP / Google Play Billing done right, or anyone who needs the consent layer to actually hold up legally.

## What it's NOT (be honest about this)
- It's early. Low version numbers, no external adoption yet — I built it for my own products and opened it up.
- It's opinionated (raw `pg`, Capacitor-first, React). If you're on a different stack it may not fit.
- It's not a Clerk/Auth0/Supabase competitor in features — it's the lighter, you-own-it, compose-what-you-need alternative for a specific kind of app.

---

## Platform-specific angles

**LinkedIn** (your strongest channel — founder/builder audience):
- Angle: the *story* + the discipline. "I kept rebuilding login/payments/consent for every product and getting it subtly wrong. So I built a shared toolkit, hardened it with a CI rail that encodes every packaging bug I'd hit, and open-sourced it." Lead with the human problem, end with the link. Professional, reflective, not salesy.
- A second post later: just the pre-push-rail idea on its own ("six bugs that kept biting my npm packages, and the one script that killed them") — that's genuinely useful content that stands alone.

**Reddit** — pick the subreddit per angle, read each sub's rules first, and never cross-post the same text:
- r/reactnative or r/ionic or r/Capacitor_JS — "Open-sourced the auth + IAP + consent packages I built for my Capacitor apps." Most on-target audience.
- r/typescript — lead with the engineering (the tarball install-test rail, the optional-peer lazy-import pattern).
- r/SaaS or r/indiehackers — the founder/story framing.
- Reddit punishes anything that smells like an ad. Post as "here's a thing I made, here's the thinking, feedback welcome," respond to comments, don't oversell.

**Hacker News** (highest risk, highest reward):
- "Show HN: Varshyl Toolkit – auth, IAP, consent, and team management for Capacitor + web apps." One honest paragraph. HN rewards substance and candor (the "what it's NOT" section is your friend here) and savages hype. Only post when you can be around for a few hours to answer comments.

**dev.to / Hashnode** (durable SEO content):
- A longer technical write-up: "The 6 packaging bugs that kept breaking my npm publishes — and the pre-push rail that fixed them." This is the piece most likely to rank on Google over time and pull steady traffic to the packages.

**X/Twitter**:
- A short thread version of the LinkedIn post, one idea per line, link at the end.

## Suggested post skeletons (for ChatGPT to expand — keep them honest)
- **Hook options:** "I rebuilt login for the fourth time and finally snapped." / "Six bugs kept breaking my npm publishes. Here's the script that killed all six." / "I open-sourced the boring 80% of every SaaS app."
- **Body:** the problem → what you built (four packages, one line each) → one concrete technical detail that shows it's real (the tarball install-test, or the legal consent pattern) → honest framing (early, opinionated, use if useful).
- **CTA:** link to the GitHub repo (primary) and/or npm. Invite feedback, not just installs.

## Links to include (once the repo is public)
- GitHub: `https://github.com/VagishKapila/varshyl-toolkit`
- npm: `https://www.npmjs.com/package/@varshylinc/auth-social` (and the other three)

## Tone (the most important rule)
You are a builder sharing real work, not a company running an ad. Specific > grand. "I built this, here's the thinking, here's the code" beats "revolutionary platform." Admit the limitations — it makes the strengths credible. The fact that this is genuinely useful infrastructure you actually shipped is the whole story; let it be that.
