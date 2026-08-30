/**
 * Feature: ai-implementation-audit
 *
 * Property 11: Retrieval output is ordered, deduplicated, and capped
 * Property 12: Retrieval fails open to catalog order
 * Property 13: Short queries return catalog order
 *
 * Tasks 8.3, 8.4, 8.5 — property-based tests for retrieveCatalogProducts().
 * The vector layer (searchCatalogVectors) is mocked; the Orama lexical layer
 * runs for real.
 *
 * ≥100 iterations per property.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import fc from "fast-check";

import type { RetrievableProduct } from "@/lib/ai/mastra/catalogRetrieval";

// ---------------------------------------------------------------------------
// Mock the vector recall layer so tests do not require a live LanceDB store.
// ---------------------------------------------------------------------------

const { searchCatalogVectors } = vi.hoisted(() => ({
  searchCatalogVectors: vi.fn(),
}));

vi.mock("@/lib/ai/mastra/catalogRag", () => ({
  searchCatalogVectors,
}));

const { retrieveCatalogProducts } = await import("@/lib/ai/mastra/catalogRetrieval");

// ---------------------------------------------------------------------------
// Shared arbitraries
// ---------------------------------------------------------------------------

/** Valid slug: lowercase letter, then 2-30 lowercase-alphanumeric or hyphens. */
const slugArb = fc
  .stringMatching(/^[a-z][a-z0-9-]{2,30}$/)
  .filter((s) => s.length >= 3);

function makeProduct(slug: string, extra: Partial<RetrievableProduct> = {}): RetrievableProduct {
  return {
    id: `id-${slug}`,
    slug,
    name: slug.replace(/-/g, " "),
    category_id: "seating",
    ...extra,
  };
}

/** Non-empty array of products with distinct slugs (≥2 entries). */
const distinctProductArrayArb: fc.Arbitrary<RetrievableProduct[]> = fc
  .array(slugArb, { minLength: 2, maxLength: 10 })
  .map((slugs) => [...new Set(slugs)])
  .filter((slugs) => slugs.length >= 2)
  .map((slugs) => slugs.map((s) => makeProduct(s)));

/** Query of length ≥ 2 (triggers the full retrieval stack). */
const longQueryArb = fc
  .constantFrom(
    "ergonomic task chair",
    "height adjustable desk",
    "conference table",
    "locker storage cabinet",
    "collaborative sofa lounge",
    "executive seating mesh",
    "modular workstation",
    "sit stand electric",
  );

/** Trimmed query of length < 2 (triggers catalog-order short-circuit). */
const shortQueryArb = fc.oneof(
  fc.constant(""),
  fc.constant(" "),
  fc.constant("  "),
  fc.constant("a"),
  fc.constant("A"),
  fc.constant("1"),
  fc.string({ minLength: 0, maxLength: 1 }),
);

// The valid sources in retrieval output.
const VALID_SOURCES = ["vector", "lexical", "catalog-order"] as const;
type RetrievalSource = (typeof VALID_SOURCES)[number];

function isSubsequence(sub: readonly string[], seq: readonly string[]): boolean {
  let si = 0;
  for (const element of seq) {
    if (si < sub.length && sub[si] === element) si++;
  }
  return si === sub.length;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  searchCatalogVectors.mockResolvedValue([]);
});

// =============================================================================
// Property 11: Retrieval output is ordered, deduplicated, and capped
// =============================================================================

describe("Property 11: Retrieval output is ordered, deduplicated, and capped", () => {
  it("result has ≤ N products, no duplicate slugs, and sources is a valid subsequence (≥100 iterations)", async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctProductArrayArb,
        longQueryArb,
        fc.integer({ min: 1, max: 12 }),
        async (products, query, limit) => {
          searchCatalogVectors.mockResolvedValue([]);

          const result = await retrieveCatalogProducts(query, products, limit);

          // Assertion 1: result is capped at limit.
          expect(
            result.products.length,
            `products.length ${result.products.length} > limit ${limit}`,
          ).toBeLessThanOrEqual(limit);

          // Assertion 2: no duplicate slugs.
          const seen = new Set<string>();
          for (const p of result.products) {
            expect(
              seen.has(p.slug),
              `duplicate slug "${p.slug}" in result`,
            ).toBe(false);
            seen.add(p.slug);
          }

          // Assertion 3: sources is a subsequence of the canonical source order.
          expect(
            isSubsequence(result.sources as string[], VALID_SOURCES as unknown as string[]),
            `sources [${result.sources.join(", ")}] is not a subsequence of [${VALID_SOURCES.join(", ")}]`,
          ).toBe(true);
        },
      ),
      { numRuns: 100, seed: 20260843 },
    );
  });

  it("vector hits that match catalog products appear first, before lexical or catalog-order", async () => {
    const products = [
      makeProduct("vector-hit-a"),
      makeProduct("lexical-only-b", { name: "lexical only b ergonomic" }),
      makeProduct("catalog-tail-c"),
    ];

    searchCatalogVectors.mockResolvedValue([
      { id: "product:id-vector-hit-a", score: 0.95 },
    ]);

    const result = await retrieveCatalogProducts("ergonomic seating", products, 3);

    expect(result.products[0]?.slug).toBe("vector-hit-a");
    expect(result.sources[0]).toBe("vector");
  });
});

