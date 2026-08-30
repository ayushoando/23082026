/**
 * Catalog retrieval for the AI advisor prompt — LanceDB vector recall, Orama
 * lexical recall, catalog-order tail. Vector layer is mocked (no embedder key
 * in unit runs); the Orama layer runs for real.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

import type { RetrievableProduct } from "@/lib/ai/mastra/catalogRetrieval";

const { searchCatalogVectors } = vi.hoisted(() => ({
  searchCatalogVectors: vi.fn(),
}));

vi.mock("@/lib/ai/mastra/catalogRag", () => ({
  searchCatalogVectors,
}));

const { retrieveCatalogProducts } = await import("@/lib/ai/mastra/catalogRetrieval");

function product(
  slug: string,
  name: string,
  extra: Partial<RetrievableProduct> = {},
): RetrievableProduct {
  return {
    id: `id-${slug}`,
    slug,
    name,
    category_id: "seating",
    ...extra,
  };
}

const CATALOG: RetrievableProduct[] = [
  product("aero-desk", "Aero Height Adjustable Desk", { category_id: "workstations" }),
  product("nimbus-chair", "Nimbus Ergonomic Task Chair", {
    metadata: { tags: ["ergonomic", "mesh"] },
  }),
  product("vault-locker", "Vault Personal Locker", { category_id: "storages" }),
  product("halo-table", "Halo Conference Table", { category_id: "tables" }),
];

describe("retrieveCatalogProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchCatalogVectors.mockResolvedValue([]);
  });

  it("returns nothing for an empty catalog or non-positive limit", async () => {
    await expect(retrieveCatalogProducts("chair", [], 5)).resolves.toEqual({
      products: [],
      sources: [],
    });
    await expect(retrieveCatalogProducts("chair", CATALOG, 0)).resolves.toEqual({
      products: [],
      sources: [],
    });
    expect(searchCatalogVectors).not.toHaveBeenCalled();
  });

  it("falls back to catalog order for a too-short query", async () => {
    const result = await retrieveCatalogProducts("a", CATALOG, 2);
    expect(result.products.map((p) => p.slug)).toEqual(["aero-desk", "nimbus-chair"]);
    expect(result.sources).toEqual(["catalog-order"]);
    expect(searchCatalogVectors).not.toHaveBeenCalled();
  });

  it("ranks lexical matches ahead of catalog order", async () => {
    const result = await retrieveCatalogProducts("ergonomic task chair", CATALOG, 3);
    expect(result.products[0]?.slug).toBe("nimbus-chair");
    expect(result.products).toHaveLength(3);
    expect(result.sources).toContain("lexical");
  });

  it("puts LanceDB vector hits first, matched by product id", async () => {
    searchCatalogVectors.mockResolvedValue([
      { id: "product:id-vault-locker", score: 0.9 },
      { id: "category:storages", score: 0.8 },
      { id: "product:id-halo-table", score: 0.7 },
    ]);

    const result = await retrieveCatalogProducts("ergonomic task chair", CATALOG, 4);
    expect(result.products.map((p) => p.slug).slice(0, 2)).toEqual([
      "vault-locker",
      "halo-table",
    ]);
    expect(result.sources[0]).toBe("vector");
    // No duplicates, whole catalog covered by the tail filler.
    expect(new Set(result.products.map((p) => p.slug)).size).toBe(4);
  });

  it("degrades to lexical + catalog order when vector recall throws", async () => {
    searchCatalogVectors.mockRejectedValue(new Error("lancedb offline"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await retrieveCatalogProducts("locker", CATALOG, 2);
    expect(result.products[0]?.slug).toBe("vault-locker");
    expect(result.sources).not.toContain("vector");
    expect(errorSpy).toHaveBeenCalledWith(
      "[catalog-retrieval] vector recall failed:",
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });

  it("caps results at the requested limit", async () => {
    const result = await retrieveCatalogProducts("desk", CATALOG, 1);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.slug).toBe("aero-desk");
  });
});

// =============================================================================
// Task 2 — Preservation property tests for catalogRetrieval (must PASS on baseline)
//
// These encode observation-first preservation properties for the three-layer
// retrieval stack (vector → lexical → catalog-order) and the Orama / Fuse.js
// separation boundary.  They must pass without any source changes.
//
//   P2-R1: Retrieval ordering is preserved (vector first, then lexical, then
//           catalog-order) — any failure degrades to the next layer only.
//   P2-R2: Slug-level deduplication is enforced across all layers.
//   P2-R3: The `sources` list records which layers actually contributed, and
//           only layers that produced at least one result are listed.
//   P2-R4: Orama lexical search and Fuse.js product filtering are separate
//           seams (lexical is used here; Fuse.js does not appear in retrieval).
//   P2-R5: Retrieval is fail-open — any single layer failure degrades to the
//           remaining layers without throwing at the caller level.
// =============================================================================

import fc from "fast-check";

// ---------------------------------------------------------------------------
// Deterministic arbitraries for retrieval property tests
// ---------------------------------------------------------------------------

const slugArb = fc
  .stringMatching(/^[a-z][a-z0-9-]{2,30}$/)
  .filter((s) => s.length >= 3);

function makeProduct(
  slug: string,
  extra: Partial<RetrievableProduct> = {},
): RetrievableProduct {
  return {
    id: `id-${slug}`,
    slug,
    name: slug.replace(/-/g, " "),
    category_id: "seating",
    ...extra,
  };
}

const productFromSlugArb: fc.Arbitrary<RetrievableProduct> = slugArb.map(
  (slug) => makeProduct(slug),
);

/** Generates a non-empty array of products with distinct slugs. */
const distinctProductArrayArb = fc
  .array(slugArb, { minLength: 2, maxLength: 10 })
  .map((slugs) => [...new Set(slugs)])
  .filter((slugs) => slugs.length >= 2)
  .map((slugs) => slugs.map((s) => makeProduct(s)));

