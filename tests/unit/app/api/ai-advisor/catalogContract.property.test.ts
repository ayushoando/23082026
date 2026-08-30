// @vitest-environment node
//
// Feature: ai-implementation-audit, Property 3: Catalog advisor response retains all contract fields
//
// For arbitrary query / context / non-empty product set, every built response —
// provider-success, catalog-unavailable, and fallback — must carry all 7
// contract fields:  recommendations  summary  totalBudget  nextActions
//                   warnings  pricingMode  fallbackUsed
//
// ≥100 fast-check iterations.
//
// **Validates: Requirements 2.3**

import fc from "fast-check";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks — must precede the module import
// ---------------------------------------------------------------------------

const getProductsFreshMock = vi.hoisted(() => vi.fn());
const resolveAdvisorModelChainMock = vi.hoisted(() => vi.fn());
const requestAdvisorTextMock = vi.hoisted(() => vi.fn());
const retrieveCatalogProductsMock = vi.hoisted(() =>
  vi.fn().mockImplementation(async (_q: unknown, products: unknown[], limit: number) => ({
    products: (products as { slug: string }[]).slice(0, limit),
    sources: ["catalog-order" as const],
  })),
);

vi.mock("@/features/shared/api/withAuth", () => ({
  withAuth: (
    handler: (req: NextRequest, auth: { user: null }) => Promise<Response>,
    _options: Record<string, unknown>,
  ) => (req: NextRequest) => handler(req, { user: null }),
}));

vi.mock("@/lib/catalog/site/getProducts", () => ({
  getProductsFresh: getProductsFreshMock,
}));

vi.mock("@/lib/ai/mastra", () => ({
  resolveAdvisorModelChain: resolveAdvisorModelChainMock,
  requestAdvisorText: requestAdvisorTextMock,
  retrieveCatalogProducts: retrieveCatalogProductsMock,
}));

