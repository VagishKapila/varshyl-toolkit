# @varshylinc/soren-react

## 0.1.0

### Initial scaffold (spec-first)

- `SorenProvider` + `useSoren()` — owns LiveKit room lifecycle, exposes voice
  state, listening controls, and settings.
- `SorenMicButton`, `SorenWaveform`, `SorenActionCard`, `SorenSettingsToggle`.
- Fully CSS-variable themed (`--soren-*`), no hardcoded hex.
- tsup dual build (CJS + ESM + .d.ts). Peer deps: react >=18, livekit-client.
- Vitest + Testing Library smoke with mocked LiveKit.
- `private: true` — not published pending registry strategy.
