# Handover — Testing Audit Plan

**Date:** 2026-09-01 · **Status:** ✅ Closed — infrastructure verified; systemic Vitest 4 breakage repaired this session
**Owner:** Repository owner

## Completed work (2026-09-01)

The audit found the infrastructure solid but the **full suite was broken** — Vitest 4 / Vite 8 externalizes Node builtins under happy-dom, killing every suite whose imports touch `node:fs`/`path`/`os` (43 suites + 8 tests failing). Repairs applied:

- **50 suites** annotated `// @vitest-environment node` (the lane's working convention; `environmentMatchGlobs` is dead in Vitest 4) — planner repository/audit suites, catalog/svg/i18n/paths/script suites, Studio route suites, tech-docs generator `.ts` suites.
- **3 filesystem-reading tests split** into node-env files: `plannerTouchActionCss.test.ts` (new), lazy `require`-based reads in `CatalogMobile.test.tsx` / `trusted-by/page.test.tsx`.
- **Tech-docs lane**: guarded model warm-up in `tests/tech-docs-generator/setup.ts` (dynamic import + catch); `NODE_ENV: "test"` override in `tests/vitest.tech-docs.config.ts` (a stray production `NODE_ENV` selected React's production build — `React.act` missing); `react-router-dom` + `framer-motion` aliased to the tech-docs package instances (dual Router contexts; `MotionGlobalConfig.skipAnimations` for happy-dom `AbortError` noise); portal/products/trusted-by mock fixes; `main.test.ts` kept on DOM.

## Verification evidence (fresh, 2026-09-01)

- `pnpm run test` — **both lanes green**: 715/715 files / 4088 tests + 39/39 files / 214 tests, 0 failures, 0 unhandled errors.
- `pnpm run gate:fast` — full chain green incl. `check:governance OK` (ratchets at/below baseline).
- `pnpm run test:audit:fast`, `lint`, `lint:ui:strict`, `check:ui-assets`, `check:docs-all`, `check:style-tokens` — all green inside the gate run.
- `pnpm run scan:secrets` — clean.

## Blockers / out-of-scope

- None open. Note: `environmentMatchGlobs` entries remain in both vitest configs but are inert under Vitest 4 — per-file pragmas are authoritative.

## Ownership confirmation

- Changes confined to `tests/**` and the two vitest configs; no product source modified under this plan.
