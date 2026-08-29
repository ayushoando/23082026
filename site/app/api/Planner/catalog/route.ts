/**
 * GET /api/Planner/catalog — read-only furniture catalog for the Planner rail.
 *
 * Requests flow through the Planner request-processing pipeline which
 * enforces: correlation → quota → method/validation → origin/CSRF
 * → session → owner scope → revision/idempotency → persistence.
 */

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

// Unsupported methods — 405 with structured response and Allow header
export function POST(request: NextRequest, _context: unknown): Response {
  return plannerMethodNotAllowed(request, ["GET"]);
}

export function PUT(request: NextRequest, _context: unknown): Response {
  return plannerMethodNotAllowed(request, ["GET"]);
}

export function DELETE(request: NextRequest, _context: unknown): Response {
  return plannerMethodNotAllowed(request, ["GET"]);
}

export function PATCH(request: NextRequest, _context: unknown): Response {
  return plannerMethodNotAllowed(request, ["GET"]);
}
