# 23 — Config, Docs, Specs, Root Markdown, Tests, Results

## config/ — fresh, fully wired, zero dead files

- `config/build/` (9 files): `next.config.js` (445 lines, ~90 redirects) required by `site/next.config.js:13`; `playwright.config.ts` (9 projects = 3 browsers × 3 viewports, derived from `tests/manifests/visual-baselines.json`); gate spec packs; tsconfigs; postcss; vitest reporter. Every file has a live consumer.
- `config/observability/`: Prometheus 3.5.0 + Grafana 12.0.0 compose — current, consumed by `observability:up/down/logs`.
- `config/quality/`: two ratchet baselines (`governance-baseline.json`, `style-token-baseline.json` total: 207) — current by design (down-only ratchets).
- Minor drift: `docs/architecture/layout.md:16` describes `config/` as build/ + quality/ only — omits `observability/`.

## docs/ — mostly fresh, real drift hot-spots

17 files (15 md + 2 CSV). Verified positives: `stack.md` version claims match `generated-documents/data/summary.json` exactly; two-DB model consistent across 4 docs; governance docs mutually consistent.

| # | Severity | Finding |
|---|----------|---------|
| 23.1 | Med | **`routes.md` §Redirects is factually wrong:** claims "site/next.config.ts is a minimal stub — no redirect table on disk". There is **no `site/next.config.ts` at all** (only `.js`, 54 lines) and the full ~90-entry redirect table lives in `config/build/next.config.js`. `sitemap.md` §8 documents the same redirects correctly — docs contradict each other. |
| 23.2 | Med | **Count drift:** `routes.md` lists 35 (site) pages (live: 37 — missing 2 `/tools/*` calculators) and 55 API routes (live: 59 — missing ai-advisor, metrics, files/catalog, admin/indexnow). |
| 23.3 | Low | `layout.md:22-24` lists 5 ghost dirs (`agent-reports/`, `mcp/`, `supabase/`, `.archive/`, `.qoder/`) — none exist; omits `agents-work/`, `specs/`, `generated-documents/`. |
| 23.4 | Low | `sitemap.md:5` references the moved `agents-work/client-hub/...` flow (now `plans/client-hub/...`); `stack.md:22-23` references nonexistent `site/next.config.ts`. |
| 23.5 | Low | File-count claims undercount: `docs/README.md` + `DOC-MAP.md` say 14 files; live 17. |

## specs/ — legacy orphan

`state.yaml` + 8 workflow YAMLs (`build-fix, check-stack, code-review, e2e, plan, security, ship, tdd`) — a Kiro-era slash-command recipe library (sibling `.kiro/` was deleted). **Zero consumers, zero doc references** (checked package.json, scripts/, .github/, Agents/, docs/, root md). Undocumented in DOC-MAP/CONTENTS/layout/AGENTS. Only root directory with no owner. Candidate: index it or retire it (user-confirmed deletion only).

## Root markdown — purposes non-overlapping; 1 genuine stale claim

| File | Status |
|---|---|
| `README.md`, `START.md`, `Testing-handbook.md`, `Failures.md` (CF-TOKEN-01, 2026-09-01), `HANDOVER.md` (historical, correctly labeled), `owners.md` | Fresh, links resolve |
| `OPERATIONS_RUNBOOK.md:8` | **"The `mcp/` tree contains tool definitions" — dead claim**, folder does not exist. The one genuine stale live-status claim. |
| `DOC-MAP.md` | Lists `.archive/` as a layer (folder gone); omits `HANDOVER.md`; "docs/ (14 files)" undercount |
| `CONTENTS.md` | Links resolve; does not index `specs/`, `generated-documents/`, `agents-work/` |
| `AGENTS.md` §3 | Layout table omits `specs/`, `generated-documents/`, `agents-work/` |

## i18n/ root — clean 2-line shim

`i18n/request.ts` re-exports `../site/i18n/request` (next-intl resolves the plugin path against repo root cwd). Single source of truth; `pending-translations/` is **empty** (report 15's "backlog in-tree" is overstated — the folder exists but is empty). Parity gated by `check:i18n:parity`.

## generated-documents/ — current, disposable (correct by design)

Gitignored; wipe-and-regenerate contract. Freshness verified: `routes: 61` exactly matches disk; `_accuracy.json`: **1066/1066 factual fields matched, 0 mismatches**; manifest `removed: []`.

## tests/ — sound; inventory 2 specs stale

- Structure: unit/ (15 mirrored subdirs), integration, e2e (85 flat specs: Planner ~29, Open3D ~20, admin/audit ~12, site ~13, Studio 1, misc), 5 vitest configs + shared, 4 manifests.
- Browser gate pack (8 specs) and Open3D pack (5 specs) all present on disk.
- **Drift:** `tests/INVENTORY.md` + `results/test-inventory.json` say **83** Playwright specs; disk has **85** (the two `clients-showcase-*` specs are newer than the last inventory regen).
- `CONTENTS.md` prescribes canonical `e2e/site/app/<route-root>/…` layout — not yet realized (self-declared migration debt).

## results/ — rule respected

**0 hand-written markdown files** under `results/**` — the "generated evidence only" rule is fully respected. All contents generated 2026-09-01 (`summary.json`: default lane 4097/4097 passed, tech-docs 222/222). Oddity: `vercel-prod-deploy.log` is 0 bytes. The hand-written audit reports in `agents-work/audit/` sit outside `results/`, so compliant — but `agents-work/` itself is undocumented in every layout index.
