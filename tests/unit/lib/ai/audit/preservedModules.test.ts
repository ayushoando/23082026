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

// catalogRetrieval.ts has `import "server-only"`. Vitest node environment
// allows this import; the module resolves without Next.js middleware.
import { retrieveCatalogProducts } from "@/lib/ai/mastra/catalogRetrieval";

// ---------------------------------------------------------------------------
// 2. resolveAdvisorModelChain  (site/lib/ai/mastra/providers.ts)
// ---------------------------------------------------------------------------

import { resolveAdvisorModelChain } from "@/lib/ai/mastra/providers";

// ---------------------------------------------------------------------------
// 3. LanceCatalogVectorStore + CATALOG_VECTOR_INDEX_NAME
//    (site/lib/ai/mastra/lanceVectorStore.ts)
// ---------------------------------------------------------------------------

import {
  LanceCatalogVectorStore,
  CATALOG_VECTOR_INDEX_NAME,
} from "@/lib/ai/mastra/lanceVectorStore";

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
      // Verify arity — not invoking it (would require mocked LanceDB)
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
  // lanceVectorStore.ts
  // -------------------------------------------------------------------------

  describe("lanceVectorStore.ts", () => {
    it("LanceCatalogVectorStore is exported as a constructor (class)", () => {
      // A class is typeof 'function' in JS/TS
      expect(typeof LanceCatalogVectorStore).toBe("function");
    });

    it("LanceCatalogVectorStore can be instantiated (constructor is callable)", () => {
      // Pass a dummy URI so it does not attempt filesystem access
      const store = new LanceCatalogVectorStore(":memory:");
      expect(store).toBeDefined();
      expect(store).toBeInstanceOf(LanceCatalogVectorStore);
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
