# 25 — Coverage Gaps: What This Audit Cannot See & What Is Needed

The audit is **static source analysis only** (file reads + grep + disk walks). These dimensions remain unobserved, with what each needs:

## 1. Runtime / command evidence (needs your exact authorization per repo rules)

| Gap | What it needs | Command |
|---|---|---|
| Whether wave3/wave5 files are truly untracked (git index state) | git read access | `git status --short` (High #1 in report 01 is "conditional" on this) |
| Whether gates actually pass today | gate authorization | `pnpm run gate:fast` (dev loop) or `pnpm run gate` (ship bar) |
| Whether the 4,097+222 passing tests still pass after any change | test authorization | `pnpm run test` (both lanes) |
| Live DB state (RLS, tables, the archived `block_themes`, missing `rate_limits`) | DB authorization | `pnpm run db:test`, `pnpm run db:apply -- --dry` |
| Secrets in the actual environment (vs. source) | scan authorization | `pnpm run scan:secrets`, `pnpm run check:launch` |
| Coverage reality vs. configuration | coverage authorization | `pnpm run test:coverage`, `test:coverage:site`, `test:coverage:admin` |

## 2. Network / registry evidence (needs internet + your go-ahead)

| Gap | What it needs |
|---|---|
| Known CVEs in the 1,023 resolved packages | `pnpm audit` (queries the registry advisory DB) — none of the CVE posture is verified, only the override entries in `pnpm-workspace.yaml` (sharp, esbuild) |
| Outdated-package report | `pnpm outdated` across root + tech-docs |
| Supabase/Cloudflare/Vercel platform state (vectorize index existence, env vars in prod, project links) | `wrangler vectorize list`, `vercel env ls` — owner-gated, credentials in `.env.local` |

## 3. Browser / rendered evidence (needs dev server + Playwright run)

| Gap | What it needs |
|---|---|
| Real a11y violations beyond the 4 axe-scanned surfaces | dev server on `http://localhost:3000` + `pnpm run test:a11y` (or extend the spec's scan targets to PDP/catalog/contact) |
| Real bundle sizes (the gsap/jspdf/fabric static-import findings are import-graph based, not measured KB) | `pnpm run build:site` + reading `.next` build output / bundle analyzer |
| LCP/CLS/Core Web Vitals with production-unoptimized images | built output + Lighthouse (the repo has `dev-tools/lighthouse` route for this) |
| Visual regressions | `pnpm run audit:visual` |

## 4. Historical evidence (needs git commands)

| Gap | What it needs |
|---|---|
| Orphan status of the 105 root `scripts/` one-offs (which are dead vs. one-off-but-recent) | `git log --follow` per file — freshness dates distinguish "abandoned" from "run once in the last crisis" |
| Whether specs/ is abandoned or recently used | git history of `specs/state.yaml` |
| True age of the plans/ contradictions | commit dates for ui-audit handover vs FIX-LOG #9 |

## 5. Dimensions inherently out of scope for any static audit

- **Correctness of canvas/algorithm logic** (fabric serialization, snap math, DXF export, polygon-clipping fallback) — verified only by their test suites running, not by reading.
- **Data quality** in the live Supabase projects (furniture_catalog contents, plans, price books).
- **Security posture under attack** (rate-limit effectiveness on real multi-instance prod, CSP bypass attempts) — the fail-open rate-limit and SVG findings are structural, not exploited-path proofs.
- **UX/perf feel** — covered structurally (bundle weight, hydration), not experientially.

## Minimal authorization set to close the most valuable gaps, in order

1. `git status --short` — resolves the #1 High finding (untracked load-bearing files).
2. `pnpm run scan:secrets` — closes the CI-gate gap with live evidence.
3. `pnpm run gate:fast` — proves the whole gate stack green right now.
4. `pnpm audit` — CVE posture for 1,023 packages.
5. `pnpm run build:site` — real bundle numbers for the performance findings.
6. `pnpm run db:test` + `--dry` migrations — live two-DB state including the archived-table findings.
