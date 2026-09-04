import "server-only";

import { Mastra } from "@mastra/core";
import { InMemoryStore } from "@mastra/core/storage";
import { createAdvisorAgent } from "./advisorAgent";

export {
  resolveAdvisorModelChain,
  type AdvisorModelTarget,
  type AdvisorProviderId,
} from "./providers";
export {
  requestAdvisorMessages,
  requestAdvisorText,
  type AdvisorChatMessage,
} from "./requestAdvisorText";
export {
  createCatalogSearchIndex,
  searchCatalogDocuments,
  type CatalogSearchDocument,
  type CatalogSearchHit,
} from "./catalogLocalSearch";
export {
  ensureCatalogVectorIndex,
  searchCatalogVectors,
  createCatalogVectorQueryTool,
  type CatalogVectorDocument,
} from "./catalogRag";
export {
  retrieveCatalogProducts,
  type CatalogRetrievalResult,
  type RetrievableProduct,
} from "./catalogRetrieval";
export { getAdvisorMemory } from "./advisorMemory";
export {
  createAdvisorAgent,
  getAdvisorAgent,
  type AdvisorRole,
} from "./advisorAgent";
export { resolveEmbedderModel, resolveMastraEmbeddingModel, isVectorRecallEnabled } from "./embedder";

export const mastra = new Mastra({
  storage: new InMemoryStore({ id: "oando-mastra-storage" }),
  agents: {
    workspaceAdvisor: createAdvisorAgent("workspace"),
    catalogAdvisor: createAdvisorAgent("catalog"),
  },
});

