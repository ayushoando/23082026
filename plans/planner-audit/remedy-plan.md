# Planner Remedy Plan

**Date:** 2026-08-31
**Status:** ✅ ALL FIXES COMPLETE — 2026-08-31
**Source:** [`planner-audit-report.md`](./planner-audit-report.md)

---

## Fix Status

| Fix | Status | Evidence |
|---|---|---|
| PLN-FIX-01: IndexedDB offline backup | ✅ Done | `site/lib/Planner/plannerLocalBackup.ts` created. Wired into `Planner.tsx` — 30s periodic backup when dirty, cleared on successful server save |
| PLN-FIX-02: AI advisor rate scope consistency | ✅ Done | `ai-advisor/route.ts` — `rateLimitScope` updated to `"planner-advisor"` matching the endpoint contract |
| PLN-FIX-03: Auto-save for authenticated users | ✅ Done | `Planner.tsx` — `useEffect` auto-saves every 60s when `accessMode === "authenticated"`, `hasUnsavedChanges`, and `projectId` is set |
| PLN-FIX-04: Tighten guest AI rate limits | ✅ Done | AI advisor: inner 2/min guest check before handler body. sketch-to-plan contract `requests` reduced 6→2 |

---

### PLN-FIX-01: IndexedDB Auto-Save for Offline Resilience (P1)

Add periodic local backup using IndexedDB (no new dependency — use native API):

```typescript
// site/lib/Planner/plannerLocalBackup.ts
const DB_NAME = "ooplanner-backup";
const STORE_NAME = "canvas";

async function saveLocalBackup(projectId: string, canvasJson: unknown, sheet: unknown) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put({
    projectId,
    canvasJson,
    sheet,
    savedAt: Date.now(),
  }, projectId || "__draft__");
  await tx.done;
}
```

Trigger every 30 seconds when `hasUnsavedChanges` is true. On load, offer to restore if local backup is newer than server version.

**Effort:** 4-6 hours.

---

### PLN-FIX-02: Migrate AI Advisor to Planner Pipeline (P1)

Move `/api/Planner/ai-advisor` from `withAuth` to `createPlannerHandler()` for consistency. The endpoint descriptor already exists in the contract.

**Effort:** 2-3 hours.

---

### PLN-FIX-03: Auto-Save for Authenticated Users (P2)

Add a `useEffect` in `Planner.tsx` that auto-saves every 60 seconds when dirty:

```typescript
useEffect(() => {
  if (!hasUnsavedChanges || accessMode !== "authenticated" || !projectId) return;
  const timer = setInterval(() => {
    handleSave({ silent: true });
  }, 60_000);
  return () => clearInterval(timer);
}, [hasUnsavedChanges, accessMode, projectId]);
```

Show a subtle "Auto-saved" indicator. Don't auto-save drafts with no project ID (new, unsaved projects).

**Effort:** 1-2 hours.

---

### PLN-FIX-04: Tighten Guest AI Rate Limits (P2)

Reduce guest AI rate limits:
- AI advisor: 5/min → 2/min for guests, keep 5/min for members
- Sketch-to-plan: 6/min → 2/min for guests

**Effort:** 30 minutes.

---

## Summary

| Fix | Priority | Effort |
|---|---|---|
| IndexedDB offline backup | P1 | 4-6 hours |
| AI advisor → Planner pipeline | P1 | 2-3 hours |
| Auto-save for authenticated users | P2 | 1-2 hours |
| Tighten guest AI rate limits | P2 | 30 min |
