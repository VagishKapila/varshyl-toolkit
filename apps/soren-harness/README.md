# @varshylinc/soren-harness

STEP 2 end-to-end harness for `@varshylinc/soren`. It drives the **reference
adapter** (all 5 verbs) through the **card-first UI** so you can feel the
verb → card → action loop on a phone. **Not a product.**

## What it exercises

- `find` → spoken summary + a result card ("Found 3 photos from today, sir.")
  with a primary action that **invokes** another verb (`file all to today's log`).
- `attach` / `create` / `file` → confirmation/info cards.
- `delete` → a **confirm** card; tapping **Delete** re-invokes `delete` with
  `confirmed: true`, and the adapter **re-validates the target** before removing
  it (so a stale/double-tap can't delete blind — decision D3).

## Where it saves

The example adapter saves to a seeded in-memory store:
`packages/soren/src/reference/store.ts` (`seedReferenceStore()`). It is reset on
page reload. A real product adapter swaps this store for its authenticated
back-end while keeping the exact same verb shapes.

## Run it

```bash
pnpm --filter @varshylinc/soren-harness dev      # http://localhost:5173 (LAN: --host)
pnpm --filter @varshylinc/soren-harness build    # builds the package, then static dist/
```

For phone testing over HTTPS, deploy `dist/` to a static host (e.g. Railway,
`npx serve dist`) — `getUserMedia`/camera require a secure context, though this
harness is tap-driven and works over plain HTTP on desktop.

## What this is NOT

This harness calls the reference adapter **directly in the browser** to
demonstrate the card flow. The live voice path — Claude calling these verbs
server-side inside the LiveKit room, then ElevenLabs speaking the reply — is
STEP 3: publish `@varshylinc/soren`, add `/server` as a dep in `varshyl-voice`,
and wire `productId → buildSorenSkills(adapter)`. That touches the production
engine behind the live HUD, so it is a separate, deliberate step.
