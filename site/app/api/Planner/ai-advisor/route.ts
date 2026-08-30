/**
 * POST /api/planner/ai-advisor — Planner AI advisor endpoint.
 *
 * Accepts a multi-turn `messages` array plus optional `mode` and `context`
 * and returns a single advisory text response. The endpoint is intentionally
 * non-streaming (default) and advisory-only: it never modifies plan state.
 *
 * Response (200):
 *   `{ success: true, content, degraded?, provider?, suggestion? }`
 * Errors: 400 (validation), 403 (CSRF), 429 (rate limit), 500.
 *
 * Fork boundary: this file MUST NOT import anything from
 * `site/components/Studio/` or `site/lib/Studio/`.
 */

import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

import {
  requestAdvisorMessages,
  resolveAdvisorModelChain,
  type AdvisorChatMessage,
} from "@/lib/ai/mastra";
import { withAuth, type AuthContext } from "@/features/shared/api/withAuth";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";
import { success, error, validationError } from "@/features/shared/api/apiResponse";
import { PlannerAdvisorRequestSchema } from "@/features/shared/api/schemas";

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
// Core handler
// ---------------------------------------------------------------------------

async function handlePlannerAdvisor(
  req: NextRequest,
  _auth: AuthContext,
): Promise<NextResponse | Response> {
  // --- 1. Parse and validate body ---
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return error(
      new ApiError(400, API_ERROR_CODES.VALIDATION_ERROR, "Request body must be valid JSON"),
    );
  }

  const parsed = PlannerAdvisorRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }

  const { messages: callerMessages } = parsed.data;

  // --- 2. Resolve provider chain ---
  const chain = resolveAdvisorModelChain();

  if (chain.length === 0) {
    return success<{ content: string; degraded: true }>({
      content: FALLBACK_CONTENT,
      degraded: true,
    });
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
        return success({
          content: content.trim(),
          provider: target.provider,
        });
      }
    } catch (providerErr) {
      clearTimeout(timeoutId);
      const timedOut = isAbortError(providerErr);
      console.error(
        `[planner/ai-advisor] ${target.provider} failed${timedOut ? " (timeout)" : ""}:`,
        providerErr,
      );
      // Continue to next provider in chain.
    }
  }

  // --- 4. All providers exhausted — return deterministic degraded fallback ---
  return success<{ content: string; degraded: true }>({
    content: FALLBACK_CONTENT,
    degraded: true,
  });
}

// ---------------------------------------------------------------------------
// Exported route handler
// ---------------------------------------------------------------------------

/**
 * POST /api/planner/ai-advisor
 *
 * Auth: guest (anonymous users may use the planner).
 * CSRF: required for mutating POST.
 * Rate limit: 5 requests per window per IP under the "planner-advisor" scope.
 */
export const POST = withAuth(
  async (req, auth) => handlePlannerAdvisor(req as NextRequest, auth),
  {
    role: "guest",
    requireCsrf: true,
    rateLimitScope: "planner-advisor",
    rateLimit: 5,
  },
);
