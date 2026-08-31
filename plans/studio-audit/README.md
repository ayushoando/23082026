# Studio (Product Studio) Audit

**Created:** 2026-08-31 · **Remediated:** 2026-08-31 (all 3 fixes applied same session)
**Status:** ✅ Complete — audit + remedy plan fully executed
**Owner:** Repository owner

## Documents

| Document | Purpose |
|---|---|
| [`studio-audit-report.md`](./studio-audit-report.md) | Full audit: canvas, tools, exports, AI, CRUD, publishing, auth, stores |
| [`remedy-plan.md`](./remedy-plan.md) | Prioritized fix plan — all 3 items done |

## Key Findings — All Fixed

### Critical — ✅ Fixed
- **No auth on /oostudio** — Layout had no `requireAuthUser` call. Fixed: added `requireAuthUser("/oostudio", "admin")` + `dynamic = "force-dynamic"`.

### High — ✅ Fixed
- **axios CRUD skipped CSRF** — `studioApi.ts` used bare axios without CSRF tokens. Fixed: replaced with `browserApiFetch` everywhere (`studioApi.ts` + `StudioAiPanel.tsx`), then `pnpm remove axios` — last usage in the codebase.

### Medium — ✅ Fixed (1 of 3)
- **Empty canvas PDF export** — `exportPDF` didn't check `contentBounds()`. Fixed: now returns `boolean`, skips jsPDF entirely on empty canvas. 14/14 tests pass including 2 new cases.
- Remaining 2 medium findings (Studio.tsx size, intentional Planner/Studio store duplication) are documented tech debt, not urgent.

### Strengths
- Clean fork isolation (`@studio/` alias, zero Planner imports)
- Mode-aware persistence (disk dev / Supabase prod)
- Full publish pipeline with metadata validation + PNG quality gate + checksum
- Rich export (PNG, JPEG, SVG, PDF, DXF, JSON) with tight-crop and viewport-safe export
- Good zustand store separation (UI state vs catalog state)

## Verification
- `pnpm run typecheck` — clean
- `pnpm exec vitest run tests/unit/studio/studioExporters.test.ts` — 14/14 pass
- `pnpm run scan:boundaries` — clean
