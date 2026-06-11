# Soren Runtime Handoff

**Document purpose:** Code-grounded inventory of the only deployed Soren voice runtime, to seed extraction into `@varshylinc/soren` in this monorepo.

**Generated:** 2026-06-11  
**Method:** Read-only inspection of source on disk. No secrets. Unverifiable items marked **UNVERIFIED**.

---

## 0. Scope & provenance

| Item | Value |
|------|-------|
| **Runtime source repo** | `VagishKapila/varshyl-voice` (private monorepo) |
| **Local path inspected** | `/Users/vagkapi/My Drive/DesktopStuff/Lucian Aria Jarvis/varshyl-voice` |
| **Production HUD URL** | https://varshyl-voice-hud-production.up.railway.app |
| **Production engine URL** | https://varshyl-voice-engine-production.up.railway.app |
| **This document lives in** | `varshyl-toolkit/docs/SOREN_RUNTIME_HANDOFF.md` (extraction target repo) |

**Important:** The running Soren stack is **not** in `varshyl-toolkit`. This repo only receives the handoff doc. All code citations below refer to `varshyl-voice` unless noted.

**Deployment topology** (from `STAGING.md` in varshyl-voice):

- Two Railway services from one monorepo: `varshyl-voice-hud` (Next.js) + `varshyl-voice-engine` (Express + LiveKit worker).
- HUD proxies `POST /api/token` → engine `POST /token` via `EXPRESS_BACKEND_URL`.
- A third implementation exists: Vite HUD built into engine static assets at `GET /test` (legacy/alternate path).

---

## 1. STT — what is actually used

**Answer:** Server-side batch transcription via LiveKit Agents — **not** browser STT for the agent pipeline.

| Priority | Provider | Model | Code |
|----------|----------|-------|------|
| Preferred | Groq (via `@livekit/agents-plugin-openai`) | `whisper-large-v3` (probe confirms) | `apps/voice-engine/src/agent-entry.ts:300-301` — `STT.withGroq({ apiKey: env.GROQ_API_KEY })` |
| Fallback | OpenAI Whisper (same plugin) | `whisper-1`, `language: 'en'` | `apps/voice-engine/src/agent-entry.ts:302-306` — `new STT({ apiKey, model: 'whisper-1', language: 'en' })` |

**VAD (gates when STT runs):** Silero neural VAD — `@livekit/agents-plugin-silero`, `VAD.load()` at `agent-entry.ts:309-313`. Utterances are segmented by VAD end-of-turn; there is no streaming STT API in code.

**Browser STT (wake word only):** Web Speech API — `window.SpeechRecognition` / `webkitSpeechRecognition`. Used **only** for local wake-phrase detection; transcripts are **not** sent to the agent STT path.

- Vite HUD: `apps/voice-engine/hud-app/src/lib/wakeWord.ts:48-50` — `createWakeWordDetector()`
- Next.js port (unused in production path): `hud-app/lib/wake-word.ts`

**Mic capture → LiveKit → server STT:**

- Vite: `createLocalAudioTrack({ echoCancellation, noiseSuppression, autoGainControl })` — `hud-app/src/App.tsx:437-441`
- Next.js: `new Room({ audioCaptureDefaults: { ... } })` — `hud-app/components/app/app.tsx:115-124`

**Not used:** Capacitor speech plugin, direct OpenAI Whisper HTTP from HUD, `speechSynthesis` for input.

---

## 2. TTS — what is actually used

**Answer:** Server-side TTS via LiveKit Agents plugins. HUD does **not** call ElevenLabs/OpenAI directly for agent speech.

| `TTS_PROVIDER` env | Implementation | Voice / model | Code |
|--------------------|----------------|---------------|------|
| `elevenlabs` (default) | `@livekit/agents-plugin-elevenlabs` | Per-persona ElevenLabs voice + `eleven_turbo_v2_5` | `apps/voice-engine/src/tts/providers/elevenlabs.ts:12-23` |
| `openai` | `@livekit/agents-plugin-openai` | `tts-1-hd`, voice `fable` | `apps/voice-engine/src/tts/providers/openai.ts:17-23` |

