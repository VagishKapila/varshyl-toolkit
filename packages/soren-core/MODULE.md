# @varshylinc/soren-core

**Status:** IN PROGRESS (0.1.0 — spec-first scaffold, not published)

Framework-agnostic contracts + pure logic for the Soren voice layer. No React,
no DOM, no server/DB. This is the shared-contracts base layer consumed by
`@varshylinc/soren-react` and by host products.

## Public API

| Export | Kind | Signature |
|--------|------|-----------|
| `VoiceState` | type | `'idle' \| 'connecting' \| 'listening' \| 'processing' \| 'speaking' \| 'error'` |
| `SorenToolDefinition` | interface | `{ name, description, inputSchema, endpoint, method, authHeaderName }` |
| `SorenAdapterConfig` | interface | `{ productId, apiBaseUrl, getAuthToken, tools, theme? }` |
| `SorenVoiceSettings` | interface | `{ enabled, voiceOnDefault, readAloud, voiceProfile }` |
| `SorenTokenResponse` | interface | `{ serverUrl, token }` — **UNVERIFIED** wire shape |
| `DEFAULT_VOICE_SETTINGS` | const | `SorenVoiceSettings` |
| `VoiceEvent` | type | discriminated union (CONNECT, CONNECTED, START_LISTENING, …) |
| `voiceReducer` | fn | `(state: VoiceState, event: VoiceEvent) => VoiceState` (pure) |
| `INITIAL_VOICE_STATE` | const | `'idle'` |
| `SorenPersona` | interface | `{ name, defaultVoiceProfile, systemPrompt }` |
| `buildPersonaPrompt` | fn | `(overrides?: PersonaPromptOverrides) => string` |
| `sorenPersona` (default) | const | product-neutral Soren `SorenPersona` |

## Owned tables

None. This package has no database footprint.

## Host requirements

- Node 18+ or any modern bundler. No peer dependencies.
- The host supplies a `SorenAdapterConfig` and a token endpoint that returns a
  `SorenTokenResponse` (`POST {apiBaseUrl}/token`).

## Adapter contract

Hosts implement nothing server-side here; they provide config + a token mint
endpoint. Tool execution is delegated to the hosted `varshyl-voice-engine`
(see `docs/SOREN_RUNTIME_HANDOFF.md`).

## Version / tag plan

- Tag scheme: `soren-core@X.Y.Z`.
- Publishing is **inert** until the registry strategy is finalized (see below).
- `private: true` — not published by `pnpm publish -r`.

## UNVERIFIED / blockers

- The `SorenAdapterConfig` "§9.4" spec was never located (handoff §12d). The
  shape here is authoritative going forward; revisit if the upstream spec surfaces.
- `SorenTokenResponse` shape is inferred from runtime behavior, not a documented contract.
- Persona default is a clean reconstruction — the original `soren.ts` is not in
  this repo and embeds owner-specific copy + a passphrase that must not be committed.
- Registry: intended `https://npm.pkg.github.com`, but `@varshylinc` is mapped to
  npmjs in `.npmrc` and the repo is owned by a user (not a `varshylinc` GH org),
  so GH Packages publish is not yet viable. Package stays `private: true` for now.
