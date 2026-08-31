# Admin Surface Remedy Plan

**Date:** 2026-08-31
**Source:** [`admin-audit-report.md`](./admin-audit-report.md)

---

## Priority Fixes

### ADM-FIX-01: Add Auth to Studio Route (P0)

`site/features/Studio/layout.tsx` — add the same gate as admin layout:

```typescript
import { requireAuthUser } from "@/lib/auth/session";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await requireAuthUser("/oostudio", "admin");
  // ... rest unchanged
}
```

**Effort:** 5 minutes. **Risk:** None — same pattern as admin layout.

---

### ADM-FIX-02: CRM Server Persistence or Feature Gate (P1)

**Option A (quick):** Hide CRM behind a feature flag. Add `isCrmServerEnabled` flag, show CRM nav items only when flag is true, show a "Coming soon" page otherwise.

**Option B (proper):** Create Supabase tables for CRM (clients, projects, quotes) on the Admin database. Migrate localStorage demo to real persistence.

**Effort:** Option A: 1-2 hours. Option B: 2-3 days.

---

### ADM-FIX-03: Wire Audit Log to All Admin Mutations (P1)

Use the existing `/api/audit` route and `insertEvent()` function. Add a shared wrapper:

```typescript
async function logAdminAction(actorId: string, action: string, target: string, metadata?: Record<string, unknown>) {
  await insertEvent({
    team_id: "admin",
    actor_id: actorId,
    action,
    target_type: "admin",
    target_id: target,
    metadata: metadata ?? {},
  });
}
```

Wire into: catalog create/edit/delete, feature flag toggles, theme publishes, plan status changes.

**Effort:** 3-4 hours.

---

### ADM-FIX-04: Sample Data Banner in Analytics (P2)

When analytics response includes `source: "sample"`, show:
```tsx
<AdminAlert variant="info">Analytics are showing sample data. Connect the database for real telemetry.</AdminAlert>
```

**Effort:** 30 minutes.

---

### ADM-FIX-05: Explicit DB Error in Production Catalog (P2)

In `catalogAdminHandlers.ts`, when Supabase is unavailable in production:
```typescript
if (getFurnitureCatalogMode() !== "disk" && !supabase) {
  throw new ApiError(503, "DATABASE_UNAVAILABLE", "Catalog database is not configured");
}
```

**Effort:** 30 minutes.

---

## Summary

| Fix | Priority | Effort |
|---|---|---|
| Studio auth gate | P0 | 5 min |
| CRM feature gate or server persistence | P1 | 1-2 hours (gate) or 2-3 days (full) |
| Audit log wiring | P1 | 3-4 hours |
| Analytics sample data banner | P2 | 30 min |
| Production catalog DB error | P2 | 30 min |