vi.mock("@/platform/supabase/auth-admin", () => ({
  createSupabaseAuthAdminClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

import { POST } from "@/app/api/ai-advisor/route";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_RUNS = 100;
const PROPERTY_SEED = 20261408;

/** All 7 contract fields the Catalog_Advisor_Route response must carry. */
const CONTRACT_FIELDS = [
  "recommendations",
  "summary",
  "totalBudget",
  "nextActions",
  "warnings",
  "pricingMode",
  "fallbackUsed",
] as const;

type ContractField = (typeof CONTRACT_FIELDS)[number];

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const productArb = fc.record({
  id: fc.uuid(),
  slug: fc
    .stringMatching(/^[a-z][a-z0-9-]{2,30}$/)
    .filter((s) => s.length > 3),
  name: fc.string({ minLength: 3, maxLength: 80 }),
  category_id: fc.constantFrom(
    "seating",
    "workstations",
    "tables",
    "storages",
    "soft-seating",
    "education",
  ),
  description: fc.option(fc.string({ minLength: 5, maxLength: 180 }), { nil: undefined }),
  series_name: fc.option(fc.string({ minLength: 2, maxLength: 40 }), { nil: undefined }),
  series: fc.option(fc.string({ minLength: 2, maxLength: 40 }), { nil: undefined }),
  metadata: fc.option(
    fc.record({
      tags: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { maxLength: 5 }),
      subcategory: fc.option(fc.string({ minLength: 2, maxLength: 30 }), { nil: undefined }),
      priceRange: fc.option(
        fc.constantFrom("budget", "mid", "premium", "luxury"),
        { nil: undefined },
      ),
    }),
    { nil: null },
  ),
});

/** Non-empty product array with unique slugs. */
const nonEmptyProductsArb = fc
  .array(productArb, { minLength: 1, maxLength: 6 })
  .filter((arr) => new Set(arr.map((p) => p.slug)).size === arr.length);

const validQueryArb = fc
  .string({ minLength: 3, maxLength: 200 })
  .filter((s) => s.trim().length >= 3);

const validContextArb = fc.record({
  source: fc.constant("global" as const),
  mode: fc.option(
    fc.constantFrom("quick-estimate" as const, "technical-planner" as const),
    { nil: undefined },
  ),
  seatOrUnitCount: fc.option(fc.integer({ min: 1, max: 200 }), { nil: undefined }),
  projectType: fc.option(
    fc.constantFrom("workstations" as const, "storages" as const),
    { nil: undefined },
  ),
  siteLocation: fc.option(fc.string({ minLength: 2, maxLength: 60 }), { nil: undefined }),
  budgetBand: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: undefined }),
  estimatedBudget: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: undefined }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/ai-advisor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Assert that a parsed response body carries all 7 contract fields with
 * expected types. Each field is checked for presence and basic type validity.
 */
function assertContractFields(body: Record<string, unknown>, scenario: string): void {
  for (const field of CONTRACT_FIELDS) {
    expect(
      field in body,
      `[${scenario}] missing contract field: "${field}"`,
    ).toBe(true);
  }

  // recommendations — array
  expect(Array.isArray(body.recommendations), `[${scenario}] recommendations must be an array`).toBe(true);

  // summary — string
  expect(typeof body.summary, `[${scenario}] summary must be a string`).toBe("string");

  // totalBudget — string
  expect(typeof body.totalBudget, `[${scenario}] totalBudget must be a string`).toBe("string");

  // nextActions — array
  expect(Array.isArray(body.nextActions), `[${scenario}] nextActions must be an array`).toBe(true);

  // warnings — array
  expect(Array.isArray(body.warnings), `[${scenario}] warnings must be an array`).toBe(true);

  // pricingMode — 'band' | 'on-request'
  expect(
    body.pricingMode === "band" || body.pricingMode === "on-request",
    `[${scenario}] pricingMode must be 'band' or 'on-request', got ${String(body.pricingMode)}`,
  ).toBe(true);

  // fallbackUsed — boolean
  expect(
    typeof body.fallbackUsed,
    `[${scenario}] fallbackUsed must be a boolean`,
  ).toBe("boolean");
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Feature: ai-implementation-audit", () => {
  describe("Property 3: Catalog advisor response retains all contract fields", () => {

    beforeEach(() => {
      vi.clearAllMocks();
      // Default retrieval mock — always succeeds, returns catalog-order slice
      retrieveCatalogProductsMock.mockImplementation(
        async (_q: unknown, products: unknown[], limit: number) => ({
          products: (products as { slug: string }[]).slice(0, limit),
          sources: ["catalog-order" as const],
        }),
      );
    });

    // -----------------------------------------------------------------------
    // Path 1: provider-success — provider returns a valid JSON response
    // -----------------------------------------------------------------------

    it("provider-success path: all 7 contract fields are present with correct types", async () => {
      await fc.assert(
        fc.asyncProperty(
          nonEmptyProductsArb,
          validQueryArb,
          fc.option(validContextArb, { nil: undefined }),
          async (products, query, context) => {
            vi.clearAllMocks();

            // Wire up a successful provider that echoes back a valid response
            getProductsFreshMock.mockResolvedValue(products);

            // Single advisor client in the chain
            const fakeTarget = { provider: "gemini" as const, label: "gemini" };
            resolveAdvisorModelChainMock.mockReturnValue([fakeTarget]);

            retrieveCatalogProductsMock.mockImplementation(
              async (_q: unknown, prods: unknown[], limit: number) => ({
                products: (prods as { slug: string }[]).slice(0, limit),
                sources: ["catalog-order" as const],
              }),
            );

            // Build a minimal valid provider response using the first product's slug
            const firstSlug = products[0]!.slug;
            const providerResponse = JSON.stringify({
              recommendations: [
                {
                  productUrlKey: firstSlug,
                  productId: firstSlug,
                  productName: products[0]!.name,
                  category: products[0]!.category_id,
                  why: "Matches the brief.",
                  budgetEstimate: "On request",
                },
              ],
              totalBudget: "Indicative budget band on request",
              summary: "A valid provider recommendation.",
              nextActions: ["Confirm team size."],
              warnings: [] as string[],
              pricingMode: "on-request",
            });
            requestAdvisorTextMock.mockResolvedValue(providerResponse);

            const res = await POST(makeRequest({ query, context, stream: false }));
            expect(res.status).toBe(200);

            const body = (await res.json()) as Record<string, unknown>;
            expect(body.success).toBe(true);

            // The contract fields live at the top level of the envelope body
            assertContractFields(body as Record<ContractField, unknown>, "provider-success");

            // Provider succeeded — fallbackUsed must be false
            expect(body.fallbackUsed).toBe(false);
          },
        ),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });

    // -----------------------------------------------------------------------
    // Path 2: catalog-unavailable — getProductsFresh returns empty array
    // -----------------------------------------------------------------------

    it("catalog-unavailable path: all 7 contract fields are present with correct types", async () => {
      await fc.assert(
        fc.asyncProperty(
          validQueryArb,
          fc.option(validContextArb, { nil: undefined }),
          async (query, context) => {
            vi.clearAllMocks();

            // Empty catalog triggers the unavailable branch
            getProductsFreshMock.mockResolvedValue([]);
            resolveAdvisorModelChainMock.mockReturnValue([
              { provider: "gemini" as const, label: "gemini" },
            ]);
            retrieveCatalogProductsMock.mockImplementation(
              async (_q: unknown, prods: unknown[], limit: number) => ({
                products: (prods as { slug: string }[]).slice(0, limit),
                sources: ["catalog-order" as const],
              }),
            );

            const res = await POST(makeRequest({ query, context, stream: false }));
            expect(res.status).toBe(200);

            const body = (await res.json()) as Record<string, unknown>;
            expect(body.success).toBe(true);

            assertContractFields(body as Record<ContractField, unknown>, "catalog-unavailable");

            // Catalog unavailable → fallback path
            expect(body.fallbackUsed).toBe(true);
          },
        ),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });

    // -----------------------------------------------------------------------
    // Path 3: fallback — provider throws / returns invalid JSON / empty recs
    // -----------------------------------------------------------------------

    it("fallback path (provider failure): all 7 contract fields are present with correct types", async () => {
      await fc.assert(
        fc.asyncProperty(
          nonEmptyProductsArb,
          validQueryArb,
          fc.option(validContextArb, { nil: undefined }),
          fc.oneof(
            // Provider throws an error
            fc.constant({ kind: "throw" as const }),
            // Provider returns unparseable text
            fc.constant({ kind: "bad-json" as const }),
            // Provider returns empty recommendations array
            fc.constant({ kind: "empty-recs" as const }),
          ),
          async (products, query, context, failureMode) => {
            vi.clearAllMocks();

            getProductsFreshMock.mockResolvedValue(products);
            const fakeTarget = { provider: "gemini" as const, label: "gemini" };
            resolveAdvisorModelChainMock.mockReturnValue([fakeTarget]);

            retrieveCatalogProductsMock.mockImplementation(
              async (_q: unknown, prods: unknown[], limit: number) => ({
                products: (prods as { slug: string }[]).slice(0, limit),
                sources: ["catalog-order" as const],
              }),
            );

            switch (failureMode.kind) {
              case "throw":
                requestAdvisorTextMock.mockRejectedValue(new Error("provider unavailable"));
                break;
              case "bad-json":
                requestAdvisorTextMock.mockResolvedValue("not valid json at all");
                break;
              case "empty-recs":
                requestAdvisorTextMock.mockResolvedValue(
                  JSON.stringify({
                    recommendations: [],
                    totalBudget: "On request",
                    summary: "No items found.",
                    nextActions: [],
                    warnings: [],
                    pricingMode: "on-request",
                  }),
                );
                break;
            }

            const res = await POST(makeRequest({ query, context, stream: false }));
            expect(res.status).toBe(200);

            const body = (await res.json()) as Record<string, unknown>;
            expect(body.success).toBe(true);

            assertContractFields(body as Record<ContractField, unknown>, `fallback(${failureMode.kind})`);

            // All three failure modes converge on the heuristic fallback
            expect(body.fallbackUsed).toBe(true);
          },
        ),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });

    // -----------------------------------------------------------------------
    // Cross-path: every path produces non-null, non-undefined contract values
    // -----------------------------------------------------------------------

    it("no contract field is null or undefined in any response path", async () => {
      await fc.assert(
        fc.asyncProperty(
          nonEmptyProductsArb,
          validQueryArb,
          // Randomly pick any of the three paths
          fc.constantFrom("provider-success" as const, "catalog-unavailable" as const, "fallback" as const),
          async (products, query, path) => {
            vi.clearAllMocks();

            retrieveCatalogProductsMock.mockImplementation(
              async (_q: unknown, prods: unknown[], limit: number) => ({
                products: (prods as { slug: string }[]).slice(0, limit),
                sources: ["catalog-order" as const],
              }),
            );

            if (path === "catalog-unavailable") {
              getProductsFreshMock.mockResolvedValue([]);
              resolveAdvisorModelChainMock.mockReturnValue([]);
            } else if (path === "provider-success") {
              getProductsFreshMock.mockResolvedValue(products);
              resolveAdvisorModelChainMock.mockReturnValue([
                { provider: "gemini" as const, label: "gemini" },
              ]);
              const firstSlug = products[0]!.slug;
              requestAdvisorTextMock.mockResolvedValue(
                JSON.stringify({
                  recommendations: [
                    {
                      productUrlKey: firstSlug,
                      productId: firstSlug,
                      productName: products[0]!.name,
                      category: products[0]!.category_id,
                      why: "Matches brief.",
                      budgetEstimate: "On request",
                    },
                  ],
                  totalBudget: "On request",
                  summary: "Provider success.",
                  nextActions: ["Next step."],
                  warnings: [],
                  pricingMode: "on-request",
                }),
              );
            } else {
              // fallback
              getProductsFreshMock.mockResolvedValue(products);
              resolveAdvisorModelChainMock.mockReturnValue([
                { provider: "gemini" as const, label: "gemini" },
              ]);
              requestAdvisorTextMock.mockRejectedValue(new Error("unavailable"));
            }

            const res = await POST(makeRequest({ query, stream: false }));
            expect(res.status).toBe(200);

            const body = (await res.json()) as Record<string, unknown>;
            expect(body.success).toBe(true);

            for (const field of CONTRACT_FIELDS) {
              expect(
                body[field] !== null && body[field] !== undefined,
                `field "${field}" must not be null/undefined in path "${path}"`,
              ).toBe(true);
            }
          },
        ),
        { numRuns: PROPERTY_RUNS, seed: PROPERTY_SEED },
      );
    });
  });
});