**Factory:** `createTTS()` in `apps/voice-engine/src/tts/providers/index.ts:16-37` — quota guard + phrase cache wrapper for ElevenLabs.

**Voice profiles** live in `@varshyl/persona` (workspace package):

| Persona | ElevenLabs voice ID | Model | File |
|---------|---------------------|-------|------|
| Soren | `pNInz6obpgDQGcFmaJgB` (Adam) | `eleven_turbo_v2_5` | `packages/persona/src/soren.ts:7-8` |
| Aria | `21m00Tcm4TlvDq8ikWAM` (Rachel) | `eleven_turbo_v2_5` | `packages/persona/src/aria.ts:7-8` |
| Lucian | alias → same as Soren | `eleven_turbo_v2_5` | `packages/persona/src/lucian.ts:7-8` |

**HUD-local audio (not TTS API):** Pre-recorded MP3 wake stings + greetings via `HTMLAudioElement`:

- `hud-app/src/lib/wake-sting.ts` — `playWakeSting()`
- `hud-app/src/lib/greeting.ts` — `playGreeting()`
- Assets: `hud-app/public/sounds/`

**Agent voice playback:** LiveKit remote audio track → `track.attach()` → hidden `<audio>` — `hud-app/src/App.tsx:378-388`.

**Not used in HUD:** `window.speechSynthesis` for agent replies.

---

## 3. WAKE WORD — "Hey Soren"

### Browser detection (client)

**Library:** None — native **Web Speech API** (`SpeechRecognition`), no Porcupine/Picovoice/Capacitor plugin.

**Implementation:** `createWakeWordDetector()` in `hud-app/src/lib/wakeWord.ts`.

**Patterns (Soren):**

```ts
/\b(hey|hi|hello|ok|okay)\s+(soren|sorin|soran|søren)\b/i
/\bsoren\b/i   // bare word — Vite only; Next.js port omits this
```

**Always-on strategy:**

- `continuous: true`, `interimResults: true`, `lang: 'en-US'` — `wakeWord.ts:76-78`
- Auto-restart on `onend` (browser stops SR periodically)
- **Paused** while `voiceState === 'speaking'` to prevent echo loop (agent TTS → mic → SR) — `App.tsx:288-296`
- Requires prior user gesture: ConnectGate unlocks `AudioContext` before mic/SR start — `App.tsx:260-276, 500-503`

**Browser constraints:** Chrome autoplay policy, SpeechRecognition availability (WebKit prefix on Safari), mic permission prompt after gesture.

### Server gate (agent)

**Mode 3 dormant/active** in `agent-entry.ts`:

- Agent starts **dormant** after greeting (`onEnter` says *"Say Hey Soren to wake me"*).
- User turns ignored unless `agentMode === 'active'` or within 3s grace window — `agent-entry.ts:183-190`.
- **Activation:** LiveKit DataChannel message with topic **`wake-trigger`** → `PersonaAgent.handleWakeTrigger()` — `agent-entry.ts:159-163, 422-428`.

### Critical wiring gap (verified in source)

| Client | Publishes `wake-trigger`? | Evidence |
|--------|---------------------------|----------|
| `public/test.html` (legacy) | **Yes** | `publishData(..., { topic: 'wake-trigger' })` — line ~653-658 |
| Vite `src/App.tsx` (built to `/test` on engine) | **No** | `onWake` only plays sting/greeting — `App.tsx:482-489`; only `cancel-current-turn` published — `App.tsx:306-307` |
| Next.js production HUD | **No** | `lib/wake-word.ts` exists but is **not imported** by any `components/` file |
| Built `public/hud/assets/*.js` | **No** | grep for `wake-trigger` in `public/hud/` → zero matches |

**Implication:** Browser may detect "Hey Soren" and play local sting, but **server may remain dormant** and ignore mic audio until `wake-trigger` is published. Full wake flow requires fixing this gap.

