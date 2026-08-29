/**
 * /api/Planner/projects — owner-scoped list and revision-safe create.
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
  createPlannerProject,
  listPlannerProjects,
} from "./plannerProjectEndpoint";

export const GET = createPlannerHandler({
  endpointId: "planner.projects.list",
  operation: { invoke: listPlannerProjects },
});

export const POST = createPlannerHandler({
  endpointId: "planner.projects.create",
  operation: { invoke: createPlannerProject },
});

// Unsupported methods still enter the quota-first request pipeline.
export const PUT = createPlannerRejectedMethodHandler(
  "planner.projects.list",
);
export const DELETE = createPlannerRejectedMethodHandler(
  "planner.projects.list",
);
export const PATCH = createPlannerRejectedMethodHandler(
  "planner.projects.list",
);
