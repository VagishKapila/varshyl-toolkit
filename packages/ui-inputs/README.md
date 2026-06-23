# @varshylinc/ui-inputs

Standard React input wrappers for Varshyl products. Each component bakes in correct mobile keyboard behavior so teams never reach for raw `<input>` / `<textarea>`.

**Zero runtime dependencies** — only `react` as a peer.

## Install

```bash
pnpm add @varshylinc/ui-inputs react
```

## Usage

```tsx
import {
  VarshylTextInput,
  VarshylEmailInput,
  VarshylAddressInput,
  VarshylSearchInput,
  VarshylPasswordInput,
} from '@varshylinc/ui-inputs/react';

<VarshylEmailInput
  className="w-full rounded border px-3 py-2"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="you@company.com"
/>
```

All native props pass through (`className`, `value`, `onChange`, `placeholder`, `disabled`, `name`, `id`, etc.). Explicit props override the baked-in defaults.

## Components

| Component | Element | Defaults |
|-----------|---------|----------|
| `VarshylTextInput` | `<textarea>` | `autocorrect=on`, `spellcheck`, `autocapitalize=sentences` |
| `VarshylEmailInput` | `<input type="email">` | `autocorrect=off`, `autocapitalize=none`, `autocomplete=email`, `spellcheck=false` |
| `VarshylAddressInput` | `<input type="text">` | `autocorrect=off`, `autocapitalize=words`, `autocomplete=street-address` |
| `VarshylSearchInput` | `<input type="search">` | `autocorrect=off`, `autocapitalize=none`, `spellcheck=false` |
| `VarshylPasswordInput` | `<input type="password">` | `autocorrect=off`, `autocapitalize=none`, `autocomplete=current-password` |

## Rule

Every new Varshyl product uses these components — not raw inputs.

## License

Apache-2.0