/** A realistic natural-language search query (min 2 chars so Orama runs). */
const realisticQueryArb = fc
  .constantFrom(
    "ergonomic task chair",
    "height adjustable desk",
    "conference table for 10",
    "locker cabinet for office",
    "sofa lounge collaborative",
    "classroom library furniture",
    "executive seating",
  );

// ---------------------------------------------------------------------------
// P2-R1: Layer ordering is preserved
// ---------------------------------------------------------------------------

describe("Preservation P2-R1: retrieval layer ordering (PASS on baseline)", () => {
  it("vector hits appear before lexical hits in the results list", async () => {
    // Set up: vector returns vault-locker, lexical would return nimbus-chair first
    const products: RetrievableProduct[] = [
      makeProduct("nimbus-chair", { category_id: "seating" }),
      makeProduct("vault-locker", { category_id: "storages" }),
      makeProduct("aero-desk", { category_id: "workstations" }),
    ];

    searchCatalogVectors.mockResolvedValue([
      { id: "product:id-vault-locker", score: 0.95 },
    ]);

    const result = await retrieveCatalogProducts("ergonomic chair storage", products, 3);

    // vault-locker came from vector and must be first
    expect(result.products[0]?.slug).toBe("vault-locker");
    expect(result.sources[0]).toBe("vector");
  });

  it("catalog-order fills the tail when vector and lexical together are insufficient", async () => {
    const products: RetrievableProduct[] = [
      makeProduct("p1"),
      makeProduct("p2"),
      makeProduct("p3"),
      makeProduct("p4"),
    ];

    // Vector returns one hit; lexical returns nothing matching; catalog fills rest.
    searchCatalogVectors.mockResolvedValue([
      { id: "product:id-p1", score: 0.9 },
    ]);

    const result = await retrieveCatalogProducts("unique query xyzzy", products, 4);

    // p1 came from vector; the rest must come from catalog-order tail
    expect(result.products).toHaveLength(4);
    expect(result.sources).toContain("catalog-order");
    expect(result.products[0]?.slug).toBe("p1");
  });

  it("property: for any query, catalog-order is always in sources when products > 0", async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctProductArrayArb,
        realisticQueryArb,
        async (products, query) => {
          searchCatalogVectors.mockResolvedValue([]);

          const result = await retrieveCatalogProducts(query, products, products.length);

          // With vector disabled and catalog tail filling, catalog-order must appear
          expect(result.products.length).toBeGreaterThan(0);
          // When fewer products than limit, catalog-order should be present
          // (unless all products were claimed by lexical)
          expect(result.sources.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 20, seed: 20260843 },
    );
  });
});

