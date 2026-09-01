# Repository Audit — Index

- **Date:** 2026-09-01
- **Scope:** full repository, read-only (no code modified)
- **Method:** 4 parallel explore agents (architecture/structure, security/API, frontend quality, code quality/ops), all findings verified against disk. No gates/tests/browser runs (owner-gated per repo rules).
- **Location:** `plans/audit/` — one subfolder per report: `NN-slug/findings.md` (the report) + `NN-slug/plan.md` (the matching remediation plan). Existing plans/ folders moved here intact (ai-audit, seosec, db-audit, …). Related: [../FIX-LOG-20260901.md](../FIX-LOG-20260901.md)

| # | Report | Area |
|---|--------|------|
| 01 | [Executive summary](01-executive-summary/findings.md) | Overall verdict + severity rollup |
| 02 | [Architecture & routes](02-architecture-routes/findings.md) | Route inventory, layout consistency |
| 03 | [Module boundaries / fork](03-module-boundaries-fork/findings.md) | Studio↔Planner fork discipline |
| 04 | [Repo layout & git hygiene](04-repo-layout-git-hygiene/findings.md) | check:layout conformance, untracked load-bearing files, TODOs |
| 05 | [Dead code](05-dead-code/findings.md) | Orphaned modules |
| 06 | [State & dataflow](06-state-dataflow/findings.md) | zustand/react-query/server actions |
| 07 | [Security: auth](07-security-auth/findings.md) | devAuthBypass, sessions, roles, proxy.ts |
| 08 | [Security: API routes](08-security-api-routes/findings.md) | 59 API routes: auth/CSRF/rate-limit coverage |
| 09 | [Security: secrets & env](09-security-secrets-env/findings.md) | Secrets scan, env contract, CI wiring gap |
| 10 | [Security: CSRF & rate limits](10-security-csrf-ratelimit/findings.md) | Double-submit CSRF, fail-open rate limits |
| 11 | [Persistence & SQL](11-persistence-sql/findings.md) | Mode-aware writes, EROFS guard, injection surface |
| 12 | [Workers & edge](12-workers-edge/findings.md) | CF worker proxy: R2, cache policy, hardcoded origin |
| 13 | [SEO](13-seo/findings.md) | Per-page metadata, sitemap/robots, canonicals |
| 14 | [CSS / FOCCSS](14-css-focss/findings.md) | 800-line cap, verifier, token ratchet debt |
| 15 | [i18n](15-i18n/findings.md) | en/hi parity, workspace-string drift |
| 16 | [Accessibility](16-accessibility/findings.md) | axe bar, focus traps, tap targets |
| 17 | [Components & performance](17-components-performance/findings.md) | God component, fork drift, bundle weight |
| 18 | [TypeScript & tests](18-typescript-tests/findings.md) | Zero `any` debt, vitest lanes, skip manifests |
| 19 | [Dependencies & build](19-dependencies-build/findings.md) | TS7/Next16/React19 frontier, config fragility |
| 20 | [Scripts & governance](20-scripts-governance/findings.md) | Script sprawl, governance ratchets, prioritized actions |
| 21 | [Plans folder](21-plans-folder/findings.md) | plans/ deep audit: 16 folders, README drift, claim-vs-reality, handover coverage |
| 22 | [Packages & workspace](22-packages-workspace/findings.md) | Workspace membership, tech-docs-generator, 100-script wiring, lockfile health, dead deps |
| 23 | [Config, docs & specs](23-config-docs-specs/findings.md) | config/, docs/ drift, specs/ orphan, root markdown, tests inventory, results/ |
| 24 | [Platform & database](24-platform-database/findings.md) | Two-DB discipline, migrations, type sync, server layer, seed flow |
| 25 | [Coverage gaps](25-coverage-gaps/findings.md) | What this static audit cannot see + what is needed to close the gaps |
| 26 | [CI, scripts orphans & edge function](26-ci-scripts-edge-function/findings.md) | .github workflows, dependabot, ~18 orphan scripts, assistant-chat function |
| 27 | [lib deep: AI/Mastra, SVG pipeline, observability](27-lib-ai-svg-observability/findings.md) | Advisor agents/RAG, descriptor persist/load contract, metrics endpoint |
| 28 | [Canvas hooks & features logic](28-canvas-features-logic/findings.md) | Undo/redo deadlock, Ctrl+S duplicate, service-role project writes, DXF exports |
| 29 | [Tests, CSS usage & content](29-tests-css-content/findings.md) | Test quality, visual baselines (0/216), e2e hygiene, marketing content |

## Severity rollup

| Severity | Count | Highlights |
|----------|-------|------------|
| High | 7 | Untracked-but-imported wave3/wave5 files (repo doesn't build from clean clone); `Planner.tsx` 3,387 lines; systemic Planner/Studio fork duplication with live drift; SVG descriptor `latest.json` writer mismatch (27.5 — Studio-published descriptors unloadable); undo/redo suppress deadlock (28.1); Ctrl+S creates duplicate project (28.2); service-role project write/delete without ownership check (28.12); zero visual baselines on disk vs 216 expected (29 §4) |
| Medium | ~25 | Unwired SVG sanitizer on upload path; `scan:secrets` not in CI gate; legacy `site/data/storage/` (43 stale files); hardcoded worker origin; redirect destination overrides; production-unoptimized images; no route-level error boundaries outside (site); single-bundle marketing CSS; gsap/jspdf/fabric static imports; hi/en content drift; governance ratchets P4:8 + S2:22; Orama index rebuilt per request (27.1); unbounded descriptor parsing (27.6/27.7); metrics endpoint open without token (27.9); assistant-chat thread ownership + OpenAI timeout (26.5/26.7); Dependabot missing github-actions (26.1); Studio history/shortcut regressions (28.3/28.4); feature-flags cache-only writes (28.13); PG 23505→500 (28.14); no reconnect sync (28.15); 110 e2e `waitForTimeout` (29.1) |
| Low | ~40 | Dev-bypass on non-prod hosts, env contract gaps, fail-open rate limits, focss near-cap files, axe coverage gaps, dead code items, orphan scripts, DXF fidelity gaps, Deno dep drift, etc. |

**Second pass (reports 21–24) corrections to first-pass findings:** `P4_migration_no_rollback: 8` is a stale baseline (0/64 migrations lack `-- rollback` today); the `pending-translations/` dir is empty; `scan-boundaries` finds no violations (unchanged); new High-adjacent item: `db:types` depends on an undeclared global `supabase` CLI; new Medium items: dead `turbo.json`, `admin/themes` reads an archived table, stale hand-written `platform/supabase/types.ts`, `routes.md` false "no redirect table" claim.

**Backlog:** [remaining-areas/README.md](../remaining-areas/README.md) — audit areas not yet covered (list only, none started).
