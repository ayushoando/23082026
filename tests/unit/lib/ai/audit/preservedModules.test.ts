// @vitest-environment node
//
// Task 4.3: Unrelated-module preservation
//
// Assert that the safe remediations applied in Task 4.1 did not alter the
// exported contracts of modules unrelated to the remediated findings.
//
// Each import is taken from its canonical source module (not the barrel
// re-export) so the assertion is directly against the module under test.
//
// **Validates: Requirements 2.4**

import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// 1. retrieveCatalogProducts  (site/lib/ai/mastra/catalogRetrieval.ts)
// ---------------------------------------------------------------------------

import { retrieveCatalogProducts } from "@/lib/ai/mastra/catalogRetrieval";

// ---------------------------------------------------------------------------
// 2. resolveAdvisorModelChain  (site/lib/ai/mastra/providers.ts)
// ---------------------------------------------------------------------------

import { resolveAdvisorModelChain } from "@/lib/ai/mastra/providers";

// ---------------------------------------------------------------------------
// 3. VectorizeCatalogStore + CATALOG_VECTOR_INDEX_NAME
//    (site/lib/ai/mastra/vectorizeCatalogStore.ts)
//    Replaces the former LanceCatalogVectorStore after the LanceDB→Vectorize
//    migration.
// ---------------------------------------------------------------------------

import {
  VectorizeCatalogStore,
  CATALOG_VECTOR_INDEX_NAME,
} from "@/lib/ai/mastra/vectorizeCatalogStore";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Task 4.3: remediated modules do not alter unrelated module exports", () => {

  // -------------------------------------------------------------------------
  // catalogRetrieval.ts
  // -------------------------------------------------------------------------

  describe("catalogRetrieval.ts", () => {
    it("retrieveCatalogProducts is exported as a function", () => {
      expect(typeof retrieveCatalogProducts).toBe("function");
    });

    it("retrieveCatalogProducts accepts (query, products, limit) signature", () => {
      // Verify arity — not invoking it (would require mocked vector store)
      expect(retrieveCatalogProducts.length).toBeGreaterThanOrEqual(3);
    });
  });

  // -------------------------------------------------------------------------
  // providers.ts
  // -------------------------------------------------------------------------

  describe("providers.ts", () => {
    it("resolveAdvisorModelChain is exported as a function", () => {
      expect(typeof resolveAdvisorModelChain).toBe("function");
    });

    it("resolveAdvisorModelChain takes no required arguments", () => {
      expect(resolveAdvisorModelChain.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // vectorizeCatalogStore.ts (replaces lanceVectorStore.ts)
  // -------------------------------------------------------------------------

  describe("vectorizeCatalogStore.ts", () => {
    it("VectorizeCatalogStore is exported as a constructor (class)", () => {
      expect(typeof VectorizeCatalogStore).toBe("function");
    });

    it("VectorizeCatalogStore can be instantiated", () => {
      const store = new VectorizeCatalogStore();
      expect(store).toBeDefined();
      expect(store).toBeInstanceOf(VectorizeCatalogStore);
    });

    it('CATALOG_VECTOR_INDEX_NAME equals "catalog_nav"', () => {
      expect(CATALOG_VECTOR_INDEX_NAME).toBe("catalog_nav");
    });

    it("CATALOG_VECTOR_INDEX_NAME is a non-empty string", () => {
      expect(typeof CATALOG_VECTOR_INDEX_NAME).toBe("string");
      expect(CATALOG_VECTOR_INDEX_NAME.length).toBeGreaterThan(0);
    });
  });
});
