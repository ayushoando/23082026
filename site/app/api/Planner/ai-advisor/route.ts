import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import {
  resolveAdvisorModelChain,
  requestAdvisorMessages,
  type AdvisorModelTarget,
  type AdvisorProviderId,
  type AdvisorChatMessage,
} from "@/lib/ai/mastra";
import { withAuth, type AuthContext } from "@/features/shared/api/withAuth";
import { success } from "@/features/shared/api/apiResponse";
import { validationError } from "@/features/shared/api/apiResponse";
import { PlannerAdvisorRequestSchema } from "@/features/shared/api/schemas";
import { recordAdvisorRequest } from "@/lib/observability/aiMetrics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlannerAdvisorResponse {
  /** Primary text response from the model (or heuristic fallback). */
  content: string;
  /** Optional concise layout or space-planning suggestion. */
  suggestion?: string;
  /** True when the response is degraded (heuristic fallback). */
  degraded?: boolean;
  /** Provider label used for this response — never a raw model ID or secret. */
  provider?: string;
  /** Optional layout identifier suggested by the model. */
  layout?: string;
  /** True when heuristic fallback was used. */
  fallbackUsed: boolean;
}

type PlannerStreamEvent =
  | { type: "status"; message: string }
  | { type: "delta"; text: string }
  | { type: "result"; result: PlannerAdvisorResponse }
  | { type: "error"; message: string };

type PlannerAdvisorClientConfig = {
  provider: AdvisorProviderId;
  label: string;
  target: AdvisorModelTarget;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLANNER_ADVISOR_TIMEOUT_MS = 10_000;

const STREAM_ENCODER = new TextEncoder();
const STREAM_HEADERS = {
  "content-type": "application/x-ndjson; charset=utf-8",
  "cache-control": "no-cache, no-transform",
  connection: "keep-alive",
};

// ---------------------------------------------------------------------------
// Heuristic fallback
// ---------------------------------------------------------------------------

const HEURISTIC_FALLBACK_CONTENT =
  "I'm unable to reach the AI advisor right now. " +
  "For space planning, consider a 1.2–1.5 m² footprint per workstation, " +
  "add 20% for circulation, and use modular workstations for flexibility. " +
  "Share room dimensions and team size for a tighter recommendation.";

function buildHeuristicFallback(provider?: string): PlannerAdvisorResponse {
  return {
    content: HEURISTIC_FALLBACK_CONTENT,
    suggestion: "Use modular workstations at 1.2–1.5 m² per seat with 20% circulation allowance.",
    degraded: true,
    fallbackUsed: true,
    provider,
  };
}

// ---------------------------------------------------------------------------
// Provider chain helpers
// ---------------------------------------------------------------------------

function resolveAdvisorClients(): PlannerAdvisorClientConfig[] {
  return resolveAdvisorModelChain().map((target) => ({
    provider: target.provider,
    label: target.label,
    target,
  }));
}

function isAbortLikeError(err: unknown): boolean {
  if (!err || typeof err !== "object") {return false;}
  const maybeError = err as { name?: string; message?: string };
  return (
    maybeError.name === "AbortError" ||
    String(maybeError.message ?? "").toLowerCase().includes("aborted")
  );
}

// ---------------------------------------------------------------------------
// Streaming helpers
// ---------------------------------------------------------------------------

function emitStreamEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: PlannerStreamEvent,
): void {
  try {
    controller.enqueue(STREAM_ENCODER.encode(`${JSON.stringify(event)}\n`));
  } catch {
    // Client may have disconnected
  }
}

function chunkText(text: string): string[] {
  return text.split(/(\s+)/).filter(Boolean);
}

async function streamResolvedResult(
  controller: ReadableStreamDefaultController<Uint8Array>,
  result: PlannerAdvisorResponse,
): Promise<void> {
  emitStreamEvent(controller, { type: "status", message: "Preparing response" });
  for (const token of chunkText(result.content)) {
    emitStreamEvent(controller, { type: "delta", text: token });
    await Promise.resolve();
  }
  emitStreamEvent(controller, { type: "result", result });
}

function createStreamResponse(
  executor: (controller: ReadableStreamDefaultController<Uint8Array>) => Promise<void>,
): Response | Promise<Response> {
  // Jest environment: buffer synchronously, return after executor resolves.
  if (process.env.JEST_WORKER_ID) {
    const chunks: Uint8Array[] = [];
    const bufferedController = {
      enqueue(chunk: Uint8Array) {
        chunks.push(chunk);
      },
      close() {},
    } as unknown as ReadableStreamDefaultController<Uint8Array>;

    return executor(bufferedController)
      .catch((err) => {
        console.error("[planner/ai-advisor] stream error:", err);
        emitStreamEvent(bufferedController, {
          type: "error",
          message: "Unable to process advisor request right now.",
        });
      })
      .then(
        () =>
          new Response(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))), {
            headers: STREAM_HEADERS,
          }),
      );
  }

  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        void executor(controller)
          .catch((err) => {
            console.error("[planner/ai-advisor] stream error:", err);
            emitStreamEvent(controller, {
              type: "error",
              message: "Unable to process advisor request right now.",
            });
          })
          .finally(() => {
            try {
              controller.close();
            } catch {
              // Already closed
            }
          });
      },
    }),
    { headers: STREAM_HEADERS },
  );
}

