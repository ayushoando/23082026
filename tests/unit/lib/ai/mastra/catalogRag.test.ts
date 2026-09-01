/**
 * AI-FIX-02 (embedding-text builder) and AI-FIX-09 (chunked batch embedding)
 * for catalogRag.ts. The embedder, Vectorize store, and catalog loaders are
 * mocked — no network, no keys.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

const { embedV2, resolveMastraEmbeddingModel } = vi.hoisted(() => ({
  embedV2: vi.fn(),
  resolveMastraEmbeddingModel: vi.fn(),
}));

vi.mock("@mastra/core/vector", () => ({ embedV2 }));
vi.mock("@mastra/rag", () => ({ createVectorQueryTool: vi.fn() }));
vi.mock("@/lib/ai/mastra/embedder", () => ({
  isVectorRecallEnabled: vi.fn(() => true),
  resolveMastraEmbeddingModel,
}));
vi.mock("@/lib/ai/mastra/vectorizeCatalogStore", () => ({
  CATALOG_VECTOR_INDEX_NAME: "catalog_nav",
  getCatalogVectorStore: vi.fn(() => ({ upsert: vi.fn() })),
}));
vi.mock("@/lib/catalog/site/getProducts", () => ({ getCatalog: vi.fn() }));
vi.mock("@/lib/catalog/site/categories", () => ({
  buildRequestedCategoryCatalog: vi.fn((catalog: unknown[]) => catalog),
  getCatalogCategoryHref: vi.fn((id: string) => `/products/${id}`),
  getCatalogProductHref: vi.fn(
    (categoryId: string, slug: string) => `/products/${categoryId}/${slug}`,
  ),
}));

import {
  buildEmbeddingText,
  embedTexts,
  EMBEDDING_BATCH_SIZE,
} from "@/lib/ai/mastra/catalogRag";

describe("buildEmbeddingText (AI-FIX-02)", () => {
  it("includes name, description, category, features, tags, and extras", () => {
    const text = buildEmbeddingText({
      name: "Nimbus Ergonomic Task Chair",
      description: "Mesh task chair with adjustable arms.",
      category: "Seating",
      features: ["Adjustable lumbar support"],
      tags: ["ergonomic", "mesh"],
      extras: ["nimbus-chair"],
    });

    expect(text).toBe(
      "Nimbus Ergonomic Task Chair Mesh task chair with adjustable arms. " +
        "Seating Adjustable lumbar support ergonomic mesh nimbus-chair",
    );
  });

  it("truncates the description to ~300 characters", () => {
    const text = buildEmbeddingText({
      name: "Long",
      description: "d".repeat(500),
    });

    expect(text).toBe(`Long ${"d".repeat(300)}`);
  });

  it("omits missing and whitespace-only parts", () => {
    expect(
      buildEmbeddingText({
        name: "All Products",
        description: "   ",
        features: ["  "],
        tags: [],
      }),
    ).toBe("All Products");
  });
});

describe("embedTexts (AI-FIX-09)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when no embedding model is configured", async () => {
    resolveMastraEmbeddingModel.mockReturnValue(null);
    await expect(embedTexts(["a", "b"])).resolves.toEqual([]);
    expect(embedV2).not.toHaveBeenCalled();
  });

  it("embeds every text and preserves input order", async () => {
    resolveMastraEmbeddingModel.mockReturnValue({});
    embedV2.mockImplementation(async ({ value }: { value: string }) => ({
      embedding: [Number(value)],
    }));

    const texts = ["0", "1", "2", "3"];
    const result = await embedTexts(texts);

    expect(result).toEqual([[0], [1], [2], [3]]);
    expect(embedV2).toHaveBeenCalledTimes(4);
  });

  it("runs at most EMBEDDING_BATCH_SIZE embed calls concurrently per chunk", async () => {
    resolveMastraEmbeddingModel.mockReturnValue({});

    let active = 0;
    let maxActive = 0;
    embedV2.mockImplementation(async ({ value }: { value: string }) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 0));
      active -= 1;
      return { embedding: [Number(value)] };
    });

    const texts = Array.from({ length: 45 }, (_, i) => String(i));
    const result = await embedTexts(texts);

    expect(result).toEqual(texts.map((t) => [Number(t)]));
    expect(maxActive).toBe(EMBEDDING_BATCH_SIZE);
  });

  it("uses chunks of 20", () => {
    expect(EMBEDDING_BATCH_SIZE).toBe(20);
  });
});