**Production HUD** (`varshyl-voice-hud-production.up.railway.app`) shows wake hint text in `welcome-view.tsx:99-104` but **UNVERIFIED** whether deployed build differs from local Next.js tree (local `session-view.tsx` imports missing components: `top-bar`, `persona-core`, etc.).

---

## 4. BRAIN — LLM endpoint, model, system prompt

| Item | Detail |
|------|--------|
| **Service** | `varshyl-voice-engine` LiveKit agent worker (`apps/voice-engine`) |
| **LLM adapter** | Custom `AnthropicLLM` — `apps/voice-engine/src/anthropic-llm.ts` |
| **SDK call** | `anthropicClient.messages.stream({ model, max_tokens, system, messages, tools })` — `anthropic-llm.ts:176-182` |
| **Model string** | `'claude-sonnet-4-6'` hardcoded — `agent-entry.ts:345` |
| **max_tokens** | `512` (voice-optimized) — `agent-entry.ts:346` |
| **Repo** | `VagishKapila/varshyl-voice` — not ConstructInv, not varshyl-toolkit |

**System prompt sources:**

1. **Persona base prompt** — `packages/persona/src/soren.ts:9-25` (Soren identity, Vagish/Varshyl context, override passphrase, product list).
2. **Tool overlay** — inline string in `agent-entry.ts:319-340` (ConstructInv tools, web_search, fun-pack personas).
3. **RAG injection** — `RagClient.query()` prepends context via `turnCtx.addMessage()` — `agent-entry.ts:223-234` (requires `DATABASE_URL` + `OPENAI_API_KEY`).

**Tools (ConstructInv):** Loaded via `getActiveSkills({ product: 'constructinv' })` — cash flow, receivables, lien deadlines, etc. HTTP to ConstructInv API through `apps/voice-engine/src/skills/constructinv/api-client.ts`.

**ConstructInv mint (multi-tenant auth only):** `POST /api/voice/mint-session-token` in `construction-ai-billing` repo — `server/routes/voice.js` (local: `/Users/vagkapi/dev/constructinv`).

---

## 5. STREAMING

| Stage | Mode | Evidence |
|-------|------|----------|
| **STT** | **Batch per utterance** | VAD end-of-turn → Whisper transcribe; no streaming STT client |
| **LLM** | **Streaming** | `for await (const event of stream)` text deltas → `queue.put()` — `anthropic-llm.ts:185-199` |
| **TTS** | **Streaming** (plugin) | LiveKit `AgentSession` pipes LLM stream → TTS → audio track |
| **HUD playback** | LiveKit track subscribe | `track.attach()` real-time audio — `App.tsx:378-388` |
| **Wake browser STT** | Interim + final | `interimResults: true` — local only, not sent to brain |

---

## 6. File inventory

Line counts from `wc -l` on 2026-06-11. Excludes `node_modules`, `.next`, binary MP3 bodies counted as lines from `wc` (approximate for binaries).

### 6a. `apps/voice-engine/hud-app/` (HUD client)

