import "server-only";

import fs from "node:fs";
import path from "node:path";

import { connect, type Connection, type Table } from "@lancedb/lancedb";
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

import { assertDevDiskWritable } from "@/lib/persistence/assertDevDiskWritable";
import { CATALOG_EMBEDDING_DIMENSION } from "./embedder";

export const CATALOG_VECTOR_INDEX_NAME = "catalog_nav";

type LanceCatalogRow = {
  id: string;
  vector: number[];
  text: string;
  title: string;
  keywords: string;
  href: string;
  type: string;
};

function sanitizeTableName(indexName: string): string {
  return indexName.replace(/[^a-zA-Z0-9_]/g, "_");
}

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

function resolveLanceDbUri(): string {
  const configured = process.env.LANCE_DB_URI?.trim();
  if (configured) {
    return configured;
  }
  return path.join(process.cwd(), ".data", "lancedb", "catalog");
}

let store: LanceCatalogVectorStore | null = null;

export function getLanceCatalogVectorStore(): LanceCatalogVectorStore {
  if (!store) {
    store = new LanceCatalogVectorStore();
  }
  return store;
}

export class LanceCatalogVectorStore extends MastraVector {
  private connection: Promise<Connection> | null = null;
  private readonly uri: string;
  private readonly indexDimensions = new Map<string, number>();

  constructor(uri = resolveLanceDbUri()) {
    super({ id: "lance-catalog-vector" });
    this.uri = uri;
  }

  private isRemoteUri(uri: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(uri);
  }

  /**
   * Returns true when the current environment is production-like AND the
   * configured URI is not a remote store URI.  In that state any attempt to
   * connect would call `assertDevDiskWritable()` (which throws EROFS) and
   * then try a local filesystem write — both of which are illegal in
   * production.  Callers should return an "unavailable" sentinel value
   * instead of calling `conn()`.
   */
  private isProductionNonRemote(): boolean {
    const env = process.env;
    // Block local filesystem writes only in production. Allow in development
    // and test environments so that disk-mode tests and local dev work correctly.
    const isProduction = env.NODE_ENV === "production";
    const isBypass = env.DEV_AUTH_BYPASS === "1";
    return isProduction && !isBypass && !this.isRemoteUri(this.uri);
  }

  private async conn(): Promise<Connection> {
    if (!this.connection) {
      if (!this.isRemoteUri(this.uri)) {
        assertDevDiskWritable();
        fs.mkdirSync(this.uri, { recursive: true });
      }
      // Store a temporary reference; clear it on rejection so the next
      // caller can retry rather than re-receiving the same rejected promise.
      const pending = connect(this.uri);
      this.connection = pending;
      pending.catch(() => {
        // Only clear if we are still holding this same promise — a concurrent
        // caller may have already replaced it with a new attempt.
        if (this.connection === pending) {
          this.connection = null;
        }
      });
    }
    // this.connection is non-null here: either it was set above (new pending)
    // or it was already non-null entering the method.  The .catch() callback
    // is always async and cannot run synchronously before this return.
    return this.connection!;
  }

  private async openTable(indexName: string): Promise<Table | null> {
    const conn = await this.conn();
    const name = sanitizeTableName(indexName);
    if (!(await conn.tableNames()).includes(name)) {
      return null;
    }
    return conn.openTable(name);
  }

  async createIndex({ indexName, dimension }: CreateIndexParams): Promise<void> {
    if (this.isProductionNonRemote()) {
      return;
    }
    const conn = await this.conn();
    const name = sanitizeTableName(indexName);
    if ((await conn.tableNames()).includes(name)) {
      this.indexDimensions.set(indexName, dimension);
      return;
    }

    const seed: LanceCatalogRow = {
      id: "__seed__",
      vector: Array.from({ length: dimension }, () => 0),
      text: "",
      title: "",
      keywords: "",
      href: "",
      type: "",
    };
    const created = await conn.createTable(name, [seed], { mode: "overwrite" });
    await created.delete("id = '__seed__'");
    this.indexDimensions.set(indexName, dimension);
  }

  async listIndexes(): Promise<string[]> {
    if (this.isProductionNonRemote()) {
      return [];
    }
    const conn = await this.conn();
    return conn.tableNames();
  }

