# Handover — Planner Surface Audit Plan

**Date:** 2026-09-01 · **Status:** ✅ Closed — all 4 fixes applied; advisor route rebuilt this session
**Owner:** Repository owner

## Completed tasks

- **PLN-FIX-01** — IndexedDB offline backup: `site/lib/Planner/plannerLocalBackup.ts` (new: `saveLocalBackup`, `loadLocalBackup`, `clearLocalBackup`); `Planner.tsx` backs up every 30 s when dirty, clears on successful server save.
- **PLN-FIX-02** — AI advisor rate-limit scope corrected to `"planner-advisor"` matching the endpoint contract.
- **PLN-FIX-03** — 60-second auto-save effect for authenticated + dirty + `projectId` states.
- **PLN-FIX-04** — Guest AI rate limits tightened (advisor inner 2/min guest check; sketch-to-plan 6→2).
- **2026-09-01 addition (under ai-audit tasks 6.1–6.3):** `/api/Planner/ai-advisor` rebuilt — NDJSON streaming transport, deterministic degraded fallback, `withAiObservability` wiring, raw-Response passthrough in the request pipeline.

## Files modified

`site/lib/Planner/plannerLocalBackup.ts` (new) · `site/components/Planner/Planner.tsx` · `site/app/api/Planner/ai-advisor/route.ts` · `site/lib/Planner/plannerEndpointContract.ts` · `site/lib/Planner/plannerRequestPipeline.ts` · `site/features/shared/api/schemas.ts` · tests under `tests/unit/app/api/Planner/ai-advisor/`.

## Verification evidence

- Planner suites — `tests/unit/planner` + `tests/unit/lib/Planner` + `tests/unit/server/Planner` + `tests/integration/planner`: **634/634 pass** after test-environment repairs (2026-09-01).
- Planner advisor wiring/validation property tests — **30/30 pass** including streaming cases.
- Live-DB smoke tests pass (`projectsStore.supabase.db.smoke`, `plannerSupabaseMutation.db.smoke`, RLS policy test) — real Supabase, observed in the full-suite run.
- `pnpm run db:test` — Products (143 catalog products) and Admin (`oando_plans` reachable) verified 2026-09-01.

## Blockers / out-of-scope

- Cloudflare Vectorize index creation pending **CF-TOKEN-01** (root `Failures.md`) — affects vector retrieval availability only; planner advisor degrades deterministically without it.
- `Planner.tsx` size and revision/idempotency pipeline no-op remain documented tech debt from the comprehensive audit (tracked under `../planner-comprehensive-audit/`).

## Ownership confirmation

- Only Planner fork paths, the shared pipeline passthrough, and their tests touched; no Studio imports.
