# 11 — Persistence & SQL Injection Surface

## Mode-aware persistence (verified end to end)

- Wrappers confirmed: `writeFurnitureItem`, `loadFurnitureItem`, `deleteFurnitureItem`, `persistFurnitureAssets`, `persistFurnitureUpload` — all branch on `getFurnitureCatalogMode() === "disk"` vs Supabase (`site/server/Studio/studioStore.ts:200-282`); planner equivalents in `site/server/Planner/plannerStore.ts`, `plannerProjectDiskAdapter.ts`.
- Grep for raw `fs.writeFile(Sync)` in `site/` returned 11 call sites — **every one is behind `assertDevDiskWritable()`** (12 hits across `studioStore.ts:89,94`, `plannerStore.ts:90,98`, `plannerProjectDiskAdapter.ts:140,165`, `exportsStore.ts:77`, `descriptorPointer.ts:91`, `persistBlockDescriptor.ts:55`, `catalogLifecycle.ts:58`, `priceBookFileStore.ts:66`).
- `site/lib/persistence/assertDevDiskWritable.ts`: throws synthetic `EROFS` unless `isDevAuthBypassEnabled()` — disk writes impossible outside local dev mode.
- `POST /api/exports` refuses outright outside dev (503, `exports/route.ts:47-54`); `files/*` GET routes 404 when mode isn't disk (`diskFileAccess.ts:8-16`).

## SQL injection surface (clean)

- **Drizzle ORM + postgres-js** is the only raw-PG entry point (`site/platform/drizzle/createPostgresDrizzle.ts`); `sql` templates appear only in static check constraints (`platform/drizzle/schema/planner.ts:33-58`, `schema/catalog.ts:177-217`) — no user-input interpolation.
- Grep for interpolation-into-SQL patterns found **no string-built queries** in app code (only hit: an error message string).
- All other DB access goes through supabase-js query builder (`.from().select().eq()` — parameterized), e.g. `customer-queries/manage/route.ts:102-114`, `rateLimit.ts` backend, `auditRepository`.
- RLS migrations aggressively revoke anon/authenticated access and document service-role-only tables (`platform/supabase/migrations.admin/20260801120000_document_service_role_only_tables.sql`).

## Findings

| # | Severity | Finding |
|---|----------|---------|
| 11.1 | Info (positive) | **No unguarded raw-fs writes found** — production EROFS risk not present. |
| 11.2 | Info (positive) | **No string-interpolated SQL found** — fully parameterized query construction. |
| 11.3 | Med (cross-ref) | Legacy `site/data/storage/` still populated (43 stale files) — see report 04. Enforced nowhere by `check:layout`. |
