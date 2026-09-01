import "server-only";

import { InMemoryStore } from "@mastra/core/storage";
import { Memory } from "@mastra/memory";

import { isVectorRecallEnabled, resolveEmbedderModel, resolveMastraEmbeddingModel } from "./embedder";
import { getCatalogVectorStore } from "./vectorizeCatalogStore";

let advisorMemory: Memory | null = null;

export function getAdvisorMemory(): Memory {
  if (advisorMemory) {
    return advisorMemory;
  }

  const embedder = resolveEmbedderModel();
  const embeddingModel = resolveMastraEmbeddingModel();
  const vectorEnabled = isVectorRecallEnabled();

  advisorMemory = new Memory({
    // Intentional (AI-FIX-06 Option B): both advisor routes resend the full
    // message history on every request, so this store is request-scoped agent
    // glue only — durable (Postgres) conversation storage is not required.
    storage: new InMemoryStore({ id: "advisor-memory-storage" }),
    ...(vectorEnabled && embeddingModel
      ? {
          vector: getCatalogVectorStore(),
          embedder: embedder ?? undefined,
        }
      : {}),
    options: {
      lastMessages: 20,
      semanticRecall: vectorEnabled
        ? {
            topK: 5,
            messageRange: 2,
          }
        : false,
    },
  });

  return advisorMemory;
}
