# Remaining — TypeScript quality & tests
**Date:** 2026-09-02

- **18.3 (Low):** `maxWorkers: 4` Windows + lucide-react CJS band-aid still baked into `tests/vitest.config.ts` (comment block now directly above the `maxWorkers` line after the 18.2 cleanup) — open. Removing it requires a full two-lane suite run on Windows to prove the "Cannot find module" race is gone; full-suite runs are authorized-run items this session. Band-aid stays.
- 18.1 / 18.4: informational (zero suppression debt in production code; 6 vitest configs exist) — no action required; the skip-allowlist renewal planning (plan item 3) also remains open ahead of `expires: 2027-09-01`.
- Oxlint `tests/` warnings (18 warnings, 6 files — surfaced by the 2026-09-02 `run-oxlint` sweep): **resolved 2026-09-02** — see findings-resolved.md (`oxlint tests` now prints 0 warnings / 0 errors). Nothing remains for that sweep.
- 18.2: resolved 2026-09-02 — see findings-resolved.md.
