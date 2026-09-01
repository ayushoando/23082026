# Remaining — Dead code & orphaned modules
**Date:** 2026-09-01

Re-verified against current code 2026-09-01 — all three findings still reproduce:

- **5.1:** `site/components/pwa/ServiceWorkerRegister.tsx` still exists; repo-wide grep matches only itself + its 2 test files (`tests/unit/components/pwa/ServiceWorkerRegister.test.tsx`, `tests/integration/components/pwa/ServiceWorkerRegister.test.tsx`) — zero app importers; `site/public/sw.js` and `site/public/manifest.json` still absent (double-dead confirmed). Reason not fixed: deletion requires explicit user confirmation (hard rule: NO deletions).
- **5.2:** `site/components/home/Hero.tsx` still exists with zero importers (only `tests/unit/components/home/Hero.test.tsx` and a path reference in `scripts/check-site-ui-contract.mjs`); baseline entry `"site/components/home/Hero.tsx": 4` still at `config/quality/style-token-baseline.json:15`. Reason: deletion requires user confirmation; baseline-entry removal is coupled to the deletion (removing it first would turn 4 unbaselined findings into check failures).
- **5.3:** `site/lib/images/optimizerMode.ts` still unwired — repo-wide matches are only itself, its unit test, and the `// Keep in sync with site/lib/images/optimizerMode.ts (COST-S01)` comment at `config/build/next.config.js:30`. Both remediation paths blocked: deletion needs user confirmation; wiring would mean editing load-bearing `next.config.js` (CJS) to consume a TS module — unverifiable here because builds/typecheck are prohibited this pass.
