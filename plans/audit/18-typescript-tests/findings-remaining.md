# Remaining — TypeScript quality & tests
**Date:** 2026-09-01

- 18.2 (Med, minor): deprecated `environmentMatchGlobs` (held together by `@ts-expect-error` in 3 configs) still needs migration to the Vitest 4 successor API — open.
- 18.3 (Low): `maxWorkers: 4` Windows + lucide-react CJS band-aid still baked into `tests/vitest.config.ts:67-69` — open.
- 18.1 / 18.4: informational (zero suppression debt in production code; 6 vitest configs exist) — no action required; the skip-allowlist renewal planning (plan item 3) also remains open ahead of `expires: 2027-09-01`.
