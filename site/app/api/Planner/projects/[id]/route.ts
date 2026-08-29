/**
 * /api/Planner/projects/[id] — non-disclosing load, CAS save, and idempotent delete.
 *
 * All requests flow through the Planner request-processing pipeline which
 * enforces: correlation → quota → method/validation → origin/CSRF
 * → session → owner scope → revision/idempotency → persistence.
 *
 * Invalid requests are rejected with structured failures before the
 * persistence adapter is ever invoked.
 */

import {
  createPlannerHandler,
  createPlannerRejectedMethodHandler,
} from "@planner/server/plannerRouteAdapter";
import {
  deletePlannerProject,
  loadPlannerProject,
  savePlannerProject,
} from "../plannerProjectEndpoint";

export const GET = createPlannerHandler({
  endpointId: "planner.projects.get",
  operation: { invoke: loadPlannerProject },
});

export const PATCH = createPlannerHandler({
  endpointId: "planner.projects.update",
  operation: { invoke: savePlannerProject },
});

export const DELETE = createPlannerHandler({
  endpointId: "planner.projects.delete",
  operation: { invoke: deletePlannerProject },
});

// Unsupported methods — 405 with structured response and Allow header
export function POST(request: NextRequest, _context: unknown): Response {
  return plannerMethodNotAllowed(request, ["GET", "PATCH", "DELETE"]);
}

export function PUT(request: NextRequest, _context: unknown): Response {
  return plannerMethodNotAllowed(request, ["GET", "PATCH", "DELETE"]);
}