| Lines | Path | Purpose |
|------:|------|---------|
| 520 | `src/App.tsx` | **Vite production HUD** — ConnectGate, LiveKit room, wake detector, FFT, stop |
| 714 | `src/components/AriaHUD.tsx` | Circular HUD UI (rings, gauges, transcript pill, STOP) |
| 177 | `src/lib/wakeWord.ts` | Web Speech API wake-word detector (Vite) |
| 116 | `src/lib/wake-sting.ts` | Random MP3 wake sting player |
| 82 | `src/lib/greeting.ts` | Greeting audio player |
| 38 | `src/lib/fft.ts` | Web Audio FFT analyser for waveform bars |
| 10 | `src/main.tsx` | Vite React mount |
| 13 | `src/index.css` | Vite global styles |
| 26 | `index.html` | Vite entry + LiveKit CDN importmap |
| 18 | `vite.config.ts` | Builds to `../public/hud/` |
| 156 | `components/app/app.tsx` | Next.js root — token mint, LiveKit session, multi-tenant |
| 107 | `components/app/welcome-view.tsx` | Persona selection + wake hint |
| 86 | `components/app/session-view.tsx` | Active session layout (**imports missing components**) |
| 107 | `components/app/bottom-bar.tsx` | STOP / end session |
| 40 | `components/app/view-controller.tsx` | Welcome ↔ session switch |
| 182 | `lib/wake-word.ts` | Wake detector Next.js port (**not wired**) |
| 53 | `lib/use-interrupt.ts` | STOP: mute audio + `cancel-current-turn` DataChannel |
| 73 | `app-config.ts` | Persona config, `FEATURE_FLAGS.SHOW_ARIA` |
| 23 | `next.config.ts` | Proxies `/api/token` → Express `/token` |
| 43 | `package.json` | Next.js deps (see §7) |
| 22 | `tsconfig.json` | TypeScript config |
| 16 | `app/layout.tsx` | Next.js root layout |
| 5 | `app/page.tsx` | Next.js entry |
| 127 | `components/agents-ui/agent-audio-visualizer-radial.tsx` | Radial visualizer |
| 86 | `components/agents-ui/agent-control-bar.tsx` | LiveKit control bar |
| 31 | `components/agents-ui/agent-session-provider.tsx` | Session context wrapper |
| 36 | `components/agents-ui/start-audio-button.tsx` | Autoplay unlock button |
| 6 | `lib/shadcn/utils.ts` | `cn()` helper |
| 62 | `styles/globals.css` | Next.js global styles + fonts |
| 63 | `public/sounds/generate-greetings.js` | Dev script to generate greeting MP3s |
| 22 | `README.md` | Build/serve notes |
| 10 | `.gitignore` | Git ignore |

**Missing files referenced by Next.js `session-view.tsx`:** `top-bar`, `persona-core`, `conversation-log`, `telemetry`, `data-stream-bg` — **not present in repo**.

### 6b. `apps/voice-engine/src/` (engine + agent brain)

| Lines | Path | Purpose |
|------:|------|---------|
| 462 | `agent-entry.ts` | Per-room STT/VAD/LLM/TTS pipeline, dormant/active state machine |
| 270 | `anthropic-llm.ts` | Claude streaming adapter + tool-use loop |
| 190 | `token.ts` | `POST /token` LiveKit JWT mint + rate limit |
| 148 | `index.ts` | Express boot, static HUD at `/test`, health, worker start |
| 350 | `probe.ts` | `GET /probe` upstream health (Groq, Anthropic, ElevenLabs) |
| 66 | `agent.ts` | LiveKit worker lifecycle |
| 67 | `env.ts` | Zod env validation |
| 38 | `tts/providers/index.ts` | TTS factory |
| 24 | `tts/providers/elevenlabs.ts` | ElevenLabs TTS instance |
| 24 | `tts/providers/openai.ts` | OpenAI TTS fallback |
| 146 | `tts/caching-tts.ts` | Phrase cache wrapper |
| 84 | `tts/phrase-cache.ts` | Disk phrase cache |
| 63 | `tts/quota-guard.ts` | ElevenLabs quota check |
| 60 | `skills/constructinv/api-client.ts` | ConstructInv HTTP client (multi-tenant / DEV) |
| 100 | `skills/constructinv/cashflow.ts` | Cash-flow tool |
| 48 | `skills/constructinv/liens.ts` | Lien deadline tool |
| 42 | `skills/constructinv/aria.ts` | Aria hero message tool |
| 59 | `skills/constructinv/schemas.ts` | Tool schemas |
| 24 | `skills/constructinv/voice-context.ts` | AsyncLocalStorage user token |
| 12 | `skills/constructinv/index.ts` | Skill exports |
| 235 | `skills/_core/fun-pack.ts` | Jokes, riddles, persona modes |
| 90 | `skills/_core/api-client-base.ts` | Base HTTP client |
| 25 | `skills/_core/skill-registry.ts` | Tool registry |
| 23 | `skills/_core/schemas.ts` | Shared tool types |
| 10 | `skills/_core/confirmation-flow.ts` | Confirmation helper |
| 13 | `skills/_core/formatting.ts` | Response formatting |
| 8 | `skills/_core/web-search.ts` | Web search tool |

