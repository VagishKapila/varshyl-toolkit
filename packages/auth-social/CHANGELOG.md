# @varshylinc/auth-social

## 0.3.0

### Minor Changes

- Made migrations bundler-safe by inlining SQL at build/test/typecheck time and removing runtime filesystem reads.
- Added hardened server utilities for pool creation, timeout handling, typed errors, and a boot-time `asSelfTest` check for migration/table readiness.
- Added bundled-distribution verification tests (including optional Docker-backed runtime validation) and widened test include patterns for `*.spec.ts`.

## 0.2.4

### Patch

- Re-publish to attach npm provenance attestation. No code changes.

## 0.2.3

### Patch Changes

- Also export client-safe constants and types from `./client` subpaths so they can be imported directly into "use client" components without pulling server modules. No breaking changes — root exports are unchanged.

## 0.2.2

### Patch

- Widen React peer dependency to support React 19 (`^18.0.0 || ^19.0.0`). No source changes; components work on both React 18 and 19. Fixes ERESOLVE on Next.js 15 + React 19 consumers.

## 0.2.1

### Patch Changes

- Public release polish: README, npm metadata (keywords/description/repository), and Apache-2.0 license. No code changes.

