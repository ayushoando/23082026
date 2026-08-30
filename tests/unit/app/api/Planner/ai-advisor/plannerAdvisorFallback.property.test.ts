// @vitest-environment node
//
// Task 6.6 — Property-based test for heuristic fallback behavior.
//
// Feature: ai-implementation-audit, Property 6: Missing usable provider
// yields heuristic fallback
//
// When no provider in the chain returns usable text (empty chain, all throw,
// all return empty string), the route must:
//   1. Return HTTP 200 (not 5xx)
//   2. Carry success:true in the envelope
//   3. Return data.content as a non-empty string (the deterministic fallback)
//   4. Set data.degraded === true
//
// Validates: Requirements 3.6
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
// Mock the Planner route adapter
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
  context: fc.option(fc.constant({ seatCount: 4 }), { nil: undefined }),
});

/** Provider entry with a label — the chain has entries but all throw. */
const providerEntryArb = fc.record({
  provider: fc.constantFrom("gemini", "openrouter", "openai", "bedrock"),
  label: fc.string({ minLength: 1, maxLength: 30 }),
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
// Property 6: Missing usable provider yields heuristic fallback
// ---------------------------------------------------------------------------

describe("Feature: ai-implementation-audit, Property 6: Missing usable provider yields heuristic fallback", () => {
  describe("empty chain — no providers configured", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      resolveAdvisorModelChain.mockReturnValue([]);
    });

    it("returns HTTP 200 with success:true and non-empty content (empty chain)", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, async (body) => {
          const res = await invokePost(postJson(body));

          expect(res.status).toBe(200);
          const json = await res.json();
          expect(json.success).toBe(true);
          expect(typeof json.data.content).toBe("string");
          expect(json.data.content.trim().length).toBeGreaterThan(0);
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });

    it("sets degraded:true when chain is empty", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, async (body) => {
          const res = await invokePost(postJson(body));
          const json = await res.json();
          expect(json.data.degraded).toBe(true);
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });
  });

  describe("all-throwing chain — providers present but all fail", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns HTTP 200 with success:true and non-empty content (all throw)", async () => {
      await fc.assert(
        fc.asyncProperty(
          validBodyArb,
          fc.array(providerEntryArb, { minLength: 1, maxLength: 4 }),
          async (body, providers) => {
            resolveAdvisorModelChain.mockReturnValue(providers);
            requestAdvisorMessages.mockRejectedValue(new Error("provider error"));

            const res = await invokePost(postJson(body));

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(typeof json.data.content).toBe("string");
            expect(json.data.content.trim().length).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100, seed: 20260844 },
      );
    });

    it("sets degraded:true when all providers throw", async () => {
      await fc.assert(
        fc.asyncProperty(
          validBodyArb,
          fc.array(providerEntryArb, { minLength: 1, maxLength: 4 }),
          async (body, providers) => {
            resolveAdvisorModelChain.mockReturnValue(providers);
            requestAdvisorMessages.mockRejectedValue(new Error("provider error"));

            const res = await invokePost(postJson(body));
            const json = await res.json();
            expect(json.data.degraded).toBe(true);
          },
        ),
        { numRuns: 100, seed: 20260844 },
      );
    });
  });

  describe("all-empty-content chain — providers return blank strings", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns degraded fallback when all providers yield empty/whitespace content", async () => {
      await fc.assert(
        fc.asyncProperty(
          validBodyArb,
          fc.array(providerEntryArb, { minLength: 1, maxLength: 4 }),
          fc.constantFrom("", "   ", "\n", "\t"),
          async (body, providers, emptyContent) => {
            resolveAdvisorModelChain.mockReturnValue(providers);
            requestAdvisorMessages.mockResolvedValue(emptyContent);

            const res = await invokePost(postJson(body));

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
            expect(typeof json.data.content).toBe("string");
            expect(json.data.content.trim().length).toBeGreaterThan(0);
            expect(json.data.degraded).toBe(true);
          },
        ),
        { numRuns: 100, seed: 20260845 },
      );
    });
  });
});