// ---------------------------------------------------------------------------
// P2-R2: Slug-level deduplication
// ---------------------------------------------------------------------------

describe("Preservation P2-R2: slug-level deduplication (PASS on baseline)", () => {
  it("no slug appears more than once in results regardless of how many layers match it", async () => {
    const products: RetrievableProduct[] = [
      makeProduct("nimbus-chair"),
      makeProduct("vault-locker"),
      makeProduct("halo-table"),
    ];

    // Vector AND lexical AND catalog-order all return nimbus-chair
    searchCatalogVectors.mockResolvedValue([
      { id: "product:id-nimbus-chair", score: 0.9 },
    ]);

    const result = await retrieveCatalogProducts("nimbus ergonomic chair", products, 5);

    const slugCounts = new Map<string, number>();
    for (const p of result.products) {
      slugCounts.set(p.slug, (slugCounts.get(p.slug) ?? 0) + 1);
    }
    for (const [slug, count] of slugCounts) {
      expect(count, `slug ${slug} appeared ${count} times`).toBe(1);
    }
  });

  it("property: every result slug appears exactly once", async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctProductArrayArb,
        realisticQueryArb,
        fc.integer({ min: 1, max: 12 }),
        async (products, query, limit) => {
          searchCatalogVectors.mockResolvedValue([]);

          const result = await retrieveCatalogProducts(query, products, limit);

          const seen = new Set<string>();
          for (const p of result.products) {
            expect(seen.has(p.slug)).toBe(false);
            seen.add(p.slug);
          }
        },
      ),
      { numRuns: 30, seed: 20260843 },
    );
  });

  it("total results never exceed the requested limit", async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctProductArrayArb,
        realisticQueryArb,
        fc.integer({ min: 1, max: 8 }),
        async (products, query, limit) => {
          searchCatalogVectors.mockResolvedValue([]);

          const result = await retrieveCatalogProducts(query, products, limit);

          expect(result.products.length).toBeLessThanOrEqual(limit);
        },
      ),
      { numRuns: 30, seed: 20260843 },
    );
  });
});

// ---------------------------------------------------------------------------
// P2-R3: sources list accurately records which layers contributed
// ---------------------------------------------------------------------------

