# Executive Summary

**Overall verdict:** an unusually well-governed repository. The repo audits itself (test audits, hollow-test audit, skip manifests, governance ratchets, API-route safety audit, FOCSS verifier, style-token ratchet — all gate-wired). Auth is layered (edge proxy → handler → layout), persistence is mode-aware with zero unguarded raw-fs writes, SQL is fully parameterized, and the SEO layer is production-grade and test-enforced. The weaknesses are structural debt, not hygiene: fork duplication, one god component, bundle weight, and a handful of gaps where existing safeguards are unwired.

## Top 10 actions (prioritized)

1. **HIGH — Commit the two untracked load-bearing files** `scripts/site-ui-content-links-audit/wave3-partitions.ts` and `wave5-reconcile.ts`. They are imported by `index.ts`, `cli.ts`, `wave5-handoffs.ts`, `wave5-completion-proof.ts` and covered by tests — a clean clone currently cannot build that framework.
2. **MED — Wire the SVG sanitizer.** `site/lib/security/svgSanitizer.ts` has zero production call sites while `POST /api/Studio/furniture/upload` stores raw uploaded SVG served back as `image/svg+xml` (member-gated stored-XSS vector).
3. **MED — Add `scan:secrets` to `release:gate:fast`** — the secret scanner is currently only a local pre-launch check, not CI-enforced.
4. **MED — Retire legacy `site/data/storage/`** (43 stale files; AGENTS.md says it is legacy) and extend `check-repo-layout.mjs` to forbid it so it cannot regrow. Also update stale tech-docs pages describing it as live (`tech-docs-generator/src/pages/CodeOrganization.tsx`, `Overview.tsx`).
5. **MED — De-hardcode the worker origin** (`workers/oando-worker-proxy/wrangler.toml:12` + `src/index.js:188` → `oando1408.vercel.app`) and move seating SKU/material slug tables out of worker code.
6. **HIGH/MED — Split `Planner.tsx` (3,387 lines)** and reconcile fork drift: `StudioToast` lacks PlannerToast's a11y upgrades (aria-live, role=alert, dismiss); `IconButton` pairs differ in `aria-pressed` coercion and icon size.
7. **MED — Add route-level `error.tsx`** under `app/admin/`, `app/ooplanner/`, `app/oostudio/` — crashes there currently fall to root `global-error.tsx` with no chrome recovery.
8. **MED — Revisit production-unoptimized images** (`config/build/next.config.js:31-37`) and document/collapse the redirect destination overrides in `site/next.config.js:15-45`.
9. **MED — Reduce bundle weight:** gsap statically imported in ~28 route views; jspdf + fabric statically bundled into workspace first load; only 2 `next/dynamic` usages app-wide.
10. **MED — Governance debt:** retire `P4_migration_no_rollback: 8` (add `-- rollback` markers); triage `S2_stray_report: 22` in `plans/`.

## What is notably strong

- **Self-auditing culture:** `run-test-audits.mjs` (release/fast presets) runs api-route-safety, hollow-tests, gate-skips, eslint-disable audits inside the release gate.
- **Security layering:** edge proxy CSP-with-nonce + security headers, `withAuth` (auth+CSRF+rate-limit), admin layout role gates, `app_metadata`-only roles, maintenance mode fails closed.
- **Persistence correctness:** every raw `fs.writeFile` call site is behind `assertDevDiskWritable()` (synthetic EROFS outside dev); production disk writes impossible.
- **SEO contract:** test-enforced standards audit, hardened canonical sanitization, PDP hard-404, zero-orphan navigation.
- **Accessibility bar:** axe WCAG-2AA + keyboard-only journey + reduced-motion in CI; React Aria dialogs; 44px token; type-enforced `aria-label`.
- **TypeScript hygiene:** zero real `: any` / `as any` / `@ts-ignore` in production code.
- **Tests:** 765 vitest files + 85 Playwright specs; skip exceptions are manifest-managed with owners and expiry dates.
