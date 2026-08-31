import "server-only";

import { MastraVector } from "@mastra/core/vector";
import type {
  CreateIndexParams,
  DeleteIndexParams,
  DeleteVectorParams,
  DeleteVectorsParams,
  DescribeIndexParams,
  IndexStats,
  QueryResult,
  QueryVectorParams,
  UpdateVectorParams,
  UpsertVectorParams,
} from "@mastra/core/vector";

import { CATALOG_EMBEDDING_DIMENSION } from "./embedder";

export const CATALOG_VECTOR_INDEX_NAME = "catalog_nav";

/**
 * Cloudflare Vectorize-backed vector store for catalog semantic search.
 *
 * Uses the Vectorize REST API (not Worker binding) so it works from
 * both Next.js on Vercel and the Cloudflare Worker.
 *
 * Env vars required:
 *   CLOUDFLARE_ACCOUNT_ID — Cloudflare account ID
 *   CLOUDFLARE_API_TOKEN  — API token with Vectorize permissions
 *
 * Falls back to no-op when env vars are missing (same behavior as the
 * old LanceDB store in production).
 */

type VectorizeMatch = {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, unknown>;
};

type VectorizeQueryResponse = {
  result: {
    count: number;
    matches: VectorizeMatch[];
  };
  success: boolean;
  errors: unknown[];
};

type VectorizeUpsertResponse = {
  result: { count: number };
  success: boolean;
  errors: unknown[];
};

function getVectorizeConfig(): { accountId: string; apiToken: string; indexName: string } | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !apiToken) return null;
  return { accountId, apiToken, indexName: CATALOG_VECTOR_INDEX_NAME };
}

function vectorizeBaseUrl(accountId: string, indexName: string): string {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${indexName}`;
}

let store: VectorizeCatalogStore | null = null;

export function getCatalogVectorStore(): VectorizeCatalogStore {
  if (!store) {
    store = new VectorizeCatalogStore();
  }
  return store;
}

export class VectorizeCatalogStore extends MastraVector {
  constructor() {
    super({ id: "vectorize-catalog" });
  }

  private isConfigured(): boolean {
    return getVectorizeConfig() !== null;
  }

  async createIndex({ indexName, dimension }: CreateIndexParams): Promise<void> {
    // Vectorize indexes are created via wrangler CLI, not at runtime.
    // This is a no-op — the index must already exist.
    void indexName;
    void dimension;
  }

  async listIndexes(): Promise<string[]> {
    if (!this.isConfigured()) return [];
    return [CATALOG_VECTOR_INDEX_NAME];
  }

  async describeIndex({ indexName }: DescribeIndexParams): Promise<IndexStats> {
    void indexName;
    return {
      dimension: CATALOG_EMBEDDING_DIMENSION,
      count: 0,
      metric: "cosine",
    };
  }

  async deleteIndex({ indexName }: DeleteIndexParams): Promise<void> {
    // Vectorize indexes are managed via wrangler CLI, not at runtime.
    void indexName;
  }

  async upsert({ indexName, vectors, metadata = [], ids }: UpsertVectorParams): Promise<string[]> {
    const config = getVectorizeConfig();
    if (!config) return [];

    const ndjsonLines: string[] = [];
    for (let i = 0; i < vectors.length; i++) {
      const meta = metadata[i] ?? {};
      const id = ids?.[i] ?? (typeof meta.id === "string" ? meta.id : `catalog_${i}`);
      ndjsonLines.push(JSON.stringify({
        id,
        values: vectors[i],
        metadata: {
          title: typeof meta.title === "string" ? meta.title : "",
          keywords: typeof meta.keywords === "string" ? meta.keywords : "",
          href: typeof meta.href === "string" ? meta.href : "",
          type: typeof meta.type === "string" ? meta.type : "",
          text: typeof meta.text === "string" ? meta.text : "",
        },
      }));
    }

    if (ndjsonLines.length === 0) return [];

    try {
      const url = `${vectorizeBaseUrl(config.accountId, indexName || config.indexName)}/upsert`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/x-ndjson",
        },
        body: ndjsonLines.join("\n"),
      });

      if (!response.ok) {
        console.error("[vectorize] upsert failed:", response.status, await response.text());
        return [];
      }

      const data = (await response.json()) as VectorizeUpsertResponse;
      if (!data.success) {
        console.error("[vectorize] upsert errors:", data.errors);
        return [];
      }

      return ids ?? ndjsonLines.map((_, i) => `catalog_${i}`);
    } catch (err) {
      console.error("[vectorize] upsert error:", err);
      return [];
    }
  }

  async query({ indexName, queryVector, topK = 10 }: QueryVectorParams): Promise<QueryResult[]> {
    const config = getVectorizeConfig();
    if (!config || !queryVector?.length) return [];

    try {
      const url = `${vectorizeBaseUrl(config.accountId, indexName || config.indexName)}/query`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vector: queryVector,
          topK,
          returnValues: false,
          returnMetadata: "all",
        }),
      });

      if (!response.ok) {
        console.error("[vectorize] query failed:", response.status, await response.text());
        return [];
      }

      const data = (await response.json()) as VectorizeQueryResponse;
      if (!data.success) {
        console.error("[vectorize] query errors:", data.errors);
        return [];
      }

      return data.result.matches.map((match) => ({
        id: match.id,
        score: match.score,
        metadata: (match.metadata ?? {}) as Record<string, unknown>,
        document: typeof match.metadata?.text === "string" ? match.metadata.text as string : undefined,
      }));
    } catch (err) {
      console.error("[vectorize] query error:", err);
      return [];
    }
  }

  async updateVector(_params: UpdateVectorParams): Promise<void> {
    throw new Error("VectorizeCatalogStore.updateVector is not supported");
  }

  async deleteVector({ indexName, id }: DeleteVectorParams): Promise<void> {
    const config = getVectorizeConfig();
    if (!config) return;

    try {
      const url = `${vectorizeBaseUrl(config.accountId, indexName || config.indexName)}/delete-by-ids`;
      await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: [String(id)] }),
      });
    } catch (err) {
      console.error("[vectorize] deleteVector error:", err);
    }
  }

  async deleteVectors({ indexName, ids }: DeleteVectorsParams): Promise<void> {
    if (!ids?.length) return;
    const config = getVectorizeConfig();
    if (!config) return;

    try {
      const url = `${vectorizeBaseUrl(config.accountId, indexName || config.indexName)}/delete-by-ids`;
      await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: ids.map(String) }),
      });
    } catch (err) {
      console.error("[vectorize] deleteVectors error:", err);
    }
  }
}
