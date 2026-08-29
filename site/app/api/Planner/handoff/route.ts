/**
 * POST /api/Planner/handoff — record BOQ handoff for staff follow-up.
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

async function handleHandoff(
  context: PlannerOperationContext,
): Promise<PlannerOperationResult<unknown>> {
  const body = context.request.body;
  const parsed = plannerHandoffRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_REQUEST",
      metadata: {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.map(String).join(".") || "(root)",
          message: issue.message,
        })),
      },
    };
  }

  const result = await createPlannerHandoff(parsed.data, {
    createdBy: context.session?.ownerId ?? null,
  });
  if (!result.ok) {
    const code =
      result.kind === "not_configured" ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR";
    const status = result.kind === "not_configured" ? 503 : 500;
    return {
      ok: false,
      status,
      code,
      metadata: {},
    };
  }
  return {
    ok: true,
    status: 200,
    data: {
      referenceId: result.referenceId,
      createdAt: result.createdAt,
      idempotentReplay: result.idempotentReplay,
      message: result.message,
    },
  };
}

export const POST = createPlannerHandler({
  endpointId: "planner.handoff.create",
  operation: { invoke: handleHandoff },
});

// Unsupported methods — 405 with structured response and Allow header
export function GET(request: NextRequest, _context: unknown): Response {
  return plannerMethodNotAllowed(request, ["POST"]);
}

export function PUT(request: NextRequest, _context: unknown): Response {
  return plannerMethodNotAllowed(request, ["POST"]);
}

export function DELETE(request: NextRequest, _context: unknown): Response {
  return plannerMethodNotAllowed(request, ["POST"]);
}

export function PATCH(request: NextRequest, _context: unknown): Response {
  return plannerMethodNotAllowed(request, ["POST"]);
}
