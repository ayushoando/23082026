/**
 * POST /api/Planner/sketch-to-plan — convert a sketch image into editable plan geometry.
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

async function handleSketchToPlan(
  context: PlannerOperationContext,
): Promise<PlannerOperationResult<unknown>> {
  if (!isFeatureEnabled("sketchToPlan")) {
    return {
      ok: false,
      status: 403,
      code: "INVALID_REQUEST",
      metadata: {
        issues: [
          {
            path: "(feature)",
            message: "Sketch-to-plan is disabled by feature flag",
          },
        ],
      },
    };
  }

  const rawBody = context.request.body;
  const parsed = SketchToPlanRequestSchema.safeParse(rawBody);
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

  try {
    const result = await requestSketchToPlan(parsed.data);
    return {
      ok: true,
      status: 200,
      data: {
        status: "preview",
        fileName: parsed.data.fileName,
        objects: result.objects,
        warnings: result.warnings,
      },
    };
  } catch (err) {
    const sketchError = classifySketchConversionError(
      err,
      parsed.data.fileName,
    );
    if (sketchError.reason !== "server_error") {
      return {
        ok: true,
        status: 200,
        data: {
          status: "fallback",
          fileName: parsed.data.fileName,
          reason: sketchError.reason,
          message: getSketchRecoveryMessage(sketchError.reason),
        },
      };
    }
    return {
      ok: false,
      status: 503,
      code: "SERVICE_UNAVAILABLE",
      metadata: {},
    };
  }
}

export const POST = createPlannerHandler({
  endpointId: "planner.sketch-to-plan.convert",
  operation: { invoke: handleSketchToPlan },
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
