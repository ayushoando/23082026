# Studio Remedy Plan

**Date:** 2026-08-31 · **Updated:** 2026-08-31 (all 3 fixes applied)
**Source:** [`studio-audit-report.md`](./studio-audit-report.md)

---

## Priority Fixes — ALL APPLIED ✅

### STU-FIX-01: Add Auth to Studio Layout (P0) — ✅ Done

**File:** `site/features/Studio/layout.tsx`

Applied exactly as planned: `await requireAuthUser("/oostudio", "admin")` added, plus `export const dynamic = "force-dynamic"` (required since the auth check reads cookies, which Next.js otherwise tries to statically render).

---

### STU-FIX-02: Replace axios with browserApiFetch (P0) — ✅ Done

**File:** `site/lib/Studio/studioApi.ts` + `site/components/Studio/StudioAiPanel.tsx`

All axios usage replaced with `browserApiFetch`-backed helpers (`jsonFetch()` in `studioApi.ts`, `aiPost()` in `StudioAiPanel.tsx`). `pnpm remove axios` completed — package fully removed from `package.json`. Also fixed a type gap surfaced during the change: `AiGenerateResult` now declares all AI response fields (`name`, `category`, `tags`, `dimensions`) as **required**, not optional — the AI is expected to always return complete metadata, so `Studio.tsx`'s consumers no longer need defensive `?.` chaining on those fields.

---

### STU-FIX-03: Empty Canvas Export Guard (P2) — ✅ Done

**File:** `site/lib/Studio/studioExporters.ts`

`exportPDF` now returns `boolean` (was `void`) — `false` when `contentBounds(canvas)` is `null` (no exportable objects), skipping the jsPDF construction entirely; `true` on a real save. Callers should check the return value and show a "Nothing to export" toast on `false` — no current caller exists yet (`exportPDF` isn't wired into the Studio UI; only the Planner has an active PDF export button today), so this is forward-looking protection for when it is wired up.

Added test coverage in `tests/unit/studio/studioExporters.test.ts` (mocked `jspdf` via `vi.hoisted`): confirms `jsPDF` is never constructed on an empty canvas, and confirms normal save behavior when content exists. 14/14 tests pass.

---

## Verification

- `pnpm run typecheck` — clean after each fix
- `pnpm exec vitest run tests/unit/studio/studioExporters.test.ts` — 14/14 pass
- `pnpm run scan:boundaries` — clean (run earlier this session after the layout change)

## Summary

| Fix | Priority | Status |
|---|---|---|
| Auth on Studio layout | P0 | ✅ Applied |
| Replace axios → browserApiFetch | P0 | ✅ Applied |
| Empty canvas export guard | P2 | ✅ Applied |
| Studio.tsx decomposition | P3 (future) | Not started — day-scale refactor, out of scope for this pass |
