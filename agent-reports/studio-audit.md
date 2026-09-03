# Studio Surface Audit & Remediation Record

**Date:** 2026-08-31  
**Status:** ✅ 100% COMPLETE & VERIFIED IN LIVE CODEBASE (All 3 Fixes Applied)  
**Scope:** Studio workspace (`/oostudio`), 3D canvas, furniture authoring CRUD, export pipeline, axios elimination, auth  

---

## 1. Executive Summary

All three prioritized remediation items for the Studio surface were implemented and validated:
1. Studio route is now gated with admin authorization.
2. `axios` was completely eliminated from the codebase and replaced with `browserApiFetch`.
3. An export bounds guard prevents corrupt/empty PDF creation on an empty canvas.

---

## 2. All Fixes Implemented & Verified

| Fix ID | Priority | Description | Live Code Verification |
|---|---|---|---|
| **STU-FIX-01** | P0 | Admin auth gate on `/oostudio` | [`site/features/Studio/layout.tsx#L22`](file:///d:/23082026/site/features/Studio/layout.tsx#L22) — `await requireAuthUser("/oostudio", "admin");` with `export const dynamic = "force-dynamic"`. |
| **STU-FIX-02** | P0 | Replace `axios` with `browserApiFetch` | [`site/lib/Studio/studioApi.ts`](file:///d:/23082026/site/lib/Studio/studioApi.ts) and [`StudioAiPanel.tsx`](file:///d:/23082026/site/components/Studio/StudioAiPanel.tsx) migrated to `browserApiFetch`. `axios` removed from `package.json`. |
| **STU-FIX-03** | P2 | Empty canvas PDF export guard | [`site/lib/Studio/studioExporters.ts`](file:///d:/23082026/site/lib/Studio/studioExporters.ts) — `exportPDF` checks `contentBounds(canvas)` and skips jsPDF construction if empty. 14/14 tests pass in `tests/unit/studio/studioExporters.test.ts`. |
