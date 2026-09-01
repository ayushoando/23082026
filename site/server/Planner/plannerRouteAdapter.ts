/**
 * plannerRouteAdapter — bridge between Next.js App Router route handlers and
 * the Planner request-processing pipeline.
 *
 * Provides real dependency implementations (rate-limit, CSRF, session, origin)
 * and exposes a typed factory for route handlers that enforces the designed
 * processing order:
 *
 *   correlation → quota → method/path/query/header/body validation
 *   → origin + CSRF → verified session → owner scope
 *   → revision/idempotency → persistence → safe response
 *
 * Invalid requests are rejected with structured failures before the operation
 * port (persistence adapter) is ever invoked.
 */

import type { NextRequest } from "next/server";

import type {
  PlannerEndpointDescriptor,
  PlannerEndpointId,
} from "@planner/lib/plannerEndpointContract";
import { PLANNER_ENDPOINT_DESCRIPTORS } from "@planner/lib/plannerEndpointContract";
import {
  processPlannerRequest,
  verifySameOrigin,
  type PlannerEndpointOperationPort,
  type PlannerPipelineRequest,
  type PlannerRequestPipelineDependencies,
} from "@planner/lib/plannerRequestPipeline";
import {
  observePlannerApiResponseAtCallSite,
} from "@/lib/Planner/observability/plannerObservability.server";
import {
  plannerApiFailure,
  resolvePlannerCorrelationId,
} from "@planner/lib/plannerApiResponse";
import { rateLimit } from "@/lib/rateLimit";
import { normalizeClientIp } from "@/lib/clientIp";
import {
  detectClientOwnerIdentifiers,
} from "@planner/lib/plannerOwnerScope";
import {
  isDevAuthBypassActiveForRequest,
  DEV_BYPASS_USER,
} from "@/lib/auth/devAuthBypass";
import { createAuthServerClient } from "@/platform/supabase/server";
import { isAppAdmin } from "@/lib/auth/roles";

// ---------------------------------------------------------------------------
// Dependency implementations
// ---------------------------------------------------------------------------

function getClientIp(request: Request): string {
  const raw =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1";
  return normalizeClientIp(raw);
}

/** Request host for the 7.1 dev-bypass allowed-host guard (fails closed when absent). */
function requestHostOf(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")
  );
}

const defaultDependencies: PlannerRequestPipelineDependencies = {
  async checkQuota({ request, descriptor }) {
    const ip = getClientIp(request);
    const result = await rateLimit(
      `${descriptor.rateLimit.scope}:${ip}`,
      descriptor.rateLimit.requests,
      descriptor.rateLimit.windowMs,
    );
    return { allowed: result.success, resetAt: result.reset };
  },

  verifyOrigin(request: Request) {
    // 7.1: dev bypass (and its origin-check skip) only for allowed hosts.
    if (isDevAuthBypassActiveForRequest(requestHostOf(request))) return true;
    return verifySameOrigin(request);
  },

  async verifyCsrf(request: Request) {
    if (isDevAuthBypassActiveForRequest(requestHostOf(request))) return true;
    const { validateCsrfRequest } = await import("@/lib/security/csrf");
    return validateCsrfRequest(request);
  },

  async verifySession(request: Request) {
    if (isDevAuthBypassActiveForRequest(requestHostOf(request))) {
      return { ownerId: DEV_BYPASS_USER.id, isAdmin: true };
    }
    try {
      const supabase = await createAuthServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user?.id) return null;
      return {
        ownerId: data.user.id,
        isAdmin: isAppAdmin(data.user),
      };
    } catch {
      return null;
    }
  },

  authorizeOwnerScope({ descriptor, session, request }) {
    // Owner scope authorization uses the server-derived session only.
    // If the descriptor requires owner scope and no session, the session
    // check earlier already rejected; this is a guard for admin-item policies.
    if (
      descriptor.security.owner === "public-catalog" ||
      descriptor.security.owner === "not-applicable"
    ) {
      return true;
    }

    // Req 10.7: Reject requests that supply client owner identifiers.
    // Owner scope is always derived from the verified server session.
    // Detecting client-supplied owner fields in the body and rejecting them
    // prevents any confusion about identity source.
    if (request) {
      const clientOwnerKeys = detectClientOwnerIdentifiers(request.body);
      if (clientOwnerKeys.length > 0) {
        return false;
      }
    }

    return session !== null;
  },

  validateRevisionAndIdempotency() {
    // Task 4.2 wires basic validation; full revision/idempotency enforcement
    // is completed by workstream 2 (Tasks 2.8–2.9) and integrated at Gate C.
    return [];
  },
};

