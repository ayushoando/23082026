import { beforeEach, describe, expect, it, vi } from "vitest";

const mkdirSync = vi.fn();
const assertDevDiskWritable = vi.fn();
const connect = vi.fn();

vi.mock("node:fs", () => ({
  default: { mkdirSync },
  mkdirSync,
}));

vi.mock("@/lib/persistence/assertDevDiskWritable", () => ({
  assertDevDiskWritable,
}));

vi.mock("@lancedb/lancedb", () => ({
  connect,
}));

vi.mock("@mastra/core/vector", () => {
  class MastraVector {
    constructor(_opts: { id: string }) {}
  }
  return { MastraVector };
});

describe("LanceCatalogVectorStore", () => {
  beforeEach(() => {
    vi.resetModules();
    mkdirSync.mockReset();
    assertDevDiskWritable.mockReset();
    connect.mockReset();
    connect.mockResolvedValue({
      tableNames: async () => [],
      createTable: async () => ({ delete: async () => undefined }),
      openTable: async () => null,
      dropTable: async () => undefined,
    });
  });

  it("exports catalog_nav and 768-d embedder constant", async () => {
    const { CATALOG_VECTOR_INDEX_NAME } = await import("@/lib/ai/mastra/lanceVectorStore");
    const { CATALOG_EMBEDDING_DIMENSION } = await import("@/lib/ai/mastra/embedder");
    expect(CATALOG_VECTOR_INDEX_NAME).toBe("catalog_nav");
    expect(CATALOG_EMBEDDING_DIMENSION).toBe(768);
  });

  it("guards local mkdir with assertDevDiskWritable", async () => {
    const { LanceCatalogVectorStore } = await import("@/lib/ai/mastra/lanceVectorStore");
    const store = new LanceCatalogVectorStore("E:/tmp/lancedb-test");
    await store.listIndexes();
    expect(assertDevDiskWritable).toHaveBeenCalled();
    expect(mkdirSync).toHaveBeenCalledWith("E:/tmp/lancedb-test", { recursive: true });
    expect(connect).toHaveBeenCalledWith("E:/tmp/lancedb-test");
  });

  it("skips mkdir for remote URIs", async () => {
    const { LanceCatalogVectorStore } = await import("@/lib/ai/mastra/lanceVectorStore");
    const store = new LanceCatalogVectorStore("s3://bucket/catalog");
    await store.listIndexes();
    expect(assertDevDiskWritable).not.toHaveBeenCalled();
    expect(mkdirSync).not.toHaveBeenCalled();
    expect(connect).toHaveBeenCalledWith("s3://bucket/catalog");
  });
});