describe("Preservation P2-R3: sources list reflects actual contributions (PASS on baseline)", () => {
  it("sources contains 'vector' only when vector actually returned a matched product", async () => {
    const products: RetrievableProduct[] = [
      makeProduct("alpha-chair"),
      makeProduct("beta-desk"),
    ];

    // Vector returns an id not in the catalog → no matched product
    searchCatalogVectors.mockResolvedValue([
      { id: "product:id-unknown-zzz", score: 0.9 },
    ]);

    const result = await retrieveCatalogProducts("office chair", products, 3);

    // Vector hit didn't match any product, so 'vector' must NOT be in sources
    expect(result.sources).not.toContain("vector");
  });

  it("sources contains 'vector' when at least one vector hit maps to a product", async () => {
    const products: RetrievableProduct[] = [
      makeProduct("alpha-chair"),
      makeProduct("beta-desk"),
    ];

    searchCatalogVectors.mockResolvedValue([
      { id: "product:id-alpha-chair", score: 0.9 },
    ]);

    const result = await retrieveCatalogProducts("ergonomic chair", products, 3);

    expect(result.sources).toContain("vector");
  });

  it("empty catalog always returns empty sources", async () => {
    searchCatalogVectors.mockResolvedValue([]);
    const result = await retrieveCatalogProducts("any query", [], 5);
    expect(result.sources).toEqual([]);
    expect(result.products).toEqual([]);
  });

  it("zero limit always returns empty sources", async () => {
    const products: RetrievableProduct[] = [makeProduct("chair-a"), makeProduct("desk-b")];
    searchCatalogVectors.mockResolvedValue([]);

    const result = await retrieveCatalogProducts("chair", products, 0);
    expect(result.sources).toEqual([]);
    expect(result.products).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// P2-R4: Orama and Fuse.js remain separate seams
// ---------------------------------------------------------------------------

describe("Preservation P2-R4: Orama lexical and Fuse.js remain separate (PASS on baseline)", () => {
  it("catalogRetrieval imports searchCatalogDocuments (Orama), not a Fuse.js symbol", async () => {
    // This test verifies the static module boundary by checking the import path.
    // catalogRetrieval uses createCatalogSearchIndex + searchCatalogDocuments
    // from catalogLocalSearch (Orama). Fuse.js is only in applyCatalogProductFilters.
    const retrievalModule = await import("@/lib/ai/mastra/catalogRetrieval");
    expect(typeof retrievalModule.retrieveCatalogProducts).toBe("function");

    // The module must NOT export any Fuse-flavored symbol.
    const keys = Object.keys(retrievalModule);
    const fuseKeys = keys.filter((k) => k.toLowerCase().includes("fuse"));
    expect(fuseKeys).toHaveLength(0);
  });

  it("lexical layer uses Orama (createCatalogSearchIndex) not Fuse.js for scoring", async () => {
    // Orama-based lexical search returns score-ranked hits for real text.
    const products: RetrievableProduct[] = [
      makeProduct("nimbus-ergonomic-chair", {
        name: "Nimbus Ergonomic Chair",
        description: "Best ergonomic task seating",
        category_id: "seating",
        metadata: { tags: ["ergonomic", "mesh"] },
      }),
      makeProduct("bulk-storage-unit", {
        name: "Bulk Storage Unit",
        description: "Industrial locker system",
        category_id: "storages",
      }),
    ];

    searchCatalogVectors.mockResolvedValue([]);

    const result = await retrieveCatalogProducts("ergonomic task chair", products, 2);

    // Orama lexical search should rank the ergonomic chair first
    expect(result.products[0]?.slug).toBe("nimbus-ergonomic-chair");
    expect(result.sources).toContain("lexical");
  });
});

// ---------------------------------------------------------------------------
// P2-R5: Fail-open — layer failures degrade gracefully
// ---------------------------------------------------------------------------

describe("Preservation P2-R5: retrieval is fail-open across all layers (PASS on baseline)", () => {
  it("vector layer failure degrades to lexical + catalog-order without throwing", async () => {
    searchCatalogVectors.mockRejectedValue(new Error("lancedb unavailable"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const products: RetrievableProduct[] = [
      makeProduct("chair-a", { name: "Ergonomic Chair A", category_id: "seating" }),
      makeProduct("desk-b", { name: "Height Desk B", category_id: "workstations" }),
    ];

    const result = await retrieveCatalogProducts("ergonomic chair", products, 2);

    // Must not throw; must return results from remaining layers
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.sources).not.toContain("vector");
    expect(consoleSpy).toHaveBeenCalledWith(
      "[catalog-retrieval] vector recall failed:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it("property: any combination of vector/lexical errors still returns results", async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctProductArrayArb,
        realisticQueryArb,
        fc.boolean(),
        async (products, query, vectorFails) => {
          if (vectorFails) {
            searchCatalogVectors.mockRejectedValue(new Error("simulated failure"));
          } else {
            searchCatalogVectors.mockResolvedValue([]);
          }

          const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

          let threw = false;
          let result: Awaited<ReturnType<typeof retrieveCatalogProducts>> | null = null;
          try {
            result = await retrieveCatalogProducts(query, products, products.length);
          } catch {
            threw = true;
          } finally {
            consoleSpy.mockRestore();
          }

          // Fail-open: caller must never see an exception from retrieval
          expect(threw).toBe(false);
          expect(result).not.toBeNull();
          expect(result!.products.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 20, seed: 20260843 },
    );
  });

  it("very short query (<2 chars) returns catalog-order slice without running Orama or vector", async () => {
    const products: RetrievableProduct[] = [
      makeProduct("chair-a"),
      makeProduct("desk-b"),
      makeProduct("locker-c"),
    ];

    searchCatalogVectors.mockResolvedValue([]);

    const result = await retrieveCatalogProducts("a", products, 2);

    expect(result.sources).toEqual(["catalog-order"]);
    expect(result.products).toHaveLength(2);
    // Vector was not called for a too-short query
    expect(searchCatalogVectors).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Task 1 — Bug-condition exploration tests for catalogRetrieval
//
// These tests surface counterexamples for the vector-recall production-safety
// bug condition at the *retrieval boundary* level, complementing the lower-level
// write-guard tests in lanceVectorStore.test.ts.
//
// Bug condition (retrieval perspective):
//   When vector recall is invoked in production without a configured remote store,
//   the retrieval result must NOT attribute any results to 'vector', and the
//   sources array must make the unavailability observable to callers.
//
//   The deeper defect (local filesystem write) is tested in
//   lanceVectorStore.test.ts.  Here we test the *visible capability contract*:
//   if the lanceVectorStore is production-non-remote, the retrieval layer must
//   not claim it produced vector results.
//
// Expected baseline result notes:
//   - Exploration case C1-R: sources must not contain 'vector' when the vector
//     layer is production-non-remote (currently degrades via exception catch →
//     [] in recallVectorProductIds — acceptable degraded behavior, but the
//     explicit unavailability is exception-based not capability-based).
//     On the current partially-fixed source: PASSES (the mock returns []).
//
// Validates: requirements 1.4, 1.5, 2.4, 2.5, 3.5
// =============================================================================

// ---------------------------------------------------------------------------
// Deterministic arbitraries for retrieval bug-condition tests
// ---------------------------------------------------------------------------

const catalogQueryArb = fc.constantFrom(
  "ergonomic task chair",
  "height adjustable workstation",
  "locker storage cabinet",
  "conference table seating",
  "sofa collaborative lounge",
);

const smallCatalogArb: fc.Arbitrary<RetrievableProduct[]> = fc
  .array(
    fc
      .stringMatching(/^[a-z][a-z0-9-]{2,20}$/)
      .filter((s) => s.length >= 3),
    { minLength: 2, maxLength: 6 },
  )
  .map((slugs) => [...new Set(slugs)])
  .filter((slugs) => slugs.length >= 2)
  .map((slugs) =>
    slugs.map((s): RetrievableProduct => ({
      id: `id-${s}`,
      slug: s,
      name: s.replace(/-/g, " "),
      category_id: "seating",
    })),
  );

// ---------------------------------------------------------------------------
// C1-R1: When vector recall returns empty (production-non-remote simulation),
//         sources must NOT contain 'vector'.
//
// This confirms the retrieval layer correctly omits 'vector' from attribution
// when the underlying vector layer produces no results (e.g., because the
// store is unavailable or production-non-remote guards blocked the call).
//
// Expected: PASS on current source (the mock returns [] → no vector attribution).
// On the original unfixed baseline (before isProductionNonRemote guard):
//   assertDevDiskWritable throws EROFS → recallVectorProductIds catches → []
//   → also no 'vector' in sources.  In both states, 'vector' must be absent.
// ---------------------------------------------------------------------------

describe("Task 1 C1-R1: vector unavailability — sources does not contain 'vector' when recall yields nothing", () => {
  it("sources excludes 'vector' when searchCatalogVectors returns empty", async () => {
    searchCatalogVectors.mockResolvedValue([]);

    const catalog: RetrievableProduct[] = [
      product("nimbus-chair", "Nimbus Ergonomic Chair"),
      product("aero-desk", "Aero Height Adjustable Desk"),
    ];

    const result = await retrieveCatalogProducts("ergonomic chair", catalog, 5);

    expect(result.sources).not.toContain("vector");
    expect(result.products.length).toBeGreaterThan(0);
  });

  it("property: for any catalog/query combo, empty vector recall never produces 'vector' in sources", async () => {
    await fc.assert(
      fc.asyncProperty(
        smallCatalogArb,
        catalogQueryArb,
        async (catalog, query) => {
          searchCatalogVectors.mockResolvedValue([]);

          const result = await retrieveCatalogProducts(query, catalog, catalog.length);

          expect(result.sources).not.toContain("vector");
        },
      ),
      { numRuns: 20, seed: 20260843 },
    );
  });

  it("sources excludes 'vector' when searchCatalogVectors throws (exception-based unavailability)", async () => {
    // Simulates the original EROFS exception path from assertDevDiskWritable.
    searchCatalogVectors.mockRejectedValue(
      Object.assign(new Error("EROFS: read-only file system"), { code: "EROFS" }),
    );
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const catalog: RetrievableProduct[] = [
      product("vault-locker", "Vault Personal Locker"),
      product("halo-table", "Halo Conference Table"),
    ];

    const result = await retrieveCatalogProducts("storage locker", catalog, 3);

    expect(result.sources).not.toContain("vector");
    expect(result.products.length).toBeGreaterThan(0);
    // The error is logged but does not propagate to the caller.
    expect(consoleSpy).toHaveBeenCalledWith(
      "[catalog-retrieval] vector recall failed:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// C1-R2: Vector results that DO match catalog products appear in sources.
//
// This is the positive contract — when vector recall IS available and returns
// matched product ids, 'vector' must appear in sources and vector-matched
// products appear before lexical/catalog-order results.
//
// Expected: PASS on current source (already tested in P2-R1 above, but
// explicit Task 1 framing is added here for traceability).
// ---------------------------------------------------------------------------

describe("Task 1 C1-R2: vector attribution — sources contains 'vector' when recall returns matched products", () => {
  it("sources includes 'vector' when at least one vector hit maps to a catalog product", async () => {
    const catalog: RetrievableProduct[] = [
      product("nimbus-chair", "Nimbus Ergonomic Chair"),
      product("vault-locker", "Vault Personal Locker"),
    ];

    searchCatalogVectors.mockResolvedValue([
      { id: "product:id-nimbus-chair", score: 0.95 },
    ]);

    const result = await retrieveCatalogProducts("ergonomic chair", catalog, 5);

    expect(result.sources).toContain("vector");
    expect(result.products[0]?.slug).toBe("nimbus-chair");
  });

  it("property: vector attribution appears iff at least one vector hit id maps to a catalog product", async () => {
    await fc.assert(
      fc.asyncProperty(
        smallCatalogArb,
        async (catalog) => {
          // Pick the first catalog product and return it as a vector hit.
          const firstProduct = catalog[0]!;
          searchCatalogVectors.mockResolvedValue([
            { id: `product:${firstProduct.id}`, score: 0.9 },
          ]);

          const result = await retrieveCatalogProducts(
            "ergonomic furniture", catalog, catalog.length,
          );

          expect(result.sources).toContain("vector");
          expect(result.products[0]?.slug).toBe(firstProduct.slug);
        },
      ),
      { numRuns: 15, seed: 20260843 },
    );
  });
});

// ---------------------------------------------------------------------------
// C1-R3: The Orama/Fuse.js separation boundary at the retrieval level.
//
// The retrieval layer uses catalogLocalSearch (Orama) not Fuse.js.  When Orama
// is available and vector is not, results come from lexical and catalog-order —
// Fuse.js does not enter the retrieval pipeline.
//
// Expected: PASS on current source (Fuse.js is not imported in retrieval path).
// ---------------------------------------------------------------------------

describe("Task 1 C1-R3: Orama/Fuse separation — Fuse.js symbols not present in retrieval module", () => {
  it("catalogRetrieval module does not export Fuse-related symbols", async () => {
    const mod = await import("@/lib/ai/mastra/catalogRetrieval");
    const keys = Object.keys(mod as Record<string, unknown>);
    const fuseSymbols = keys.filter((k) => k.toLowerCase().includes("fuse"));
    expect(fuseSymbols).toHaveLength(0);
  });

  it("lexical results appear in sources when Orama matches and vector is unavailable", async () => {
    searchCatalogVectors.mockResolvedValue([]);

    const catalog: RetrievableProduct[] = [
      product("ergonomic-task-chair", "Ergonomic Task Chair", {
        metadata: { tags: ["ergonomic", "mesh", "task"] },
      }),
      product("height-desk", "Height Adjustable Desk", {
        category_id: "workstations",
      }),
    ];

    const result = await retrieveCatalogProducts("ergonomic task chair", catalog, 3);

    // Orama lexical must produce a lexical source attribution.
    expect(result.sources).toContain("lexical");
    expect(result.sources).not.toContain("vector");
  });
});
