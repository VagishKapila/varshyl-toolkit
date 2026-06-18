# @varshylinc/soren-core

## 0.1.0

### Initial scaffold (spec-first)

- `VoiceState`, `SorenToolDefinition`, `SorenAdapterConfig`, `SorenVoiceSettings`,
  `SorenTokenResponse` contracts.
- Pure `voiceReducer` state machine with `VoiceEvent` union.
- `buildPersonaPrompt(overrides?)` + product-neutral `sorenPersona` default.
- tsup dual build (CJS + ESM + .d.ts). No peer dependencies.
- `private: true` — not published pending registry strategy.
