# Repository Audit — Index

- **Date:** 2026-09-01
- **Scope:** full repository, read-only (no code modified)
- **Method:** 4 parallel explore agents (architecture/structure, security/API, frontend quality, code quality/ops), all findings verified against disk. No gates/tests/browser runs (owner-gated per repo rules).
- **Location:** `agents-work/audit/` (per user directive; hand-written audit reports, not a generated pipeline output)

| # | Report | Area |
|---|--------|------|
| 01 | [executive-summary.md](01-executive-summary.md) | Overall verdict + severity rollup |
| 02 | [architecture-routes.md](02-architecture-routes.md) | Route inventory, layout consistency |
| 03 | [module-boundaries-fork.md](03-module-boundaries-fork.md) | Studio↔Planner fork discipline |
| 04 | [repo-layout-git-hygiene.md](04-repo-layout-git-hygiene.md) | check:layout conformance, untracked load-bearing files, TODOs |
| 05 | [dead-code.md](05-dead-code.md) | Orphaned modules |
| 06 | [state-dataflow.md](06-state-dataflow.md) | zustand/react-query/server actions |
| 07 | [security-auth.md](07-security-auth.md) | devAuthBypass, sessions, roles, proxy.ts |
| 08 | [security-api-routes.md](08-security-api-routes.md) | 59 API routes: auth/CSRF/rate-limit coverage |
| 09 | [security-secrets-env.md](09-security-secrets-env.md) | Secrets scan, env contract, CI wiring gap |
| 10 | [security-csrf-ratelimit.md](10-security-csrf-ratelimit.md) | Double-submit CSRF, fail-open rate limits |
| 11 | [persistence-sql.md](11-persistence-sql.md) | Mode-aware writes, EROFS guard, injection surface |
| 12 | [workers-edge.md](12-workers-edge.md) | CF worker proxy: R2, cache policy, hardcoded origin |
| 13 | [seo.md](13-seo.md) | Per-page metadata, sitemap/robots, canonicals |
| 14 | [css-focss.md](14-css-focss.md) | 800-line cap, verifier, token ratchet debt |
| 15 | [i18n.md](15-i18n.md) | en/hi parity, workspace-string drift |
| 16 | [accessibility.md](16-accessibility.md) | axe bar, focus traps, tap targets |
| 17 | [components-performance.md](17-components-performance.md) | God component, fork drift, bundle weight |
| 18 | [typescript-tests.md](18-typescript-tests.md) | Zero `any` debt, vitest lanes, skip manifests |
| 19 | [dependencies-build.md](19-dependencies-build.md) | TS7/Next16/React19 frontier, config fragility |
| 20 | [scripts-governance-recommendations.md](20-scripts-governance-recommendations.md) | Script sprawl, governance ratchets, prioritized actions |

## Severity rollup

| Severity | Count | Highlights |
|----------|-------|------------|
| High | 3 | Untracked-but-imported wave3/wave5 files (repo doesn't build from clean clone); `Planner.tsx` 3,387 lines; systemic Planner/Studio fork duplication with live drift |
| Medium | ~14 | Unwired SVG sanitizer on upload path; `scan:secrets` not in CI gate; legacy `site/data/storage/` (43 stale files); hardcoded worker origin; redirect destination overrides; production-unoptimized images; no route-level error boundaries outside (site); single-bundle marketing CSS; gsap/jspdf/fabric static imports; hi/en content drift; governance ratchets P4:8 + S2:22 |
| Low | ~25 | Dev-bypass on non-prod hosts, env contract gaps, fail-open rate limits, focss near-cap files, axe coverage gaps, dead code items, etc. |
