// @vitest-environment node
//
// Task 6.7 — Property-based test for 400 rejection of invalid request bodies.
//
// Feature: ai-implementation-audit, Property 7: Invalid request bodies are
// rejected with 400
//
// Generates bodies that fail PlannerAdvisorRequestSchema validation:
//   - missing messages field
//   - empty messages array
//   - messages with wrong types (non-string role, non-string content, missing fields)
//   - messages with content exceeding max length
//   - messages with empty content
//   - messages array exceeding max count
//
// Asserts HTTP 400 for all such inputs.
//
// Validates: Requirements 3.7
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
// Arbitraries — bodies that should FAIL PlannerAdvisorRequestSchema
// ---------------------------------------------------------------------------

/** Empty object — missing the required messages field. */
const missingMessagesArb = fc.record({
  mode: fc.option(fc.constantFrom("chat" as const, "space-suggest" as const), { nil: undefined }),
  context: fc.option(fc.constant({ seatCount: 5 }), { nil: undefined }),
});

/** Empty messages array — schema requires minLength 1. */
const emptyMessagesArb = fc.record({
  mode: fc.option(fc.constantFrom("chat" as const, "space-suggest" as const), { nil: undefined }),
  messages: fc.constant([]),
});

/** Messages array exceeding max of 20 items. */
const tooManyMessagesArb = fc.record({
  messages: fc.array(
    fc.record({ role: fc.constant("user" as const), content: fc.string({ minLength: 1, maxLength: 50 }) }),
    { minLength: 21, maxLength: 30 },
  ),
});

/** Message with empty content — schema requires minLength 1. */
const emptyContentMessageArb = fc.record({
  messages: fc.array(
    fc.record({ role: fc.constant("user" as const), content: fc.constant("") }),
    { minLength: 1, maxLength: 3 },
  ),
});

/** Message with content exceeding 2000 chars — schema enforces maxLength 2000. */
const overMaxContentArb = fc.record({
  messages: fc.array(
    fc.record({
      role: fc.constant("user" as const),
      content: fc.string({ minLength: 2001, maxLength: 2500 }),
    }),
    { minLength: 1, maxLength: 2 },
  ),
});

/** Message with an invalid role. */
const invalidRoleArb = fc.record({
  messages: fc.array(
    fc.record({
      role: fc.string({ minLength: 1, maxLength: 20 }).filter(
        (s) => !["user", "assistant", "system"].includes(s),
      ),
      content: fc.string({ minLength: 1, maxLength: 50 }),
    }),
    { minLength: 1, maxLength: 3 },
  ),
});

/** Completely wrong types (null, number, boolean). */
const wrongTypeArb = fc.oneof(
  fc.constant(null),
  fc.constant(42),
  fc.constant(true),
  fc.constant("just-a-string"),
  fc.constant([]),
);

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
// Property 7: Invalid request bodies are rejected with 400
// ---------------------------------------------------------------------------

describe("Feature: ai-implementation-audit, Property 7: Invalid request bodies are rejected with 400", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Providers should never be reached for invalid bodies
    resolveAdvisorModelChain.mockReturnValue([{ provider: "gemini", label: "Gemini" }]);
    requestAdvisorMessages.mockResolvedValue("Should not be called");
  });

  it("missing messages field returns 400", async () => {
    await fc.assert(
      fc.asyncProperty(missingMessagesArb, async (body) => {
        const res = await invokePost(postJson(body));
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("INVALID_REQUEST");
      }),
      { numRuns: 100, seed: 20260843 },
    );
  });

  it("empty messages array returns 400", async () => {
    await fc.assert(
      fc.asyncProperty(emptyMessagesArb, async (body) => {
        const res = await invokePost(postJson(body));
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("INVALID_REQUEST");
      }),
      { numRuns: 100, seed: 20260843 },
    );
  });

  it("messages array exceeding max 20 items returns 400", async () => {
    await fc.assert(
      fc.asyncProperty(tooManyMessagesArb, async (body) => {
        const res = await invokePost(postJson(body));
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("INVALID_REQUEST");
      }),
      { numRuns: 100, seed: 20260843 },
    );
  });

  it("message with empty content returns 400", async () => {
    await fc.assert(
      fc.asyncProperty(emptyContentMessageArb, async (body) => {
        const res = await invokePost(postJson(body));
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("INVALID_REQUEST");
      }),
      { numRuns: 100, seed: 20260843 },
    );
  });

  it("message with content exceeding 2000 chars returns 400", async () => {
    await fc.assert(
      fc.asyncProperty(overMaxContentArb, async (body) => {
        const res = await invokePost(postJson(body));
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("INVALID_REQUEST");
      }),
      { numRuns: 100, seed: 20260843 },
    );
  });

  it("message with invalid role returns 400", async () => {
    await fc.assert(
      fc.asyncProperty(invalidRoleArb, async (body) => {
        const res = await invokePost(postJson(body));
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("INVALID_REQUEST");
      }),
      { numRuns: 100, seed: 20260843 },
    );
  });

  it("completely wrong body types return 400", async () => {
    await fc.assert(
      fc.asyncProperty(wrongTypeArb, async (body) => {
        const res = await invokePost(postJson(body));
        // null/number/boolean JSON body is valid to parse but fails Zod
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error.code).toBe("INVALID_REQUEST");
      }),
      { numRuns: 100, seed: 20260843 },
    );
  });

  it("provider operations are never called for invalid bodies", async () => {
    await fc.assert(
      fc.asyncProperty(missingMessagesArb, async (body) => {
        requestAdvisorMessages.mockClear();
        await invokePost(postJson(body));
        expect(requestAdvisorMessages).not.toHaveBeenCalled();
      }),
      { numRuns: 100, seed: 20260843 },
    );
  });
});