// =============================================================================
// Property 12: Retrieval fails open to catalog order
// =============================================================================

describe("Property 12: Retrieval fails open to catalog order", () => {
  it("does NOT throw and returns ≤ limit products when searchCatalogVectors throws (≥100 iterations)", async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctProductArrayArb,
        longQueryArb,
        fc.integer({ min: 1, max: 8 }),
        async (products, query, limit) => {
          // Make vector recall throw every time.
          searchCatalogVectors.mockRejectedValue(new Error("lancedb unavailable"));

          const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

          let threw = false;
          let result: Awaited<ReturnType<typeof retrieveCatalogProducts>> | null = null;

          try {
            result = await retrieveCatalogProducts(query, products, limit);
          } catch {
            threw = true;
          } finally {
            consoleSpy.mockRestore();
          }

          // Must not throw.
          expect(threw, "retrieveCatalogProducts must not throw when vector layer fails").toBe(false);

          // Must return a result.
          expect(result).not.toBeNull();

          // Result must be ≤ limit.
          expect(
            result!.products.length,
            `products.length ${result!.products.length} > limit ${limit}`,
          ).toBeLessThanOrEqual(limit);

          // Vector must not appear in sources when it threw.
          expect(
            result!.sources,
            "sources must not contain 'vector' when vector recall threw",
          ).not.toContain("vector" satisfies RetrievalSource);
        },
      ),
      { numRuns: 100, seed: 20260843 },
    );
  });

  it("returns up to limit products from catalog order when all recall throws", async () => {
    searchCatalogVectors.mockRejectedValue(new Error("lancedb down"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const products = [
      makeProduct("chair-a"),
      makeProduct("desk-b"),
      makeProduct("table-c"),
    ];

    const result = await retrieveCatalogProducts("height adjustable desk", products, 2);

    expect(result.products.length).toBeLessThanOrEqual(2);
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.sources).not.toContain("vector");

    consoleSpy.mockRestore();
  });
});

// =============================================================================
// Property 13: Short queries return catalog order
// =============================================================================

describe("Property 13: Short queries return catalog order", () => {
  it("trimmed query of length < 2 returns products.slice(0, limit) and sources=['catalog-order'] (≥100 iterations)", async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctProductArrayArb,
        shortQueryArb,
        fc.integer({ min: 1, max: 10 }),
        async (products, query, limit) => {
          // Reset call count before each iteration.
          searchCatalogVectors.mockClear();
          searchCatalogVectors.mockResolvedValue([]);

          const result = await retrieveCatalogProducts(query, products, limit);

          // Assertion 1: returns catalog order slice.
          const expectedProducts = products.slice(0, limit);
          expect(result.products).toEqual(expectedProducts);

          // Assertion 2: sources is exactly ["catalog-order"].
          expect(result.sources).toEqual(["catalog-order"]);

          // Assertion 3: vector was never called (short-circuit applies).
          expect(
            searchCatalogVectors,
            "searchCatalogVectors must not be called for a short query",
          ).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100, seed: 20260843 },
    );
  });

  it("empty string query returns catalog slice without touching retrieval layers", async () => {
    const products = [
      makeProduct("chair-a"),
      makeProduct("desk-b"),
      makeProduct("locker-c"),
    ];

    const result = await retrieveCatalogProducts("", products, 2);

    expect(result.products).toEqual(products.slice(0, 2));
    expect(result.sources).toEqual(["catalog-order"]);
    expect(searchCatalogVectors).not.toHaveBeenCalled();
  });

  it("single-character query (with surrounding spaces) returns catalog slice", async () => {
    const products = [
      makeProduct("chair-a"),
      makeProduct("desk-b"),
    ];

    const result = await retrieveCatalogProducts("  x  ", products, 5);

    // trimmed = "x" (length 1 < 2) → short-circuit.
    expect(result.products).toEqual(products);
    expect(result.sources).toEqual(["catalog-order"]);
    expect(searchCatalogVectors).not.toHaveBeenCalled();
  });
});
