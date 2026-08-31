// @vitest-environment node
//
// Task 6.9 — Integration tests for Planner advisor route wiring.
//
// The Planner adapter is mocked using the established route-test convention.
// This keeps the test focused on the advisor route's POST wiring while still
// exercising guest access, quota-first handling, CSRF rejection, and the
// response envelope produced by the adapter.
//
// Validates: Requirements 3.1, 3.2, 6.6

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

interface PlannerOperationResult {
  ok: boolean;
  status: number;
  data?: unknown;
  code?: string;
  metadata?: { issues?: unknown[] };
}

interface PlannerOperation {
  invoke: (context: unknown) => Promise<PlannerOperationResult>;
}

const resolveAdvisorModelChain = vi.hoisted(() => vi.fn());
const requestAdvisorMessages = vi.hoisted(() => vi.fn());
const requestCount = vi.hoisted(() => ({ value: 0 }));
const rateLimitScopes = vi.hoisted(() => vi.fn());
const mockCounterInc = vi.hoisted(() => vi.fn());
const mockHistogramObserve = vi.hoisted(() => vi.fn());
const mockGaugeInc = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ai/mastra", () => ({
  resolveAdvisorModelChain,
  requestAdvisorMessages,
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/observability/metrics", () => ({
  getMetricsRegistry: () => ({}),
}));

vi.mock("@prometheus-io/client", () => {
  class Counter {
    public constructor(public readonly config: Record<string, unknown>) {}

    public inc(labels?: Record<string, string>): void {
      mockCounterInc(this.config.name, labels ?? {});
    }
  }

  class Histogram {
    public constructor(public readonly config: Record<string, unknown>) {}

    public observe(labels: Record<string, string>, value: number): void {
      mockHistogramObserve(this.config.name, labels, value);
    }
  }

  class Gauge {
    public constructor(public readonly config: Record<string, unknown>) {}

    public inc(labels?: Record<string, string>): void {
      mockGaugeInc(this.config.name, labels ?? {});
    }
  }

  return { Counter, Histogram, Gauge };
});

vi.mock("@planner/server/plannerRouteAdapter", () => ({
  createPlannerHandler: vi.fn(
    ({
      endpointId,
      operation,
    }: {
      endpointId: string;
      operation: PlannerOperation;
    }) => {
      if (endpointId !== "planner.ai-advisor") {
        throw new Error(`Unexpected endpoint: ${endpointId}`);
      }

      return async (req: Request): Promise<Response> => {
        const correlationId = "test-correlation-id";
        rateLimitScopes("planner-ai-advisor");

        // The adapter's quota check runs before CSRF validation. Five requests
        // are allowed for the planner-ai-advisor scope; the sixth is rejected.
        if (requestCount.value >= 5) {
          return Response.json(
            {
              success: false,
              error: { code: "RATE_LIMITED", message: "Too many requests" },
              correlationId,
            },
            { status: 429 },
          );
        }
        requestCount.value += 1;

        if (req.headers.get("x-csrf-token") !== "test-csrf") {
          return Response.json(
            {
              success: false,
              error: {
                code: "CSRF_FAILED",
                message: "Request verification failed",
              },
              correlationId,
            },
            { status: 403 },
          );
        }

        let body: unknown;
        try {
          body = await req.clone().json();
        } catch {
          return Response.json(
            {
              success: false,
              error: {
                code: "INVALID_REQUEST",
                message: "Could not parse request body",
              },
              correlationId,
            },
            { status: 400 },
          );
        }

        const context = {
          correlationId,
          // Guest access is intentional for the advisor endpoint.
          session: null,
          ownerScope: null,
          request: { body, path: {}, query: {}, headers: {} },
        };

        try {
          const result = await operation.invoke(context);
          if (result.ok) {
            if ("raw" in result) {
              return result.raw as Response;
            }
            return Response.json(
              {
                success: true,
                contractVersion: 1,
                data: result.data,
                correlationId,
              },
              { status: result.status ?? 200 },
            );
          }

          return Response.json(
            {
              success: false,
              error: {
                code: result.code ?? "INTERNAL_ERROR",
                message: "Request failed",
                ...(result.metadata?.issues
                  ? { issues: result.metadata.issues }
                  : {}),
              },
              correlationId,
            },
            { status: result.status ?? 500 },
          );
        } catch (error) {
          return Response.json(
            {
              success: false,
              error: { code: "INTERNAL_ERROR", message: String(error) },
              correlationId,
            },
            { status: 500 },
          );
        }
      };
    },
  ),
  createPlannerRejectedMethodHandler: vi.fn(
    () => async () =>
      Response.json(
        {
          success: false,
          error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
          correlationId: "test-correlation-id",
        },
        { status: 405, headers: { allow: "POST, OPTIONS" } },
      ),
  ),
}));

import { POST } from "@/app/api/planner/ai-advisor/route";
import { withAiObservability } from "@/lib/observability/aiMetrics";

const routeContext = {
  params: Promise.resolve({} as Record<string, string>),
};
const invokePost = (request: NextRequest) => POST(request, routeContext);

const validBody = {
  mode: "chat" as const,
  messages: [
    { role: "user" as const, content: "Suggest a better office layout." },
  ],
  context: { seatCount: 8, floorAreaSqFt: 900 },
};

type AiMetricsGlobal = typeof globalThis & {
  __oandoAiAdvisorMetrics?: unknown;
};

function resetAiMetricsSingleton(): void {
  (globalThis as AiMetricsGlobal).__oandoAiAdvisorMetrics = undefined;
}

