// @vitest-environment node
//
// Task 6.4 — Property-based test for planner advisor response shape.
//
// Feature: ai-implementation-audit, Property 4: Planner response conforms to
// PlannerAdvisorResponse shape
//
// For any outcome (success or degraded fallback), asserts that the HTTP
// response carries `success: true` and `data.content` is a non-empty string.
// The pipeline is bypassed via the plannerRouteAdapter mock so the test
// exercises only the handler logic and the Zod schema guard.
//
// Validates: Requirements 3.4, 3.5
// ≥100 iterations

import fc from "fast-check";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mock factories
// ---------------------------------------------------------------------------

const resolveAdvisorModelChain = vi.hoisted(() => vi.fn());
const requestAdvisorMessages = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ai/mastra", () => ({
  resolveAdvisorModelChain,
  requestAdvisorMessages,
}));

// ---------------------------------------------------------------------------
// Mock the Planner route adapter — bypass the full request-processing pipeline
// and call the operation handler directly.
// ---------------------------------------------------------------------------
vi.mock("@planner/server/plannerRouteAdapter", () => ({
  createPlannerHandler: vi.fn(
    ({
      operation,
    }: {
      operation: {
        invoke: (
          ctx: unknown,
        ) => Promise<{
          ok: boolean;
          status: number;
          data?: unknown;
          code?: string;
          metadata?: { issues?: unknown[] };
        }>;
      };
    }) =>
      async (req: Request) => {
        const correlationId = "test-correlation-id";

        let body: unknown = undefined;
        const ct = req.headers.get("content-type") ?? "";
        if (ct.includes("application/json")) {
          try {
            body = await req.clone().json();
          } catch {
            return Response.json(
              {
                success: false,
                error: { code: "INVALID_REQUEST", message: "Could not parse request body" },
                correlationId,
              },
              { status: 400 },
            );
          }
        }

        const context = {
          correlationId,
          session: { ownerId: "user-1", isAdmin: false },
          ownerScope: { ownerId: "user-1" },
          request: { body, path: {}, query: {}, headers: {} },
        };

        try {
          const result = await operation.invoke(context);
          if (result.ok) {
            return Response.json(
              { success: true, contractVersion: 1, data: result.data, correlationId },
              { status: result.status ?? 200 },
            );
          }
          return Response.json(
            {
              success: false,
              error: {
                code: result.code ?? "INTERNAL_ERROR",
                message: "Request failed",
                ...(result.metadata?.issues ? { issues: result.metadata.issues } : {}),
              },
              correlationId,
            },
            { status: result.status ?? 500 },
          );
        } catch (err) {
          return Response.json(
            {
              success: false,
              error: { code: "INTERNAL_ERROR", message: String(err) },
              correlationId,
            },
            { status: 500 },
          );
        }
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

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const roleArb = fc.constantFrom("user" as const, "assistant" as const, "system" as const);

const messageArb = fc.record({
  role: roleArb,
  content: fc.string({ minLength: 1, maxLength: 200 }),
});

const validBodyArb = fc.record({
  mode: fc.option(fc.constantFrom("chat" as const, "space-suggest" as const), { nil: undefined }),
  messages: fc.array(messageArb, { minLength: 1, maxLength: 5 }),
  context: fc.option(fc.constant({ seatCount: 10, floorAreaSqFt: 1000 }), { nil: undefined }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const routeContext: { params: Promise<Record<string, string>> } = {
  params: Promise.resolve({} as Record<string, string>),
};

const invokePost = (body: unknown) => POST(postJson(body), routeContext);

function postJson(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/planner/ai-advisor", {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": "t" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Property 4: Planner response conforms to PlannerAdvisorResponse shape
// ---------------------------------------------------------------------------

describe("Feature: ai-implementation-audit, Property 4: Planner response conforms to PlannerAdvisorResponse shape", () => {
  describe("success path — provider returns content", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      resolveAdvisorModelChain.mockReturnValue([
        { provider: "gemini", label: "Gemini" },
      ]);
      requestAdvisorMessages.mockResolvedValue("Advisory text from provider.");
    });

    it("response always has success:true and data.content as a string (provider success)", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, async (body) => {
          const res = await invokePost(postJson(body));
          expect(res.status).toBe(200);

          const json = await res.json();
          expect(json.success).toBe(true);
          expect(typeof json.data.content).toBe("string");
          expect(json.data.content.length).toBeGreaterThan(0);
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });

    it("provider field is a string when present", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, async (body) => {
          const res = await invokePost(postJson(body));
          const json = await res.json();

          if (json.data.provider !== undefined) {
            expect(typeof json.data.provider).toBe("string");
          }
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });

    it("degraded field is boolean when present", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, async (body) => {
          const res = await invokePost(postJson(body));
          const json = await res.json();

          if (json.data.degraded !== undefined) {
            expect(typeof json.data.degraded).toBe("boolean");
          }
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });
  });

  describe("fallback path — chain empty", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      resolveAdvisorModelChain.mockReturnValue([]);
    });

    it("response always has success:true and data.content as a string (fallback)", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, async (body) => {
          const res = await invokePost(postJson(body));
          expect(res.status).toBe(200);

          const json = await res.json();
          expect(json.success).toBe(true);
          expect(typeof json.data.content).toBe("string");
          expect(json.data.content.length).toBeGreaterThan(0);
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });
  });
});
