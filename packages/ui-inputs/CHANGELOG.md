# @varshylinc/ui-inputs

## 0.1.1
### Patch Changes
- VarshylPasswordInput: add mode prop
  ('signin' | 'signup') — controls autocomplete
  between current-password and new-password
- Default mode is 'signin' — no breaking change

## 0.1.0

### Added

- `VERSION` constant on main barrel
- `VarshylTextInput` — textarea for notes/descriptions
- `VarshylEmailInput`, `VarshylAddressInput`, `VarshylSearchInput`, `VarshylPasswordInput`
- `./react` subpath export (CJS + ESM + types via tsup)
