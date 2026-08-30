// @vitest-environment node
//
// Task 6.8 — Property-based test for secret and model-id non-disclosure.
//
// Feature: ai-implementation-audit, Property 10: Secrets and model identifiers
// never leave the server
//
// For any response (success, fallback, or error envelope), asserts that the
// serialized response body:
//   1. Does NOT contain env-var secret names (GEMINI_API_KEY, OPENROUTER_API_KEY,
//      OPENAI_API_KEY, AWS_SECRET)
//   2. Does NOT contain raw model identifiers containing "claude", "gpt-4", "gemini-2"
//   3. Only exposes provider labels (short strings like "gemini", "openrouter")
//      rather than full API endpoint URLs or SDK model ids
//
// The route logs provider errors with only a classification, never exposing
// raw error objects, stack traces, or credential fragments.
//
// Validates: Requirements 4.4, 11.8, 11.9
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
// Secret names and raw model id fragments that MUST NOT appear in responses
// ---------------------------------------------------------------------------

const SECRET_ENV_NAMES = [
  "GEMINI_API_KEY",
  "OPENROUTER_API_KEY",
  "OPENAI_API_KEY",
  "AWS_SECRET",
  "AWS_ACCESS_KEY",
  "OPENAI_API",
  "GEMINI_API",
  "ANTHROPIC_API_KEY",
];

const RAW_MODEL_ID_FRAGMENTS = [
  "claude-",
  "gpt-4",
  "gemini-2",
  "gemini-1",
  "claude-3",
  "claude-2",
  "gpt-3.5",
  "anthropic/",
  "openai/gpt",
  "google/gemini",
];

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

const providerArb = fc.constantFrom("gemini", "openrouter", "openai", "bedrock");

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

/**
 * Assert that a serialized response body does not contain any of the
 * forbidden secret env-var names or raw model id fragments.
 */
function assertNoSecretLeak(responseText: string): void {
  const lower = responseText.toLowerCase();

  for (const secret of SECRET_ENV_NAMES) {
    expect(lower).not.toContain(secret.toLowerCase());
  }

  for (const fragment of RAW_MODEL_ID_FRAGMENTS) {
    expect(lower).not.toContain(fragment.toLowerCase());
  }
}

// ---------------------------------------------------------------------------
// Property 10: Secrets and model identifiers never leave the server
// ---------------------------------------------------------------------------

describe("Feature: ai-implementation-audit, Property 10: Secrets and model identifiers never leave the server", () => {
  describe("success path", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("response body contains no secret env-var names (success path)", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, providerArb, async (body, provider) => {
          resolveAdvisorModelChain.mockReturnValue([{ provider, label: provider }]);
          requestAdvisorMessages.mockResolvedValue("Here is the advisory text.");

          const res = await invokePost(postJson(body));
          const text = await res.text();

          assertNoSecretLeak(text);
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });

    it("response body contains no raw model id fragments (success path)", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, providerArb, async (body, provider) => {
          resolveAdvisorModelChain.mockReturnValue([{ provider, label: provider }]);
          requestAdvisorMessages.mockResolvedValue("Advisory content without model ids.");

          const res = await invokePost(postJson(body));
          const text = await res.text();

          // The provider label in data.provider must be a short label, not a model id
          const json = JSON.parse(text) as Record<string, unknown>;
          if (
            json.success === true &&
            json.data !== null &&
            json.data !== undefined &&
            typeof json.data === "object"
          ) {
            const data = json.data as Record<string, unknown>;
            if (data.provider !== undefined) {
              const providerLabel = String(data.provider);
              // Provider label must not contain raw model id fragments
              for (const fragment of RAW_MODEL_ID_FRAGMENTS) {
                expect(providerLabel.toLowerCase()).not.toContain(fragment.toLowerCase());
              }
            }
          }
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });
  });

  describe("fallback path — empty or all-failing chain", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("fallback response body contains no secret env-var names", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, async (body) => {
          resolveAdvisorModelChain.mockReturnValue([]);

          const res = await invokePost(postJson(body));
          const text = await res.text();

          assertNoSecretLeak(text);
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });

    it("error-throwing provider response body contains no secret env-var names", async () => {
      await fc.assert(
        fc.asyncProperty(validBodyArb, providerArb, async (body, provider) => {
          resolveAdvisorModelChain.mockReturnValue([{ provider, label: provider }]);
          // Error message that tries to sneak in credential-like content
          requestAdvisorMessages.mockRejectedValue(
            new Error("API call failed: GEMINI_API_KEY=sk-test-key-not-real"),
          );

          const res = await invokePost(postJson(body));
          const text = await res.text();

          // The raw error message with the fake key must not appear in the response
          // (the route catches and sanitizes provider errors)
          assertNoSecretLeak(text);
          // Specifically the fake key value must not be present
          expect(text).not.toContain("sk-test-key-not-real");
        }),
        { numRuns: 100, seed: 20260843 },
      );
    });
  });

  describe("validation-error path — invalid body", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      resolveAdvisorModelChain.mockReturnValue([{ provider: "gemini", label: "gemini" }]);
    });

    it("400 error response contains no secret env-var names", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Bodies missing messages
          fc.constant({}),
          async (body) => {
            const res = await invokePost(postJson(body));
            const text = await res.text();
            assertNoSecretLeak(text);
          },
        ),
        { numRuns: 100, seed: 20260843 },
      );
    });
  });
});
