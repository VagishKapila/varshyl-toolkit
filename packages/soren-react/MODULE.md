# @varshylinc/soren-react

**Status:** IN PROGRESS (0.1.0 — spec-first scaffold, not published)

React components + hooks for the Soren voice layer. Depends on
`@varshylinc/soren-core` for contracts + the pure state machine.

## Public API

| Export | Kind | Notes |
|--------|------|-------|
| `SorenProvider` | component | Accepts `SorenAdapterConfig`; owns LiveKit room lifecycle |
| `useSoren()` | hook | `{ state, settings, config, startListening, stopListening, updateSettings }` |
| `SorenMicButton` | component | Floating mic; visuals driven by `VoiceState`; CSS-var themed |
| `SorenWaveform` | component | Animated level bars during listening/speaking |
| `SorenActionCard` | component | `{ title, options, onSelect }` disambiguation card |
| `SorenSettingsToggle` | component | enable / read-aloud / voice-profile controls via `useSoren()` |
| `cssVar`, `tokens`, `stateColor`, `ensureStyles` | helpers | Theming utilities |

## Peer dependencies

- `react >= 18`
- `livekit-client >= 2`

## Host requirements

- Wrap the app (or voice surface) in `<SorenProvider config={...}>`.
- Provide a token endpoint at `POST {apiBaseUrl}/token` returning
  `{ serverUrl, token }` (`SorenTokenResponse`). **UNVERIFIED** wire shape.
- All colors are overridable via `--soren-*` CSS variables or
  `SorenAdapterConfig.theme`. There are **no hardcoded hex values**; fallbacks
  use `hsl()` literals.

## Theming

| Variable | Purpose |
|----------|---------|
| `--soren-accent` | Idle mic + primary accent |
| `--soren-on-accent` | Foreground on accent |
| `--soren-surface` / `--soren-on-surface` | Cards/panels |
| `--soren-listening` / `--soren-processing` / `--soren-speaking` / `--soren-error` | State colors |
| `--soren-muted` | Borders/disabled |

## Version / tag plan

- Tag scheme: `soren-react@X.Y.Z`.
- `private: true` — not published by `pnpm publish -r`. Publishing is inert
  pending the registry decision (see soren-core MODULE.md).

## Cross-import note

`soren-react` imports `@varshylinc/soren-core`. This is an intentional layered
dependency (contracts → components); `scripts/verify-no-cross-imports.sh`
whitelists `soren-core` as a shared-contracts base layer.

## Testing

`tests/soren-react.spec.ts` is a Vitest + @testing-library/react smoke that
mocks `livekit-client` (no real connection) and asserts idle render +
`idle → listening → processing → idle` transitions. The TOOLKIT_STANDARDS
ephemeral demo-host smoke is N/A here — these are client-only packages with no
demo-host route or database.
