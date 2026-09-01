# 06 — State Management & Data Flow

## zustand — 7 stores, 5 locations, all organized

| Store | Location | Notes |
|---|---|---|
| `plannerCatalogStore` / `plannerUiStore` | `store/Planner/` | fork pair |
| `studioCatalogStore` / `studioUiStore` | `store/Studio/` | fork pair — near-identical to Planner, both export `useCatalogStore` |
| `quoteCart` | `lib/store/quoteCart.ts` | persist middleware, marketing surface |
| `productCompare` | `lib/store/productCompare.ts` | persist middleware |
| `crmStore` | `features/crm/stores/crmStore.ts` | persist, admin CRM |

All ≤92 lines each. No store lives outside a product or feature namespace.

## react-query — over-provisioned

Provider `app/(site)/providers/QueryProvider.tsx` mounted in `(site)/layout.tsx:4,38` wraps the entire marketing tree for **exactly one consumer**: `features/site/catalog/FilterGridInner.tsx`. Candidate: drop react-query or extend usage. Severity: low.

## Server actions — coherent split

4 files with `"use server"`: `lib/auth/supabaseServerActions.ts`, `features/site/contact/submitContactAction.ts`, `features/admin/feature-flags/updateFeatureFlagsAction.ts`, `features/admin/catalog/catalogItemActions.ts`. Typed-action layer via `lib/safe-action.ts` (next-safe-action) + `features/admin/api/adminActionGuards.ts`. API mutations otherwise go through REST route handlers. All admin actions enforce `requireAdminAction()` + rate limit.

## Server-side stores (fork, documented as intentional)

`server/Planner/plannerStore.ts` (disk/Supabase adapters, `plannerRouteAdapter.ts`, `sketchToPlan.server.ts`) vs `server/Studio/studioStore.ts` (seed, publish, PNG render). Both implement mode-aware persistence separately **by design**, per in-file comments and AGENTS.md §5.

Admin URL-state uses `nuqs` (`NuqsAdapter` in `app/admin/layout.tsx:3,32`); no state library in the admin shell itself.