  async describeIndex({ indexName }: DescribeIndexParams): Promise<IndexStats> {
    if (this.isProductionNonRemote()) {
      return {
        dimension: this.indexDimensions.get(indexName) ?? CATALOG_EMBEDDING_DIMENSION,
        count: 0,
        metric: "cosine",
      };
    }
    const tbl = await this.openTable(indexName);
    if (!tbl) {
      return {
        dimension: this.indexDimensions.get(indexName) ?? CATALOG_EMBEDDING_DIMENSION,
        count: 0,
        metric: "cosine",
      };
    }

    return {
      dimension: this.indexDimensions.get(indexName) ?? CATALOG_EMBEDDING_DIMENSION,
      count: await tbl.countRows(),
      metric: "cosine",
    };
  }

  async deleteIndex({ indexName }: DeleteIndexParams): Promise<void> {
    if (this.isProductionNonRemote()) {
      return;
    }
    const conn = await this.conn();
    const name = sanitizeTableName(indexName);
    if ((await conn.tableNames()).includes(name)) {
      await conn.dropTable(name);
    }
    this.indexDimensions.delete(indexName);
  }

  async upsert({ indexName, vectors, metadata = [], ids }: UpsertVectorParams): Promise<string[]> {
    if (this.isProductionNonRemote()) {
      return [];
    }
    const dimension = vectors[0]?.length ?? CATALOG_EMBEDDING_DIMENSION;
    await this.createIndex({ indexName, dimension });

    const tbl = await this.openTable(indexName);
    if (!tbl) {
      throw new Error(`Lance index missing after create: ${indexName}`);
    }

    const rows: LanceCatalogRow[] = vectors.map((vector, index) => {
      const meta = metadata[index] ?? {};
      const id =
        ids?.[index] ?? (typeof meta.id === "string" ? meta.id : `catalog_${index}`);
      const title = typeof meta.title === "string" ? meta.title : "";
      const keywords = typeof meta.keywords === "string" ? meta.keywords : "";
      const href = typeof meta.href === "string" ? meta.href : "";
      const type = typeof meta.type === "string" ? meta.type : "";
      const text =
        typeof meta.text === "string" ? meta.text : [title, keywords].filter(Boolean).join(" ");

      return { id, vector, text, title, keywords, href, type };
    });

    if (rows.length === 0) {
      return [];
    }

    const idList = rows.map((row) => `'${escapeSqlLiteral(row.id)}'`).join(", ");
    await tbl.delete(`id IN (${idList})`);
    await tbl.add(rows, { mode: "append" });

    return rows.map((row) => row.id);
  }

  async query(params: QueryVectorParams): Promise<QueryResult[]> {
    const { indexName, queryVector, topK = 10 } = params;
    if (!queryVector?.length) {
      return [];
    }

    if (this.isProductionNonRemote()) {
      return [];
    }

    const tbl = await this.openTable(indexName);
    if (!tbl) {
      return [];
    }

    const results = await tbl.vectorSearch(queryVector).limit(topK).toArray();
    return results.map((row: Record<string, unknown>, index: number) => {
      const distance = typeof row._distance === "number" ? row._distance : index;
      return {
        id: String(row.id ?? index),
        score: 1 / (1 + distance),
        metadata: {
          title: row.title,
          keywords: row.keywords,
          href: row.href,
          type: row.type,
        },
        document: typeof row.text === "string" ? row.text : undefined,
      };
    });
  }

  async updateVector(_params: UpdateVectorParams): Promise<void> {
    throw new Error("LanceCatalogVectorStore.updateVector is not supported");
  }

  async deleteVector({ indexName, id }: DeleteVectorParams): Promise<void> {
    if (this.isProductionNonRemote()) {
      return;
    }
    const tbl = await this.openTable(indexName);
    if (!tbl) {
      return;
    }
    await tbl.delete(`id = '${escapeSqlLiteral(String(id))}'`);
  }

  async deleteVectors({ indexName, ids }: DeleteVectorsParams): Promise<void> {
    if (!ids?.length) {
      return;
    }
    if (this.isProductionNonRemote()) {
      return;
    }
    const tbl = await this.openTable(indexName);
    if (!tbl) {
      return;
    }
    const idList = ids.map((id) => `'${escapeSqlLiteral(String(id))}'`).join(", ");
    await tbl.delete(`id IN (${idList})`);
  }
}