### 6c. `packages/persona/src/` (voice + prompt profiles)

| Lines | Path | Purpose |
|------:|------|---------|
| 27 | `soren.ts` | Soren system prompt + ElevenLabs voice IDs |
| 25 | `aria.ts` | Aria system prompt + voice IDs |
| 51 | `lucian.ts` | Legacy Lucian → Soren alias |
| 35 | `index.ts` | `getPersona()` export |

### 6d. Routes the HUD calls directly

| Route | Method | Caller | Backend file |
|-------|--------|--------|--------------|
| `/token` | POST | Vite `App.tsx:44` | `src/token.ts` |
| `/api/token` | POST | Next.js `app.tsx:98` (rewrite) | → `/token` |
| ConstructInv `/api/voice/mint-session-token` | POST | Next.js `app.tsx:39-46` only | `constructinv/server/routes/voice.js` |
| LiveKit `wss://…` | WebSocket | Both HUDs | LiveKit Cloud |
| `GET /health`, `GET /probe` | — | Ops only; HUD does not call | `src/index.ts`, `src/probe.ts` |

---

## 7. Stack

### Monorepo root (`varshyl-voice/package.json`)

```json
{
  "name": "varshyl-voice",
  "version": "1.0.0",
  "private": true,
  "description": "Varshyl Voice — Unified AI voice engine powering Aria and Lucian personas",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "rag:ingest": "pnpm --filter @varshyl/rag run ingest",
    "engine:start": "pnpm --filter @varshyl/voice-engine run start",
    "engine:dev": "pnpm --filter @varshyl/voice-engine run dev",
    "test:layer9": "node tests/real-user/live-site-check.js"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "typescript": "^5.7.2",
    "@types/node": "^22.10.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

### HUD (`apps/voice-engine/hud-app/package.json`) — verbatim

```json
{
  "name": "varshyl-voice-hud",
  "version": "18.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start -p ${PORT:-3001}",
    "lint": "next lint"
  },
  "dependencies": {
    "@livekit/components-react": "^2.9.20",
    "@livekit/protocol": "^1.41.0",
    "@phosphor-icons/react": "^2.1.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-tooltip": "^1.2.8",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "livekit-client": "^2.17.2",
    "lucide-react": "^0.555.0",
    "motion": "^12.16.0",
    "next": "15.5.14",
    "next-themes": "^0.4.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^22.0.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.5.2",
    "tailwindcss": "^4",
    "typescript": "^5"
  },
  "packageManager": "pnpm@9.15.9"
}
```

**Note:** Production Vite HUD at `/test` is built with **Vite** (`vite.config.ts`), not `next build`. `package.json` scripts target Next.js only.

### Engine (`apps/voice-engine/package.json`)

```json
{
  "name": "@varshyl/voice-engine",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@livekit/agents": "^1.0.0",
    "@livekit/agents-plugin-elevenlabs": "^1.0.0",
    "@livekit/agents-plugin-openai": "^1.0.0",
    "@livekit/agents-plugin-silero": "^1.0.0",
    "@anthropic-ai/sdk": "^0.91.0",
    "@varshyl/persona": "workspace:*",
    "@varshyl/rag": "workspace:*",
    "express": "^4.21.2",
    "livekit-server-sdk": "^2.8.0",
    "openai": "^4.77.0",
    "zod": "^3.24.1"
  }
}
```

**Framework summary:** Node 20, Express 4, LiveKit Agents v1.x, React 18/19, Vite 5 (HUD alt), Next.js 15 (HUD prod service), pnpm workspaces, Turbo.

---

## 8. State machines

### 8a. Server — `PersonaAgent` (`agent-entry.ts`)

```
dormant ──wake-trigger (DataChannel)──► active
   ▲                                      │
   │    user speaks within 3s grace       │
   └──────────────────────────────────────┘
   └── idle + 3s past gracePeriodEnd ──► dormant
