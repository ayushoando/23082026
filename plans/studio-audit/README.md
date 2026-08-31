# Studio (Product Studio) Audit

**Created:** 2026-08-31
**Status:** Audit complete, remedy plan ready
**Owner:** Repository owner

## Documents

| Document | Purpose |
|---|---|
| [`studio-audit-report.md`](./studio-audit-report.md) | Full audit: canvas, tools, exports, AI, CRUD, publishing, auth, stores |
| [`remedy-plan.md`](./remedy-plan.md) | Prioritized fix plan |

## Key Findings

### Critical
- **No auth on /oostudio** — Layout has no `requireAuthUser` call. Anyone can access the full furniture authoring tool. All 6 API routes DO have auth, but the UI itself is open.

### High
- **axios CRUD skips CSRF** — `studioApi.ts` uses bare axios without CSRF tokens. Mutations may fail in production. Replace with `browserApiFetch`.
- **Only axios user in codebase** — removing it eliminates a ~30KB dependency

### Strengths
- Clean fork isolation (`@studio/` alias, zero Planner imports)
- Mode-aware persistence (disk dev / Supabase prod)
- Full publish pipeline with metadata validation + PNG quality gate + checksum
- Rich export (PNG, JPEG, SVG, PDF, DXF, JSON) with tight-crop and viewport-safe export
- Good zustand store separation (UI state vs catalog state)