// ---------------------------------------------------------------------------
// Request execution
// ---------------------------------------------------------------------------

async function requestPlannerRawResponse(
  target: AdvisorModelTarget,
  messages: AdvisorChatMessage[],
  stream: boolean,
  onDelta?: (delta: string) => void,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PLANNER_ADVISOR_TIMEOUT_MS);

  try {
    return await requestAdvisorMessages(target, messages, {
      signal: controller.signal,
      stream,
      onDelta,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildPlannerResponse(
  raw: string,
  providerLabel: string,
): PlannerAdvisorResponse | null {
  const content = raw.trim();
  if (!content) {return null;}
  return {
    content,
    provider: providerLabel,
    fallbackUsed: false,
    degraded: false,
  };
}

// ---------------------------------------------------------------------------
// Core handler
// ---------------------------------------------------------------------------

async function handlePlannerAdvisor(
  req: NextRequest,
  _auth: AuthContext,
): Promise<NextResponse | Response> {
  const body = await req.json().catch(() => null);
  const parsed = PlannerAdvisorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }

  // `stream` is not part of PlannerAdvisorRequestSchema; read it from raw body.
  const isStream = body !== null && typeof body === "object" && (body as unknown as Record<string, unknown>).stream === true;
  const { messages: rawMessages } = parsed.data;

  // Cast to AdvisorChatMessage[] — schema already validates role/content shape.
  const messages = rawMessages as AdvisorChatMessage[];

  const advisorClients = resolveAdvisorClients();
  const advisorStartTime = Date.now();

  if (advisorClients.length === 0) {
    const fallback = buildHeuristicFallback();
    recordAdvisorRequest({
      surface: "planner",
      provider: "unknown",
      fallbackUsed: true,
      degraded: true,
      latencyMs: Date.now() - advisorStartTime,
      fallbackReason: "no_chain",
    });
    return isStream
      ? createStreamResponse((controller) => streamResolvedResult(controller, fallback))
      : success(fallback as unknown as Record<string, unknown>);
  }

  // ---- Streaming path --------------------------------------------------------
  if (isStream) {
    return createStreamResponse(async (controller) => {
      for (const client of advisorClients) {
        let streamedAnyData = false;
        emitStreamEvent(controller, {
          type: "status",
          message: `Consulting ${client.label}`,
        });

        try {
          const raw = await requestPlannerRawResponse(
            client.target,
            messages,
            true,
            (delta) => {
              streamedAnyData = true;
              emitStreamEvent(controller, { type: "delta", text: delta });
            },
          );

          const result = buildPlannerResponse(raw, client.label);
          if (result) {
            emitStreamEvent(controller, { type: "result", result });
            return;
          }
        } catch (providerError) {
          console.error(
            `[planner/ai-advisor] ${client.label} stream error${isAbortLikeError(providerError) ? " (timeout)" : ""}:`,
            isAbortLikeError(providerError) ? "timeout" : "provider error",
          );
        }

        if (streamedAnyData) {
          break;
        }
      }

      const fallback = buildHeuristicFallback();
      await streamResolvedResult(controller, fallback);
    });
  }

  // ---- Non-streaming path ----------------------------------------------------
  for (const client of advisorClients) {
    try {
      const raw = await requestPlannerRawResponse(client.target, messages, false);
      const result = buildPlannerResponse(raw, client.label);

      if (result) {
        recordAdvisorRequest({
          surface: "planner",
          provider: client.provider,
          fallbackUsed: false,
          degraded: false,
          latencyMs: Date.now() - advisorStartTime,
        });
        return success(result as unknown as Record<string, unknown>);
      }
    } catch (providerError) {
      console.error(
        `[planner/ai-advisor] ${client.label} error${isAbortLikeError(providerError) ? " (timeout)" : ""}:`,
        isAbortLikeError(providerError) ? "timeout" : "provider error",
      );
    }
  }

  const fallback = buildHeuristicFallback();
  recordAdvisorRequest({
    surface: "planner",
    provider: "unknown",
    fallbackUsed: true,
    degraded: true,
    latencyMs: Date.now() - advisorStartTime,
    fallbackReason: "provider_error",
  });
  return success(fallback as unknown as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Exported route handler
// ---------------------------------------------------------------------------

/**
 * POST /api/planner/ai-advisor — Planner AI advisor.
 *
 * Accepts a `messages` array (chat history) plus optional `context` and returns
 * a space-planning suggestion as a `PlannerAdvisorResponse`. Supports NDJSON
 * streaming when `stream: true`. Guest auth; rate-limited.
 *
 * Response (200, non-stream): `{ success: true, content, suggestion?, degraded?,
 *   provider?, layout?, fallbackUsed }`.
 * Response (200, stream): `application/x-ndjson` of `{ type, ... }` events.
 * Errors: 400 (validation), 429 (rate limit), 403 (CSRF).
 */
export const POST = withAuth(
  async (req, auth) => handlePlannerAdvisor(req as NextRequest, auth),
  { role: "guest", rateLimitScope: "planner-ai-advisor", rateLimit: 5, requireCsrf: true },
);
