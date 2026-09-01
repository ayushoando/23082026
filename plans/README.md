# Plans

This directory holds active planning coordination. Durable architecture facts belong in `docs/`; current behavior belongs in live code.

| Location | Role |
|---|---|
| Plan folders (`plans/<name>/`) | Canonical requirements, design, tasks, and plan-owned evidence for active work. |
| [`seosec/`](./seosec/) | SEO & security audit — 15 security findings, indexing crisis analysis, 4-wave remedy plan. |
| [`ui-audit/`](./ui-audit/) | UI audit — 33 findings across 34 routes (5 resolved), phased remedy plan (Phases 0–5). |
| [`packages/`](./packages/) | Package & dependency audit — dead packages removed, CVE overrides, replacement analysis. |
| [`ai-audit/`](./ai-audit/) | AI implementation audit — Mastra agents, RAG pipeline, vector store, 3-wave remedy plan. |
| [`admin-audit/`](./admin-audit/) | Admin surface audit — 17 pages, 16 API endpoints, auth, data flow. Studio auth gap found. |
| [`studio-audit/`](./studio-audit/) | Studio audit — canvas, furniture CRUD, publishing, exports. **No auth** (fixed). |
| [`planner-audit/`](./planner-audit/) | Planner audit — 4 routes, 10 API endpoints, canvas, projects, offline, AI. Best-architected surface. |
| [`db-audit/`](./db-audit/) | Database & migrations audit — 64 migrations, 2 DBs, RLS verified. Clean. |
| [`testing-audit/`](./testing-audit/) | Testing audit — Vitest + Playwright, gate system, audit scripts. Solid infrastructure. |
| [`worker-audit/`](./worker-audit/) | Cloudflare Worker audit — R2, caching, robots, HSTS. Needs Vectorize binding for AI fix. |
| [`CONTEXT.md`](./CONTEXT.md) | Optional lazy domain glossary; create only when domain modeling requires it. |
| [`adr/`](./adr/) | Optional architecture decision records. |

**Truth order:** user → live code + fresh commands → `AGENTS.md` → `Agents/` → `docs/` → `plans/`.

**Issues / triage:** local Markdown under `plans/` (see `AGENTS.md` §Issue tracker). Hard blockers → [`Failures.md`](../Failures.md).

**Evidence placement:** plan-specific, handwritten audit evidence stays beside its owning plan. Generated evidence belongs in `results/**`; do not hand-write audit reports there.
