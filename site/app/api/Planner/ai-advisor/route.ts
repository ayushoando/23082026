/**
 * POST /api/Planner/ai-advisor — Planner AI advisor endpoint.
 *
 * Accepts a multi-turn `messages` array plus optional `mode` and `context`
 * and returns a single advisory text response. The endpoint is intentionally
 * non-streaming (default) and advisory-only: it never modifies plan state.
 *
 * Requests flow through the Planner request-processing pipeline which
 * enforces: correlation → quota → method/validation → origin/CSRF
 * → session → owner scope → revision/idempotency → persistence.
 *
 * Response (200):
 *   `{ success: true, data: { content, degraded?, provider? }, correlationId }`
 * Errors: 400 (validation), 403 (CSRF/origin), 429 (rate limit), 500.
 *
 * Fork boundary: this file MUST NOT import anything from
 * `site/components/Studio/` or `site/lib/Studio/`.
 */

import {
  requestAdvisorMessages,
  resolveAdvisorModelChain,
  type AdvisorChatMessage,
} from "@/lib/ai/mastra";
import { PlannerAdvisorRequestSchema } from "@/features/shared/api/schemas";
import {
  createPlannerHandler,
  createPlannerRejectedMethodHandler,
} from "@planner/server/plannerRouteAdapter";
import type {
  PlannerOperationContext,
  PlannerOperationResult,
} from "@planner/lib/plannerRequestPipeline";

/** Timeout applied to each provider attempt, in milliseconds. */
const PLANNER_ADVISOR_TIMEOUT_MS = 10_000;

/**
 * The system prompt is prepended ahead of the caller-supplied message list so
 * the model always has scope, tone, and boundary constraints regardless of the
 * mode the client passes.
 */
const PLANNER_ADVISOR_SYSTEM_PROMPT =
  "You are a professional office space planning advisor for One & Only Furniture. " +
  "Help the user design, optimise, or troubleshoot their floor plan or furniture layout. " +
  "Answer concisely and practically. " +
  "Do not suggest purchasing anything outside the One & Only Furniture catalog. " +
  "Respond in plain text — no JSON, no markdown code fences. " +
  "If asked to apply changes to a plan, explain the change instead; never output machine-readable plan data.";

/** Deterministic fallback content when all providers fail or chain is empty. */
const FALLBACK_CONTENT =
  "I'm unable to reach the AI advisor right now. " +
  "Please check your layout against the recommended clearance guidelines (min 900 mm between workstations) " +
  "and ensure primary aisles are at least 1200 mm wide. Try again shortly for AI-assisted advice.";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") { return false; }
  const e = err as { name?: string; message?: string };
  return (
    e.name === "AbortError" ||
    String(e.message ?? "").toLowerCase().includes("aborted")
  );
}

/**
 * Build the full message list for the Mastra agent call by prepending the
 * system prompt ahead of the caller-supplied messages.
 */
function buildMessages(
  callerMessages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
): AdvisorChatMessage[] {
  return [
    { role: "system", content: PLANNER_ADVISOR_SYSTEM_PROMPT },
    ...callerMessages,
  ];
}

// ---------------------------------------------------------------------------
// Core operation
// ---------------------------------------------------------------------------

async function handlePlannerAdvisor(
  context: PlannerOperationContext,
): Promise<PlannerOperationResult<unknown>> {
  // --- 1. Parse and validate body with Zod for trimming/min-max enforcement ---
  const parsed = PlannerAdvisorRequestSchema.safeParse(context.request.body);
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

  const { messages: callerMessages } = parsed.data;

  // --- 2. Resolve provider chain ---
  const chain = resolveAdvisorModelChain();

  if (chain.length === 0) {
    return {
      ok: true,
      status: 200,
      data: { content: FALLBACK_CONTENT, degraded: true },
    };
  }

  // --- 3. Try each provider in order, return first success ---
  const messages = buildMessages(callerMessages);

  for (const target of chain) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PLANNER_ADVISOR_TIMEOUT_MS);

    try {
      const content = await requestAdvisorMessages(target, messages, {
        signal: controller.signal,
        stream: false,
      });

      clearTimeout(timeoutId);

      if (content && content.trim().length > 0) {
        return {
          ok: true,
          status: 200,
          data: { content: content.trim(), provider: target.provider },
        };
      }
    } catch (providerErr) {
      clearTimeout(timeoutId);
      // Log only a safe classification — never the raw error object which may
      // contain provider API keys, SDK internals, or credential fragments.
      // Requirements 11.8, 11.9: internal errors must not reach client responses.
      const timedOut = isAbortError(providerErr);
      console.error(
        `[planner/ai-advisor] provider attempt failed${timedOut ? " (timeout)" : " (error)"}`,
      );
      // Continue to next provider in chain.
    }
  }

  // --- 4. All providers exhausted — return deterministic degraded fallback ---
  return {
    ok: true,
    status: 200,
    data: { content: FALLBACK_CONTENT, degraded: true },
  };
}

// ---------------------------------------------------------------------------
// Exported route handler
// ---------------------------------------------------------------------------

/**
 * POST /api/Planner/ai-advisor
 *
 * Auth: guest (anonymous users may use the planner).
 * CSRF: required for mutating POST.
 * Rate limit: 5 requests per window per IP under the "planner-advisor" scope.
 *
 * The Planner request-processing pipeline ensures:
 * - A correlation identifier is generated/propagated and included in every
 *   response body and x-correlation-id header (Requirement 17.3).
 * - All unhandled exceptions are mapped to INTERNAL_ERROR without exposing
 *   stack traces, credentials, or sensitive data (Requirements 11.8, 11.9).
 * - Operation handler failures are sanitized through the allowlisted metadata
 *   structure before serialization (Requirements 11.8, 11.9).
 */
export const POST = createPlannerHandler({
  endpointId: "planner.ai-advisor",
  operation: { invoke: handlePlannerAdvisor },
});

// Unsupported methods still enter the quota-first request pipeline.
export const GET = createPlannerRejectedMethodHandler("planner.ai-advisor");
export const PUT = createPlannerRejectedMethodHandler("planner.ai-advisor");
export const DELETE = createPlannerRejectedMethodHandler("planner.ai-advisor");
export const PATCH = createPlannerRejectedMethodHandler("planner.ai-advisor");
