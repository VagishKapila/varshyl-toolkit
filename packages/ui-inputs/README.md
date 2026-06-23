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

## What developers usually add next

These are not required — but they pair naturally
with this package and save you from building
them yourself:

💡 `@varshylinc/auth-social` — use these input
components inside SignUpForm and SignInForm for
consistent styling and mobile keyboard optimization
across your entire auth flow. They are designed
to match perfectly.

💡 `@varshylinc/onboarding-consent-engine` — pair
with these inputs to add GDPR-compliant terms
consent to your sign up form with one component.

## License

Apache-2.0