function postJson(body: unknown = validBody, csrfToken?: string): NextRequest {
  const headers = new Headers({ "content-type": "application/json" });
  if (csrfToken !== undefined) {
    headers.set("x-csrf-token", csrfToken);
  }

  return new NextRequest("http://localhost/api/planner/ai-advisor", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function responseSnapshot(
  response: Response,
): Promise<{ status: number; body: string }> {
  return { status: response.status, body: await response.text() };
}

beforeEach(() => {
  vi.clearAllMocks();
  requestCount.value = 0;
  resetAiMetricsSingleton();
  resolveAdvisorModelChain.mockReturnValue([
    { provider: "gemini", label: "Gemini" },
  ]);
  requestAdvisorMessages.mockResolvedValue("Use a 1200 mm primary aisle.");
});

describe("POST /api/planner/ai-advisor route wiring", () => {
  it("accepts a valid guest POST at the planner advisor path", async () => {
    const response = await invokePost(postJson(validBody, "test-csrf"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        content: "Use a 1200 mm primary aisle.",
        provider: "gemini",
      },
    });
    expect(requestAdvisorMessages).toHaveBeenCalledOnce();
    expect(rateLimitScopes).toHaveBeenCalledWith("planner-ai-advisor");
  });

  it("rejects a POST with missing CSRF as non-200 before invoking the advisor", async () => {
    const response = await invokePost(postJson(validBody));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("CSRF_FAILED");
    expect(resolveAdvisorModelChain).not.toHaveBeenCalled();
    expect(requestAdvisorMessages).not.toHaveBeenCalled();
  });

  it("returns 429 on the sixth request for the planner-ai-advisor scope", async () => {
    for (let requestNumber = 0; requestNumber < 5; requestNumber += 1) {
      const response = await invokePost(postJson(validBody, "test-csrf"));
      expect(response.status).toBe(200);
    }

    const sixthResponse = await invokePost(postJson(validBody, "test-csrf"));
    const body = await sixthResponse.json();

    expect(sixthResponse.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(rateLimitScopes).toHaveBeenCalledTimes(6);
    expect(requestAdvisorMessages).toHaveBeenCalledTimes(5);
  });

  it("records observability side effects without changing the route status or body", async () => {
    const baseline = await responseSnapshot(
      await invokePost(postJson(validBody, "test-csrf")),
    );

    const observedResponse = await withAiObservability(
      "planner",
      async () => invokePost(postJson(validBody, "test-csrf")),
      () => ({
        route: "planner" as const,
        provider: "gemini",
        fallback: false,
        sources: ["catalog_order"],
        durationMs: 1,
      }),
    );
    const observed = await responseSnapshot(observedResponse);

    expect(observed).toEqual(baseline);
    expect(mockCounterInc).toHaveBeenCalledWith(
      "oando_ai_advisor_requests_total",
      expect.objectContaining({
        surface: "planner",
        provider: "gemini",
        fallback: "false",
      }),
    );
    expect(mockHistogramObserve).toHaveBeenCalledWith(
      "oando_ai_advisor_latency_ms",
      expect.objectContaining({ surface: "planner", provider: "gemini" }),
      expect.any(Number),
    );
    expect(mockGaugeInc).toHaveBeenCalledWith(
      "oando_ai_advisor_retrieval_sources",
      { surface: "planner", source: "catalog_order" },
    );
  });

  it("swallows observability failures and still returns the unchanged route response", async () => {
    const baseline = await responseSnapshot(
      await invokePost(postJson(validBody, "test-csrf")),
    );

    const observedResponse = await withAiObservability(
      "planner",
      async () => invokePost(postJson(validBody, "test-csrf")),
      () => {
        throw new Error("inspectable registry unavailable");
      },
    );
    const observed = await responseSnapshot(observedResponse);

    expect(observed).toEqual(baseline);
  });

  it("streams NDJSON events ending with a terminal result when stream is true", async () => {
    requestAdvisorMessages.mockImplementation(
      async (
        _target: unknown,
        _messages: unknown,
        options?: { onDelta?: (delta: string) => void },
      ) => {
        options?.onDelta?.("Use a ");
        options?.onDelta?.("1200 mm aisle.");
        return "Use a 1200 mm aisle.";
      },
    );

    const response = await invokePost(
      postJson({ ...validBody, stream: true }, "test-csrf"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/x-ndjson",
    );

    const events = (await response.text())
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as { type: string; result?: unknown });

    const terminal = events.at(-1);
    expect(terminal).toMatchObject({
      type: "result",
      result: { content: "Use a 1200 mm aisle.", provider: "gemini" },
    });
    expect(events.some((event) => event.type === "delta")).toBe(true);
  });

  it("ends the stream with a degraded fallback result when no provider responds", async () => {
    resolveAdvisorModelChain.mockReturnValue([
      { provider: "gemini", label: "Gemini" },
    ]);
    requestAdvisorMessages.mockRejectedValue(new Error("provider down"));

    const response = await invokePost(
      postJson({ ...validBody, stream: true }, "test-csrf"),
    );

    expect(response.status).toBe(200);

    const events = (await response.text())
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map(
        (line) =>
          JSON.parse(line) as {
            type: string;
            result?: { degraded?: boolean; content?: string };
          },
      );

    const terminal = events.at(-1);
    expect(terminal?.type).toBe("result");
    expect(terminal?.result?.degraded).toBe(true);
    expect(terminal?.result?.content).toContain("unable to reach");
  });
});
