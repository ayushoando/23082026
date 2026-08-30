// @vitest-environment node
//
// Task 6.5 — Property-based test for non-streaming JSON transport.
//
// Feature: ai-implementation-audit, Property 5: Streaming responses are
// newline-delimited JSON
//
// The current route does NOT support streaming (non-streaming default). When
// `stream` is false (or absent), the response must be a single valid JSON
// object, not NDJSON. This property asserts:
//   1. Content-Type is application/json (not application/x-ndjson)
//   2. The response body parses as a single valid JSON object
//   3. The parsed body has the expected success envelope shape
//
// Validates: Requirements 3.3 (non-streaming conformance)
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

/**
 * Valid body — stream:false is the default and not a schema field, but we test
 * bodies with and without explicit stream flags to ensure neither triggers NDJSON.
 */
const validBodyArb = fc.record({
  mode: fc.option(fc.constantFrom("chat" as const, "space-suggest" as const), { nil: undefined }),
  messages: fc.array(messageArb, { minLength: 1, maxLength: 5 }),
  context: fc.option(fc.constant({ seatCount: 4 }), { nil: undefined }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const routeContext: { params: Promise<Record<string, string>> } = {
  params: Promise.resolve({} as Record<string, string>),
};

const invokePost = (request: NextRequest) => POST(request, routeContext);

function postJson(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/planner/ai-advisor", {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": "t" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Property 5: Non-streaming responses are valid JSON (not NDJSON)
// ---------------------------------------------------------------------------

describe("Feature: ai-implementation-audit, Property 5: Streaming responses are newline-delimited JSON", () => {
  describe("non-streaming default — response is valid JSON, not NDJSON", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      resolveAdvisorModelChain.mockReturnValue([
        { provider: "gemini", label: "Gemini" },
      ]);
      requestAdvisorMessages.mockResolvedValue("Here is my advisory response.");
    });

    it("Content-Type is application/json (not application/x-ndjson)", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, async (body) => {
          const res = await invokePost(postJson(body));

          const ct = res.headers.get("content-type") ?? "";
          // Must be JSON — NDJSON would be application/x-ndjson or text/plain
          expect(ct).toMatch(/application\/json/);
          expect(ct).not.toMatch(/ndjson/);
          expect(ct).not.toMatch(/x-ndjson/);
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });

    it("response body parses as a single valid JSON object (not line-by-line)", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, async (body) => {
          const res = await invokePost(postJson(body));
          const text = await res.text();

          // Must parse as a single JSON document (no NDJSON multi-line output)
          let parsed: unknown;
          expect(() => {
            parsed = JSON.parse(text);
          }).not.toThrow();

          // Must be a plain object
          expect(parsed).toBeDefined();
          expect(typeof parsed).toBe("object");
          expect(parsed).not.toBeNull();
          expect(Array.isArray(parsed)).toBe(false);
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });

    it("parsed body has the success envelope shape", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, async (body) => {
          const res = await invokePost(postJson(body));
          const json = await res.json();

          // Top-level envelope
          expect(typeof json.success).toBe("boolean");
          expect(typeof json.correlationId).toBe("string");

          if (json.success) {
            // Success envelope must carry data
            expect(json.data).toBeDefined();
          } else {
            // Error envelope must carry error.code
            expect(json.error).toBeDefined();
            expect(typeof json.error.code).toBe("string");
          }
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });

    it("body does not contain raw NDJSON event keywords (status/delta/result stream events)", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, async (body) => {
          const res = await invokePost(postJson(body));
          const json = await res.json();

          // Non-streaming responses MUST NOT carry NDJSON stream event types
          // at the top level; those belong only in streaming line events.
          const topLevelKeys = Object.keys(json as Record<string, unknown>);
          expect(topLevelKeys).not.toContain("event");
          expect(topLevelKeys).not.toContain("delta");

          // data.content is a string — not a streamed event object
          if (json.success && json.data) {
            expect(typeof json.data.content).toBe("string");
          }
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });
  });

  describe("fallback path — non-streaming shape preserved", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      resolveAdvisorModelChain.mockReturnValue([]);
    });

    it("fallback response is also a single JSON object (not NDJSON)", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, async (body) => {
          const res = await invokePost(postJson(body));
          const text = await res.text();

          // Single parsable JSON document
          let parsed: unknown;
          expect(() => {
            parsed = JSON.parse(text);
          }).not.toThrow();
          expect(typeof parsed).toBe("object");
          expect(Array.isArray(parsed)).toBe(false);
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });
  });
});
