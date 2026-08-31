# Studio Remedy Plan

**Date:** 2026-08-31
**Source:** [`studio-audit-report.md`](./studio-audit-report.md)

---

## Priority Fixes

### STU-FIX-01: Add Auth to Studio Layout (P0)

**File:** `site/features/Studio/layout.tsx`

```diff
+ import { requireAuthUser } from "@/lib/auth/session";

- export default function StudioLayout({ children }) {
+ export default async function StudioLayout({ children }) {
+   await requireAuthUser("/oostudio", "admin");
    return (
      <main id="main-content" className="oostudio-root" tabIndex={-1}>
```

**Effort:** 5 minutes. **Must be done before any deployment.**

---

### STU-FIX-02: Replace axios with browserApiFetch (P0)

**File:** `site/lib/Studio/studioApi.ts`

Replace all 5 axios functions with `browserApiFetch`. This fixes:
1. Missing CSRF tokens on mutations (STU-H02)
2. Removes the last axios import (allows `pnpm remove axios`)
3. Aligns with the rest of the codebase's HTTP client pattern

```typescript
import { browserApiFetch, apiPath } from "@/lib/api/browserApi";

export const listFurniture = async (params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `/api/Studio/furniture?${query}` : "/api/Studio/furniture";
  const res = await browserApiFetch(apiPath(url));
  if (!res.ok) throw new Error(`List failed (${res.status})`);
  return res.json();
};

export const createFurniture = async (payload: unknown) => {
  const res = await browserApiFetch(apiPath("/api/Studio/furniture"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Create failed (${res.status})`);
  return res.json();
};

// ... same pattern for updateFurniture, deleteFurniture, uploadFurniture
```

**Effort:** 1-2 hours. Then: `pnpm remove axios`

---

### STU-FIX-03: Empty Canvas Export Guard (P2)

**File:** `site/lib/Studio/studioExporters.ts`

Add check to `exportPDF`:
```typescript
export const exportPDF = (canvas: Canvas, filename = "floor-plan.pdf"): void => {
  const bounds = contentBounds(canvas);
  if (!bounds) return; // Nothing to export — caller should show toast
  // ... rest unchanged
};
```

**Effort:** 15 minutes.

---

## Summary

| Fix | Priority | Effort |
|---|---|---|
| Auth on Studio layout | P0 | 5 min |
| Replace axios → browserApiFetch | P0 | 1-2 hours |
| Empty canvas export guard | P2 | 15 min |
| Studio.tsx decomposition | P3 (future) | Day-scale refactor |
