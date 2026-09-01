# Plans

This directory holds active planning coordination. Durable architecture facts belong in `docs/`; current behavior belongs in live code.

| Location | Role |
|---|---|
| Plan folders (`plans/<name>/`) | Canonical requirements, design, tasks, and plan-owned evidence for active work. |
| [`seosec/`](./seosec/) | SEO & security audit — 15 security findings, indexing crisis analysis, 4-wave remedy plan. SEC-R07/R08/R09 + sitemap-health audit fixed 2026-09-01; SEC-R08 owner-RLS migration pending authorized dry-first apply. |
| [`ui-audit/`](./ui-audit/) | UI audit — 33 findings across 34 routes (5 resolved), phased remedy plan (Phases 0–5). Closed; `/clients` showcase deletion reversed 2026-09-02 — re-implemented (see `client-showcase-tabs/`). |
| [`client-showcase-tabs/`](./client-showcase-tabs/) | Client showcase tabs (`/clients`) — implemented 2026-09-02 against the current canonical registry; two deviations documented. |
| [`site-ui-content-links-audit/`](./site-ui-content-links-audit/) | Site UI/content/links audit program — waves 0–5 tooling, closed with reconciliation (property lane 11 files / 36 tests). |
| [`packages/`](./packages/) | Package & dependency audit — dead packages removed, CVE overrides, replacement analysis. |
| [`ai-audit/`](./ai-audit/) | AI implementation audit — Mastra agents, RAG pipeline, vector store, 3-wave remedy plan. |
| [`admin-audit/`](./admin-audit/) | Admin surface audit — 17 pages, 16 API endpoints, auth, data flow. Studio auth gap found. |
| [`studio-audit/`](./studio-audit/) | Studio audit — canvas, furniture CRUD, publishing, exports. **No auth** (fixed). |
| [`planner-audit/`](./planner-audit/) | Planner audit — 4 routes, 10 API endpoints, canvas, projects, offline, AI. Best-architected surface. |
| [`planner-comprehensive-audit/`](./planner-comprehensive-audit/) | Planner comprehensive audit — 16 workstream modules, closed 2026-09-01 with reconciliation. |
| [`db-audit/`](./db-audit/) | Database & migrations audit — 64 migrations, 2 DBs, RLS verified. Clean. |
| [`testing-audit/`](./testing-audit/) | Testing audit — Vitest + Playwright, gate system, audit scripts. Solid infrastructure. |
| [`worker-audit/`](./worker-audit/) | Cloudflare Worker audit — R2, caching, robots, HSTS. Needs Vectorize binding for AI fix. |
| [`CONTEXT.md`](./CONTEXT.md) | Optional lazy domain glossary; create only when domain modeling requires it. |
| [`adr/`](./adr/) | Optional architecture decision records. |

**Truth order:** user → live code + fresh commands → `AGENTS.md` → `Agents/` → `docs/` → `plans/`.

**Issues / triage:** local Markdown under `plans/` (see `AGENTS.md` §Issue tracker). Hard blockers → [`Failures.md`](../Failures.md).

**Evidence placement:** plan-specific, handwritten audit evidence stays beside its owning plan. Generated evidence belongs in `results/**`; do not hand-write audit reports there.
