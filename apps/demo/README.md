# @varshylinc/soren-demo

Phone-QA harness for the Soren voice packages (`soren-core` + `soren-react`).
**Not a product** — it mounts `SorenProvider` with a mock *JobSite Intel* adapter
config against the live voice engine.

## Run locally

```bash
pnpm --filter @varshylinc/soren-demo dev   # vite --host → prints a Network URL
```

Open the **Network** URL (e.g. `http://192.168.1.84:5174/`) on a phone on the
same Wi-Fi.

## ⚠️ HTTPS is REQUIRED for microphone on real devices

`getUserMedia()` (mic capture) is a **secure-context-only** API. Browsers allow
it on `http://localhost`, but **iOS Safari and Chrome Android will silently
block the mic over plain `http://<LAN-IP>`**. Over LAN HTTP you can still hear
agent audio and exercise the Quick Note card, but **the mic will not record**.

### Action item for deploy (do not forget)

> **The Railway deploy of this demo MUST serve over HTTPS.** Railway provides a
> TLS endpoint out of the box (`https://<service>.up.railway.app`), so the
> deployed demo gets a secure context automatically — that is the only
> environment where on-device mic QA is valid. Local LAN HTTP testing is for
> layout/audio only, not mic.

For ad-hoc HTTPS on the LAN without deploying, front the dev server with a
tunnel (e.g. `cloudflared tunnel --url http://localhost:5174`) and open the
`https://` URL it prints.

## Mobile notes

- Mic button is a 64×64 tap target and respects iOS safe-area insets.
- Agent audio is unlocked on the first mic tap (iOS autoplay policy).
- The Quick Note camera input accepts photo **and** video capture.
