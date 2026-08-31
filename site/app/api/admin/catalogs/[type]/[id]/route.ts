/**
 * PATCH/DELETE /api/admin/catalogs/[type]/[id]
 *
 * Canonical, parameterized catalog-admin item route.
 *
 * Path params:
 *   - `type`: `standard` | `configurator`
 *   - `id`:   catalog item id
 *
 * Behavior:
 *   - standard: PATCH = full update; DELETE = hard delete
 *   - configurator: PATCH = full update or `{ active }` toggle;
 *     DELETE = soft archive (active=false)
 *
 * Auth: `admin` role required (enforced by `withAuth`).
 */

import type { NextRequest } from "next/server";
import { withAuth } from "@/features/shared/api/withAuth";
import {
  deleteConfiguratorCatalog,
  deleteStandardCatalog,
  patchConfiguratorCatalog,
  patchStandardCatalog,
  resolveCatalogType,
} from "@/features/admin/api/catalogAdminHandlers";
import { logAdminAction } from "@/lib/audit/logAdminAction";

type RouteContext = {
  params: Promise<{ type: string; id: string }>;
};

/**
 * Update a catalog item of the given type by id. Admin only.
 */
export const PATCH = withAuth<RouteContext>(
  async (req, auth, context) => {
    const { type: rawType, id } = await context.params;
    const type = resolveCatalogType(rawType);
    const result = type === "standard"
      ? await patchStandardCatalog(req as NextRequest, id)
      : await patchConfiguratorCatalog(req as NextRequest, id);
    void logAdminAction(auth.user?.id ?? "admin", "catalog:update", id, { catalogType: type });
    return result;
  },
  { role: "admin", rateLimitScope: "admin-catalogs:patch", rateLimit: 40, requireCsrf: true },
);

/**
 * Delete (or soft-archive) a catalog item of the given type by id. Admin only.
 */
export const DELETE = withAuth<RouteContext>(
  async (_req, auth, context) => {
    const { type: rawType, id } = await context.params;
    const type = resolveCatalogType(rawType);
    const result = type === "standard"
      ? await deleteStandardCatalog(id)
      : await deleteConfiguratorCatalog(id);
    void logAdminAction(auth.user?.id ?? "admin", "catalog:delete", id, { catalogType: type });
    return result;
  },
  { role: "admin", rateLimitScope: "admin-catalogs:delete", rateLimit: 15, requireCsrf: true },
);
