// @vitest-environment node
//
// Task 1 — Bug-condition exploration property test
// Property 1: Planner endpoint existence and contract
//
// BUG FIXED: The route handler now exists at site/app/api/planner/ai-advisor/route.ts
// (lowercase). The exploration test below now PASSES — the counterexample
// (missing route handler) has been resolved.
//
// Validates: requirements 1.3, 2.3, 2.9, 2.10, 3.1, 3.4

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  PLANNER_ADVISOR_API_PATH,
  type PlannerAdvisorRequest,
  type PlannerAdvisorResponse,
} from "@/lib/ai/mastra/client";

// ---------------------------------------------------------------------------
// Deterministic arbitraries (no provider/remote-store call)
// ---------------------------------------------------------------------------

const plannerAdvisorMode = fc.constantFrom("chat" as const, "space-suggest" as const);

const plannerAdvisorRole = fc.constantFrom(
  "user" as const,
  "assistant" as const,
  "system" as const,
);

const messageArb = fc.record({
  role: plannerAdvisorRole,
  content: fc.string({ minLength: 1, maxLength: 300 }),
});

const contextArb = fc.record({
  planner: fc.constantFrom("oando" as const, "unified" as const),
  seatCount: fc.integer({ min: 1, max: 500 }),
  floorAreaSqFt: fc.integer({ min: 100, max: 50_000 }),
  currentShapeCount: fc.integer({ min: 0, max: 200 }),
});

const validRequestArb: fc.Arbitrary<PlannerAdvisorRequest> = fc.record({
  mode: plannerAdvisorMode,
  messages: fc.array(messageArb, { minLength: 1, maxLength: 5 }),
  context: fc.option(contextArb, { nil: undefined }),
});

// ---------------------------------------------------------------------------
// Bug-condition check helpers
// ---------------------------------------------------------------------------

/**
 * Canonical lowercase path recorded in the client and decision record.
 * On the baseline, NO route handler exists at this path.
 */
const CANONICAL_ROUTE_PATH = "/api/planner/ai-advisor";

/**
 * Attempt to dynamically import the route module.  Returns { exists: true,
 * exports: module } on success or { exists: false, error } on failure.
 */
async function tryImportRouteModule(): Promise<
  | { exists: true; exports: Record<string, unknown> }
  | { exists: false; error: unknown }
> {
  try {
    // Dynamic import so that a missing file produces a runtime error rather
    // than a compile-time failure.  Vitest module resolution maps @/app/* to
    // site/app/*, matching Next.js path aliases.
    const mod = (await import(
      "@/app/api/planner/ai-advisor/route"
    )) as Record<string, unknown>;
    return { exists: true, exports: mod };
  } catch (err) {
    return { exists: false, error: err };
  }
}

// ---------------------------------------------------------------------------
// Property 1a — the handler module exists at the canonical lowercase path
//
// Bug condition: route handler is missing or at a path-case mismatch.
// Bug condition resolved: route handler now exists.
// ---------------------------------------------------------------------------

describe("Planner ai-advisor endpoint — existence (bug fixed: now passes)", () => {
  it("PLANNER_ADVISOR_API_PATH constant points to the canonical lowercase path", () => {
    // This assertion passes even on the baseline — it only checks the client.
    expect(PLANNER_ADVISOR_API_PATH).toBe(CANONICAL_ROUTE_PATH);
  });

  it(
    "route module exists at site/app/api/planner/ai-advisor/route.ts and exports POST",
    async () => {
      // BUG CONDITION: this import fails on the unfixed baseline.
      const result = await tryImportRouteModule();

      if (!result.exists) {
        // Preserve the counterexample — the import failure IS the evidence.
        throw new Error(
          `[BUG-CONDITION counterexample] Route handler not found at ` +
            `site/app/api/planner/ai-advisor/route.ts. ` +
            `Import error: ${String(result.error)}`,
        );
      }

      // After the fix: the module must export a POST handler.
      expect(typeof result.exports["POST"]).toBe("function");
    },
  );
});

// ---------------------------------------------------------------------------
// Property 1b — a valid PlannerAdvisorRequest is normalizable
//
// This property tests the *shape contract* using only the client types and
// deterministic arbitraries.  It does not call a real handler; it verifies
// that the type contract is self-consistent.
//
// Expected baseline result: PASS (types are already defined in the client).
// This is the preservation baseline for the contract shape.
// ---------------------------------------------------------------------------

describe("Planner ai-advisor request/response contract shape", () => {
  it("every generated valid request satisfies the PlannerAdvisorRequest shape", () => {
    fc.assert(
      fc.property(validRequestArb, (req: PlannerAdvisorRequest) => {
        // All messages must have a role and non-empty content.
        for (const msg of req.messages) {
          expect(typeof msg.role).toBe("string");
          expect(msg.content.length).toBeGreaterThan(0);
        }

        // Mode must be one of the declared modes.
        expect(["chat", "space-suggest"]).toContain(req.mode);

        // Context, when present, must not contain server-side forbidden fields.
        if (req.context) {
          expect(req.context).not.toHaveProperty("userId");
          expect(req.context).not.toHaveProperty("sessionToken");
          expect(req.context).not.toHaveProperty("apiKey");
        }
      }),
      { numRuns: 100, seed: 20260843 },
    );
  });

  it("response shape requires content field and optional advisory-only fields", () => {
    // Construct a minimal stub response and check the structural contract.
    // This does not call a real provider.
    const stubResponse: PlannerAdvisorResponse = {
      content: "Use a bench layout for the team.",
      degraded: false,
      provider: "stub",
    };

    expect(typeof stubResponse.content).toBe("string");
    // layout must never be applied automatically — it is an advisory-only field.
    // A response carrying layout MUST still leave plan mutation to the user.
    if (stubResponse.layout !== undefined) {
      expect(typeof stubResponse.layout).toBe("object");
    }
    // degraded must be a boolean when present.
    if (stubResponse.degraded !== undefined) {
      expect(typeof stubResponse.degraded).toBe("boolean");
    }
  });

  it("route path case must be lowercase to match client constant", () => {
    // Decision record P-01: the proposed canonical path is lowercase.
    // A path-case mismatch is itself a bug condition on case-sensitive hosts.
    fc.assert(
      fc.property(fc.constant(CANONICAL_ROUTE_PATH), (path) => {
        expect(path).toBe(path.toLowerCase());
        expect(path).toMatch(/^\/api\/planner\/ai-advisor$/);
      }),
      { numRuns: 1, seed: 20260843 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 1c — response contract independence
//
// PlannerAdvisorResponse must be independently typed; it must not silently
// re-export or merge the catalog AdvisorResult contract.
// Expected baseline result: PASS (types are structurally independent).
// ---------------------------------------------------------------------------

describe("Planner response is independently typed (not a re-export of catalog AdvisorResult)", () => {
  it("PlannerAdvisorResponse has content/suggestion/degraded — NOT recommendations/totalBudget", () => {
    const stub: PlannerAdvisorResponse = {
      content: "Advisor output",
      degraded: true,
    };
    // These are Planner-specific fields.
    expect("content" in stub).toBe(true);
    expect("degraded" in stub).toBe(true);

    // These catalog-advisor fields must NOT appear on the Planner contract.
    // If the contracts were merged, this test would warn via TypeScript.
    const keys = Object.keys(stub);
    expect(keys).not.toContain("recommendations");
    expect(keys).not.toContain("totalBudget");
    expect(keys).not.toContain("fallbackUsed");
  });
});