```

- `onUserTurnCompleted`: dropped if dormant and outside grace — lines 183-190
- Stop words → `session.interrupt()` skip LLM — lines 196-202
- VAD thresholds switch on agent speaking vs listening — lines 381-404

**Agent session states** (LiveKit): `connecting` | `initializing` | `listening` | `thinking` | `speaking` | `disconnected`

### 8b. Vite HUD client (`VoiceState` in `AriaHUD.tsx:31`)

```
ConnectGate (audioReady=false)
  └─ user tap/key ──► audioReady=true ──► connectRoom()
       voiceState: connecting → idle (on Connected)
       maps lk.agent.state → listening | speaking | connecting | idle
       wake detector: start after audioReady; pause when speaking
```

### 8c. Next.js HUD (`session-view.tsx`)

Maps `useVoiceAssistant().state` → `AgentState` enum — lines 14-24. No explicit recording/processing states; relies on LiveKit agent state.

**Recording/processing/speaking:** There is no separate client "recording" state. Mic is always published after connect. "Processing" maps to agent `thinking`. "Speaking" maps to agent `speaking` + local wake-detector pause.

---

## 9. Environment variables (names only)

### `voice-engine` (`src/env.ts`)

| Variable | Read in |
|----------|---------|
| `LIVEKIT_URL` | `env.ts`, `token.ts`, `agent.ts` |
| `LIVEKIT_API_KEY` | `env.ts`, `token.ts`, `agent.ts` |
| `LIVEKIT_API_SECRET` | `env.ts`, `token.ts`, `agent.ts` |
| `GROQ_API_KEY` | `env.ts`, `agent-entry.ts` (STT) |
| `OPENAI_API_KEY` | `env.ts`, STT fallback, RAG embeddings, OpenAI TTS |
| `ANTHROPIC_API_KEY` | `env.ts`, `agent-entry.ts`, `anthropic-llm.ts` |
| `ELEVENLABS_API_KEY` | `env.ts`, `createTTS()` |
| `TTS_PROVIDER` | `env.ts` (`elevenlabs` \| `openai`) |
| `DATABASE_URL` | `env.ts`, `agent-entry.ts` (RAG) |
| `GOOGLE_DRIVE_MCP_URL` | `env.ts` (optional) |
| `CONSTRUCTINV_API_URL` | `env.ts`, `api-client.ts` |
| `CONSTRUCTINV_API_KEY` | `env.ts`, `api-client.ts` |
| `PORT` | `env.ts`, `index.ts` |
| `NODE_ENV` | `env.ts`, `agent.ts`, VAD dev logging |

### `hud-app`

| Variable | Read in |
|----------|---------|
| `EXPRESS_BACKEND_URL` | `next.config.ts:3` |
| `NEXT_PUBLIC_CONSTRUCTINV_MINT_URL` | `components/app/app.tsx:20-22` |
| `ELEVENLABS_API_KEY` | `public/sounds/generate-greetings.js` (dev only) |
| `PORT` | `package.json` start script |

### ConstructInv (external, for mint)

| Variable | Read in |
|----------|---------|
| `VOICE_JWT_SECRET` | `construction-ai-billing/server/routes/voice.js` |

### Browser `localStorage` (HUD)

| Key | Usage |
|-----|-------|
| `constructinv_token` | ConstructInv JWT for voice token mint |
| `soren_muted` | Mute wake stings |
| `soren_volume` | Sting volume 0–1 |

---

## 10. Auth + tenancy

| Mode | Flow | Code |
|------|------|------|
| **DEV** | `POST /token` with `{ persona, productId }` only; no `userVoiceToken` | `token.ts:131-161`, Vite `App.tsx:47` (`productId: 'hud-test'`) |
| **Multi-tenant** | HUD reads ConstructInv JWT from `localStorage` → `POST` mint URL → receives `voiceToken` → passes as `userVoiceToken` in `/token` body → embedded in LiveKit participant metadata → agent reads `meta.userVoiceToken` → `voiceJobContext.run({ userToken })` → ConstructInv API calls use `X-User-Token` | `app.tsx:31-67`, `token.ts:37-38`, `agent-entry.ts:271-288`, `api-client.ts:26-27` |
| **Rate limit** | 10 req/min/IP on `POST /token` | `token.ts:52-77` |
| **ConstructInv mint** | Requires ConstructInv user JWT; returns 1hr `voiceToken` | `voice.js:25-60` |

**Tenancy model:** Multi-tenant capable via per-user voice JWT; default DEV mode is single shared `CONSTRUCTINV_API_KEY` (Vagish's data only). Not true multi-tenant until mint path is used.

---

## 11. Hardcoded values blocking reuse

| String / constant | Location | Blocker |
|-------------------|----------|---------|
| `https://construction-ai-billing-staging.up.railway.app/api/voice/mint-session-token` | `app.tsx:22` default mint URL | Staging ConstructInv |
| `https://construction-ai-billing-staging.up.railway.app` | `api-client.ts:18` default API | Staging ConstructInv |
| `http://localhost:3000` | `next.config.ts:3` default backend | Local dev |
| `productId: 'hud-test'` | `App.tsx:47` | Vite DEV token body |
| `productId: 'varshyl-standalone'` | `app.tsx:94` | Next.js token body |
| `productContext: 'soren'` | `app.tsx:45` | Mint body |
| `claude-sonnet-4-6` | `agent-entry.ts:345` | Model lock-in |
| Soren system prompt (Vagish, Varshyl products, override passphrase) | `persona/src/soren.ts` | Owner-specific |
| Tool prompt (ConstructInv endpoints, fun-pack) | `agent-entry.ts:319-340` | Product-specific |
| ElevenLabs voice IDs | `persona/src/*.ts` | Voice lock-in |
| `FEATURE_FLAGS.SHOW_ARIA: false` | `app-config.ts:70-73` | Soren-only production |
| Google Fonts, CDN importmap URLs | `index.html`, `AriaHUD.tsx` | External deps |
| Embedded base64 persona JPEGs | `AriaHUD.tsx` | Large inline assets |
| `packages/persona` RAG prefix / product names | `soren.ts:21-25` | Varshyl KB coupling |

