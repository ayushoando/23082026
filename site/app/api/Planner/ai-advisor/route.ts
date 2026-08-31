/**
 * POST /api/Planner/ai-advisor — Planner AI advisor endpoint.
 *
 * Accepts a multi-turn `messages` array plus optional `mode` and `context`
 * and returns a single advisory text response. Advisory-only: it never
 * modifies plan state.
 *
 * With `stream: true` the endpoint returns an `application/x-ndjson` stream
 * of `status`/`delta`/`result` events ending with a terminal `result` event;
 * otherwise the standard success envelope is returned.
 *
 * Requests flow through the Planner request-processing pipeline which
 * enforces: correlation → quota → method/validation → origin/CSRF
 * → session → owner scope → revision/idempotency → persistence.
 *
 * Response (200, non-stream):
 *   `{ success: true, data: { content, degraded?, provider? }, correlationId }`
 * Response (200, stream): `application/x-ndjson` of `{ type, ... }` events.
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
import { withAiObservability } from "@/lib/observability/aiMetrics";
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
// NDJSON streaming transport (mirrors the catalog advisor pattern)
// ---------------------------------------------------------------------------

const STREAM_ENCODER = new TextEncoder();

const STREAM_HEADERS = {
 "content-type": "application/x-ndjson; charset=utf-8",
 "cache-control": "no-cache, no-transform",
 connection: "keep-alive",
} as const;

type PlannerAdvisorStreamResult = {
 content: string;
 degraded?: boolean;
 provider?: string;
};

type PlannerAdvisorStreamEvent =
 | { type: "status"; message: string }
 | { type: "delta"; text: string }
 | { type: "result"; result: PlannerAdvisorStreamResult }
 | { type: "error"; message: string };

function emitStreamEvent(
 controller: ReadableStreamDefaultController<Uint8Array>,
 event: PlannerAdvisorStreamEvent,
): void {
 try {
  controller.enqueue(STREAM_ENCODER.encode(`${JSON.stringify(event)}\n`));
 } catch {
  // Ignore error if the client aborted the connection
 }
}

function createStreamResponse(
 executor: (
  controller: ReadableStreamDefaultController<Uint8Array>,
 ) => Promise<void>,
): Response {
 return new Response(
  new ReadableStream<Uint8Array>({
   start(controller) {
    void executor(controller)
     .catch((error) => {
      console.error("[planner/ai-advisor] stream error:", error);
      emitStreamEvent(controller, {
       type: "error",
       message: "Unable to process advisor request right now.",
      });
     })
     .finally(() => {
      try {
       controller.close();
      } catch {
       // Ignore if already closed
      }
     });
   },
  }),
  { headers: STREAM_HEADERS },
 );
}

/**
 * Streams the planner advisor response as NDJSON. Mirrors the catalog route:
 * consults each provider in chain order (forwarding deltas), emits a terminal
 * `result` event on first usable response, and falls back to the deterministic
 * degraded result when no provider yields usable text.
 */
async function streamPlannerAdvisor(
 controller: ReadableStreamDefaultController<Uint8Array>,
 callerMessages: Array<{
  role: "system" | "user" | "assistant";
  content: string;
 }>,
): Promise<void> {
 const chain = resolveAdvisorModelChain();
 const messages = buildMessages(callerMessages);

 for (const target of chain) {
  let streamedAnyData = false;
  emitStreamEvent(controller, {
   type: "status",
   message: `Consulting ${target.provider}`,
  });

  const abortController = new AbortController();
  const timeoutId = setTimeout(
   () => abortController.abort(),
   PLANNER_ADVISOR_TIMEOUT_MS,
  );

  try {
   const content = await requestAdvisorMessages(target, messages, {
    signal: abortController.signal,
    stream: true,
    onDelta: (delta) => {
     streamedAnyData = true;
     emitStreamEvent(controller, { type: "delta", text: delta });
    },
   });

   clearTimeout(timeoutId);

   if (content && content.trim().length > 0) {
    emitStreamEvent(controller, {
     type: "result",
     result: { content: content.trim(), provider: target.provider },
    });
    return;
   }
  } catch (providerErr) {
   clearTimeout(timeoutId);
   const timedOut = isAbortError(providerErr);
   console.error(
    `[planner/ai-advisor] ${target.provider} stream error${timedOut ? " (timeout)" : " (error)"}`,
   );
  }

  if (streamedAnyData) {
   break;
  }
 }

 emitStreamEvent(controller, {
  type: "result",
  result: { content: FALLBACK_CONTENT, degraded: true },
 });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isAbortError(err: unknown): boolean {
 if (!err || typeof err !== "object") {
  return false;
 }
 const e = err as { name?: string; message?: string };
 return (
  e.name === "AbortError" ||
  String(e.message ?? "")
   .toLowerCase()
   .includes("aborted")
 );
}

/**
 * Build the full message list for the Mastra agent call by prepending the
 * system prompt ahead of the caller-supplied messages.
 */
function buildMessages(
 callerMessages: Array<{
  role: "system" | "user" | "assistant";
  content: string;
 }>,
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

 const { messages: callerMessages, stream } = parsed.data;

 // --- 2. Streaming requests bypass the JSON envelope (NDJSON transport) ---
 if (stream === true) {
  return {
   ok: true,
   raw: await createStreamResponse((controller) =>
    streamPlannerAdvisor(controller, callerMessages),
   ),
  };
 }

 // --- 3. Non-streaming core, wrapped in best-effort AI observability ---
 type PlannerAdvisorOutcome = {
  content: string;
  provider?: string;
  fallback: boolean;
 };

 const outcome = await withAiObservability(
  "planner",
  async (): Promise<PlannerAdvisorOutcome> => {
   const chain = resolveAdvisorModelChain();

   if (chain.length === 0) {
    return { content: FALLBACK_CONTENT, fallback: true };
   }

   const messages = buildMessages(callerMessages);

   for (const target of chain) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
     () => controller.abort(),
     PLANNER_ADVISOR_TIMEOUT_MS,
    );

    try {
     const content = await requestAdvisorMessages(target, messages, {
      signal: controller.signal,
      stream: false,
     });

     clearTimeout(timeoutId);

     if (content && content.trim().length > 0) {
      return {
       content: content.trim(),
       provider: target.provider,
       fallback: false,
      };
     }
    } catch (providerErr) {
     clearTimeout(timeoutId);
     const timedOut = isAbortError(providerErr);
     console.error(
      `[planner/ai-advisor] provider attempt failed${timedOut ? " (timeout)" : " (error)"}`,
     );
    }
   }

   // All providers exhausted — deterministic degraded fallback.
   return { content: FALLBACK_CONTENT, fallback: true };
  },
  (result) => ({
   route: "planner",
   provider: result.provider ?? "unknown",
   fallback: result.fallback,
   durationMs: 0,
  }),
 );

 return {
  ok: true,
  status: 200,
  data: outcome.fallback
   ? { content: outcome.content, degraded: true }
   : { content: outcome.content, provider: outcome.provider },
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