// ---------------------------------------------------------------------------
// Descriptor lookup
// ---------------------------------------------------------------------------

const descriptorById = new Map<string, PlannerEndpointDescriptor>();
for (const d of PLANNER_ENDPOINT_DESCRIPTORS) {
  descriptorById.set(d.id, d as PlannerEndpointDescriptor);
}

export function lookupPlannerDescriptor(
  id: PlannerEndpointId,
): PlannerEndpointDescriptor {
  const descriptor = descriptorById.get(id);
  if (!descriptor) {
    throw new Error(`Unknown Planner endpoint descriptor: ${id}`);
  }
  return descriptor;
}

// ---------------------------------------------------------------------------
// Route handler factory
// ---------------------------------------------------------------------------

export interface PlannerRouteHandlerOptions<T> {
  /** Endpoint descriptor id from the Gate B contract. */
  readonly endpointId: PlannerEndpointId;
  /** The operation to invoke after all security checks pass. */
  readonly operation: PlannerEndpointOperationPort<T>;
  /** Override dependency implementations (useful for testing). */
  readonly dependencies?: Partial<PlannerRequestPipelineDependencies>;
}

/**
 * Create a Next.js App Router route handler that enforces the designed
 * request-processing order before invoking the operation port.
 *
 * For routes with dynamic segments (e.g. `[id]`), the context.params
 * promise is awaited and merged into the pipeline request.
 *
 * The returned function signature is compatible with Next.js 16 route handler
 * type checks: `(request: NextRequest, context: RouteContext) => Promise<Response>`.
 */
export function createPlannerHandler<T>(
  options: PlannerRouteHandlerOptions<T>,
): (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response> {
  const descriptor = lookupPlannerDescriptor(options.endpointId);
  const deps: PlannerRequestPipelineDependencies = {
    ...defaultDependencies,
    ...options.dependencies,
  };

  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ): Promise<Response> => {
    const pathParams = context?.params ? await context.params : undefined;
    const pipelineRequest: PlannerPipelineRequest = {
      request,
      pathParams,
    };

    const startedAtMs = Date.now();
    const response = await processPlannerRequest({
      descriptor,
      pipelineRequest,
      dependencies: deps,
      operation: options.operation,
    });
    return observePlannerApiResponseAtCallSite({
      operation: options.endpointId,
      method: descriptor.method,
      startedAtMs,
      authorizationProtected: descriptor.security.auth === "member",
      response,
    });
  };
}

/**
 * Route an unsupported method through the same quota-first pipeline. The
 * descriptor method intentionally differs from the incoming request method,
 * so the operation port is unreachable and the pipeline returns its safe 405.
 */
export function createPlannerRejectedMethodHandler(
  endpointId: PlannerEndpointId,
): ReturnType<typeof createPlannerHandler<never>> {
  return createPlannerHandler({
    endpointId,
    operation: {
      invoke: async () => {
        throw new Error("Rejected Planner method reached an unreachable operation");
      },
    },
  });
}

/**
 * Produce a 405 Method Not Allowed response for unexported HTTP methods.
 *
 * Next.js 16 returns 405 automatically for missing exports, but this helper
 * ensures we return a structured Planner response with correlation id and
 * the Allow header listing available methods.
 *
 * Accepts the optional second context argument so the function signature
 * matches the Next.js 16 route handler type-check expectations.
 */
export function plannerMethodNotAllowed(
  request: Request,
  allowedMethods: string[],
  _context?: unknown,
): Response {
  const correlationId = resolvePlannerCorrelationId(
    request.headers.get("x-correlation-id"),
  );
  return plannerApiFailure(
    "METHOD_NOT_ALLOWED",
    correlationId,
    405,
    {},
    { Allow: [...allowedMethods, "OPTIONS"].join(", ") },
  );
}