---

## 12. Extraction assessment

### 12a. Lifts cleanly into framework-agnostic packages

| Module | Suggested package | Notes |
|--------|-------------------|-------|
| `AnthropicLLM` + tool loop | `@varshylinc/soren-core` | Depends on `@livekit/agents` LLM interface — thin adapter |
| `createTTS()` + providers + phrase cache | `soren-core` | Env-injected keys; persona voice IDs via config |
| `Persona` type + prompt templates (sans Vagish copy) | `soren-core` | Parameterize `systemPrompt` |
| `token.ts` rate limit + JWT mint | `soren-core` or hosted API | LiveKit-specific |
| `agent-entry.ts` pipeline wiring | `soren-core` | Orchestration layer |
| `createWakeWordDetector()` | `soren-core` (browser) | Zero deps beyond Web Speech API |
| `useInterrupt()` / stop DataChannel protocol | `soren-react` | React ≥18 peer dep |
| ConnectGate + audio unlock pattern | `soren-react` | Reusable autoplay fix |
| `AriaHUD` visual shell | `soren-react` | Heavy UI; theme via props/CSS vars |

### 12b. Entangled / hard to extract as-is

| Area | Why |
|------|-----|
| ConstructInv skills (`skills/constructinv/*`) | Product-specific tools + API shapes |
| RAG via `@varshyl/rag` + `DATABASE_URL` | Varshyl KB schema coupling |
| Fun-pack / web-search tools | Entertainment + search baked into agent prompt |
| Dual HUD implementations (Vite + incomplete Next.js) | Need single canonical client |
| `wake-trigger` not wired in production HUD | Behavioral bug blocks dormant-mode design |
| Railway two-service deploy | Host concern, not package concern |
| `localStorage` ConstructInv JWT | Host app must provide auth adapter |

### 12c. Recommended package boundaries

