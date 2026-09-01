# Plan — Program Remediation (Executive Summary)

**Status:** not started (awaiting owner go-ahead). **Source:** [findings.md](./findings.md)

## Objective
Close the audit's ten prioritized structural and wiring gaps without disturbing the repo's existing self-governance and security layering.

## Actions (prioritized)
1. **High** Commit the untracked load-bearing wave files — `scripts/site-ui-content-links-audit/wave3-partitions.ts`, `scripts/site-ui-content-links-audit/wave5-reconcile.ts` (fresh clones/CI currently fail on module resolution).
2. **Med** Wire the SVG sanitizer into the upload path — call `sanitizeSvg` from `site/app/api/Studio/furniture/upload/route.ts` and/or serve SVG as `Content-Disposition: attachment` from `site/app/api/files/furniture/[filename]/route.ts` (`site/lib/security/svgSanitizer.ts` has zero production call sites).
3. **Med** Add `scan:secrets` to `release:gate:fast` in `.github/workflows/release-gate.yml`.
4. **Med** Retire legacy `site/data/storage/` (43 stale files) and the stale duplicate `site/data/seed-furniture.json` — user-confirmed deletion required; forbid the path in `scripts/general/check-repo-layout.mjs`; update stale docs `tech-docs-generator/src/pages/CodeOrganization.tsx`, `tech-docs-generator/src/pages/Overview.tsx`.
5. **Med** De-hardcode the worker origin and move seating SKU/material tables out of worker code — `workers/oando-worker-proxy/wrangler.toml:12`, `workers/oando-worker-proxy/src/index.js:188` (and `src/index.js:76-95,127-137`).
6. **High/Med** Split `Planner.tsx` (3,387 lines) and reconcile fork drift — `PlannerToast.tsx` vs `StudioToast.tsx` (aria-live, role=alert, dismiss), `PlannerIconButton.tsx` vs `StudioIconButton.tsx` (aria-pressed coercion, icon size).
7. **Med** Add route-level `error.tsx` under `site/app/admin/`, `site/app/ooplanner/`, `site/app/oostudio/` (crashes currently fall to root `global-error.tsx` with no chrome recovery).
8. **Med** Revisit production-unoptimized images in `config/build/next.config.js:31-37`; document/collapse the redirect destination overrides in `site/next.config.js:15-45`.
9. **Med** Reduce bundle weight — lazy-load gsap (static in ~28 route views), jspdf + fabric (static in workspace first load); only 2 `next/dynamic` usages app-wide.
10. **Med** Governance debt: add `-- rollback` markers to clear `P4_migration_no_rollback: 8`; triage the 22 `S2_stray_report` files in `plans/`.

## Verification
- `pnpm run typecheck`, `pnpm run test`, `pnpm run gate:fast`, `pnpm run scan:secrets` — gate runs require owner authorization.
