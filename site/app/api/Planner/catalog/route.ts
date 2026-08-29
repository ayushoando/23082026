/**
 * GET /api/Planner/catalog — read-only furniture catalog for the Planner rail.
 *
 * Requests flow through the Planner request-processing pipeline which
 * enforces: correlation → quota → method/validation → origin/CSRF
 * → session → owner scope → revision/idempotency → persistence.
 */

import { listCatalog } from "@planner/server/plannerStore";
import {
  createPlannerHandler,
  createPlannerRejectedMethodHandler,
} from "@planner/server/plannerRouteAdapter";
import type {
  PlannerOperationContext,
  PlannerOperationResult,
} from "@planner/lib/plannerRequestPipeline";

async function listCatalogItems(
  context: PlannerOperationContext,
): Promise<PlannerOperationResult<unknown>> {
  const category = context.request.query.category;
  const q = context.request.query.q;

  let items = await listCatalog();

  if (category && category !== "all") {
    items = items.filter((i) => i.category === category);
  }
  if (q) {
    const needle = q.toLowerCase().trim();
    items = items.filter((i) => {
      const name = String(i.name || "").toLowerCase();
      const tags = Array.isArray(i.tags) ? i.tags.join(" ").toLowerCase() : "";
      return name.includes(needle) || tags.includes(needle);
    });
  }
  return { ok: true, status: 200, data: items };
}

export const GET = createPlannerHandler({
  endpointId: "planner.catalog.list",
  operation: { invoke: listCatalogItems },
});

// Unsupported methods still enter the quota-first request pipeline.
export const POST = createPlannerRejectedMethodHandler(
  "planner.catalog.list",
);
export const PUT = createPlannerRejectedMethodHandler(
  "planner.catalog.list",
);
export const DELETE = createPlannerRejectedMethodHandler(
  "planner.catalog.list",
);
export const PATCH = createPlannerRejectedMethodHandler(
  "planner.catalog.list",
);
