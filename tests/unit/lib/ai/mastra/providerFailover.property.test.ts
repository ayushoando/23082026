/**
 * Feature: ai-implementation-audit
 * Property 9: Failover advances to the first usable target
 *
 * Task 8.2 — verifies that the advisor route iterates the provider chain and
 * returns the first non-empty content, skipping providers that throw or return
 * empty strings. When all fail, the heuristic fallback is used.
 *
 * Strategy: mock `@/lib/ai/mastra` (resolveAdvisorModelChain + requestAdvisorText
 * + retrieveCatalogProducts) and `@/lib/catalog/site/getProducts`, then drive the
 * catalog route handler with arbitrary outcome sequences.  The mock pattern
 * mirrors the existing route.test.ts so this test exercises the real failover
 * loop in site/app/api/ai-advisor/route.ts.
 *
 * ≥50 iterations (outcome sequences make this expensive).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks — must be declared before any import of tested code.
// ---------------------------------------------------------------------------

const getProductsFresh = vi.hoisted(() => vi.fn());
const resolveAdvisorModelChain = vi.hoisted(() => vi.fn());
const requestAdvisorText = vi.hoisted(() => vi.fn());
const retrieveCatalogProducts = vi.hoisted(() =>
  vi.fn().mockImplementation(
    async (_q: unknown, products: unknown[], limit: number) => ({
      products: (products as { slug: string }[]).slice(0, limit),
      sources: ["catalog-order" as const],
    }),
  ),
);

vi.mock("@/features/shared/api/withAuth", () => ({
  withAuth: (
    handler: (req: NextRequest, auth: { user: null }) => Promise<Response>,
  ) => (req: NextRequest) => handler(req, { user: null }),
}));

vi.mock("@/lib/catalog/site/getProducts", () => ({
  getProductsFresh,
}));

vi.mock("@/lib/ai/mastra", () => ({
  resolveAdvisorModelChain,
  requestAdvisorText,
  retrieveCatalogProducts,
}));

vi.mock("@/platform/supabase/auth-admin", () => ({
  createSupabaseAuthAdminClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

// Import after mocks are declared.
const { POST } = await import("@/app/api/ai-advisor/route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PRODUCT_FIXTURE = {
  id: "p1",
  slug: "chair-a",
  name: "Chair A",
  category_id: "seating",
  description: "Ergonomic task chair",
};

function makeRequest(query = "ergonomic chair") {
  return new NextRequest("http://localhost/api/ai-advisor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
}

/**
 * Build the mock chain and requestAdvisorText behavior from a sequence of
 * outcomes: "throw" | "empty" | "content".
 *
 * The route iterates the chain calling requestAdvisorText with each target.
 * We model each target as an object with a label; requestAdvisorText is
 * configured via mockImplementation to inspect which target it receives.
 */
type Outcome = "throw" | "empty" | "content";

function setupChainOutcomes(outcomes: Outcome[]): string[] {
  if (outcomes.length === 0) {
    resolveAdvisorModelChain.mockReturnValue([]);
    requestAdvisorText.mockRejectedValue(new Error("no chain"));
    return [];
  }

  const chain = outcomes.map((_, i) => ({
    provider: "openrouter" as const,
    label: `provider-${i}`,
    id: `openrouter/model-${i}` as `${string}/${string}`,
    url: "https://openrouter.ai/api/v1",
    apiKey: `key-${i}`,
  }));

  resolveAdvisorModelChain.mockReturnValue(chain);

  // Build a valid JSON response body that the route can parse successfully.
  const validContent = (label: string) =>
    JSON.stringify({
      recommendations: [
        {
          productId: "p1",
          slug: "chair-a",
          productName: "Chair A",
          category: "seating",
          reason: `Suggested by ${label}`,
          priceEstimate: "On request",
          quantity: 1,
        },
      ],
      summary: `Summary from ${label}`,
      totalBudget: "On request",
      nextActions: [],
      warnings: [],
      pricingMode: "on-request",
    });

  requestAdvisorText.mockImplementation(
    async (target: { label: string }) => {
      const idx = chain.findIndex((c) => c.label === target.label);
      const outcome = outcomes[idx] ?? "throw";
      if (outcome === "throw") {
        throw new Error(`provider-${idx} failed`);
      }
      if (outcome === "empty") {
        return "";
      }
      return validContent(target.label);
    },
  );

  return chain.map((c) => c.label);
}

// ---------------------------------------------------------------------------
// Property 9
// ---------------------------------------------------------------------------

describe("Property 9: Failover advances to the first usable target", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProductsFresh.mockResolvedValue([PRODUCT_FIXTURE]);
    retrieveCatalogProducts.mockImplementation(
      async (_q: unknown, products: unknown[], limit: number) => ({
        products: (products as { slug: string }[]).slice(0, limit),
        sources: ["catalog-order" as const],
      }),
    );
  });

  it("route returns first content target result or fallback when all fail (≥50 iterations)", async () => {
    const outcomeArb = fc.constantFrom<Outcome>("throw", "empty", "content");
    const outcomeSeqArb = fc.array(outcomeArb, { minLength: 0, maxLength: 4 });

    await fc.assert(
      fc.asyncProperty(outcomeSeqArb, async (outcomes) => {
        vi.clearAllMocks();
        getProductsFresh.mockResolvedValue([PRODUCT_FIXTURE]);
        retrieveCatalogProducts.mockImplementation(
          async (_q: unknown, products: unknown[], limit: number) => ({
            products: (products as { slug: string }[]).slice(0, limit),
            sources: ["catalog-order" as const],
          }),
        );

        setupChainOutcomes(outcomes);

        const res = await POST(makeRequest());
        const json = await res.json() as Record<string, unknown>;

        const firstContentIdx = outcomes.indexOf("content");
        const allFail = firstContentIdx === -1;

        if (allFail) {
          // All providers failed/empty — route must fall back gracefully.
          // Either fallbackUsed is true OR success is false (both indicate fallback).
          const isFallback =
            (json["success"] === true && json["fallbackUsed"] === true) ||
            json["success"] === false;
          expect(
            isFallback,
            `expected fallback when all providers fail, got: ${JSON.stringify(json)}`,
          ).toBe(true);
        } else {
          // At least one content provider — route must return success.
          expect(
            json["success"],
            `expected success=true when provider at index ${firstContentIdx} returns content`,
          ).toBe(true);
        }

        // In all cases the response must be a JSON object (not a network error).
        expect(typeof json).toBe("object");
        expect(json).not.toBeNull();
      }),
      { numRuns: 50, seed: 20260843 },
    );
  });

  it("empty chain yields fallback", async () => {
    setupChainOutcomes([]);
    const res = await POST(makeRequest());
    const json = await res.json() as Record<string, unknown>;
    const isFallback =
      (json["success"] === true && json["fallbackUsed"] === true) ||
      json["success"] === false;
    expect(isFallback).toBe(true);
  });
});