```
@varshylinc/soren-core
  - PersonaConfig, WakeWordDetector, AgentPipelineConfig
  - AnthropicLLM adapter, TTS factory, token mint helpers
  - DataChannel message types: wake-trigger, cancel-current-turn
  - No React; CJS + ESM dual publish

@varshylinc/soren-react
  - peerDep: react >= 18
  - <SorenHUD />, useSorenSession(), useInterrupt(), ConnectGate
  - LiveKit room wiring hooks (or accept injected Room)

@varshylinc/soren-hosted (optional)
  - Express + worker entry for products without self-hosting
  - NOT required for toolkit pattern — demo-host style adapter instead
```

### 12d. Mapping to `SorenAdapterConfig` (ConstructInv §9.4)

**UNVERIFIED:** `docs/SOREN_HANDOFF.md` §9.4 `SorenAdapterConfig` was **not found** in:

- `/Users/vagkapi/dev/constructinv` (grep: no matches)
- `varshyl-voice` repo
- `varshyl-toolkit` repo

Inferred mapping from runtime behavior (adjust when spec is located):

| Inferred `SorenAdapterConfig` field | Runtime source today |
|-------------------------------------|----------------------|
| `livekit.url` | `LIVEKIT_URL` env |
| `livekit.tokenEndpoint` | Host mounts `POST /token` or proxy `/api/token` |
| `stt.provider` | `'groq-whisper'` \| `'openai-whisper'` from `GROQ_API_KEY` presence |
| `tts.provider` | `TTS_PROVIDER` + persona voice IDs |
| `llm.provider` | `'anthropic'` |
| `llm.model` | `'claude-sonnet-4-6'` |
| `llm.systemPrompt` | `getPersona(id).systemPrompt` + optional tool overlay |
| `llm.maxTokens` | `512` |
| `persona.id` | `'soren'` \| `'aria'` (room metadata) |
| `wake.mode` | `'browser-speech-recognition'` + `'datachannel-wake-trigger'` |
| `wake.phrases` | `WAKE_PATTERNS` in `wakeWord.ts` |
| `auth.mintVoiceToken` | Optional async fn → `userVoiceToken` for `/token` |
| `auth.devApiKey` | `CONSTRUCTINV_API_KEY` fallback |
| `tools[]` | Skill registry — host injects product tools |
| `rag.query` | Optional `RagClient` — host provides DB + embed key |
| `theme` | HUD accent colors, persona images — today hardcoded in `AriaHUD` |

---

## 13. Extraction priorities (ordered)

1. **Fix `wake-trigger` publish** in canonical HUD `onWake` — without this, dormant-mode spec is broken in production.
2. **Collapse to one HUD** — pick Vite circular HUD or finish Next.js Pass 18; delete duplicate `wake-word.ts` / missing imports.
3. **Extract `soren-core`** — `AnthropicLLM`, TTS factory, token router, agent-entry pipeline behind `SorenPipelineAdapter`.
4. **Parameterize persona prompts** — remove Vagish-specific copy from defaults; host supplies `systemPrompt`.
5. **Extract `soren-react`** — ConnectGate, wake detector hook, interrupt hook, optional HUD shell.
6. **Product tools as plugins** — ConstructInv skills become optional `@varshylinc/soren-tool-constructinv` (or host-injected).
7. **Wire into varshyl-toolkit** — new `packages/soren` following `ServerModuleAdapter` / client barrel patterns from `docs/SHARED_MODULE_ARCHITECTURE.md`.

---

## 14. Open questions (UNVERIFIED)

1. Which HUD build is actually deployed at `varshyl-voice-hud-production.up.railway.app` today — Next.js from `main` tag `v1.0.0-mvp`, or a different commit?
2. Does production behavior match local Next.js tree given missing `session-view` components?
3. Where does `docs/SOREN_HANDOFF.md` §9.4 live — ConstructInv design chat only?
4. Is RAG (`@varshyl/rag`) required for MVP Soren in toolkit, or optional host extension?
5. Groq vs OpenAI Whisper — which is active in production Railway env? (depends on `GROQ_API_KEY` presence)

---

*End of handoff. Source: `VagishKapila/varshyl-voice` inspected 2026-06-11. No secrets included.*
