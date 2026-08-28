import "server-only";

import type { Agent } from "@mastra/core/agent";

import { resolveAdvisorModelChain, toMastraModel } from "./providers";
import { getAdvisorMemory } from "./advisorMemory";
import { createCatalogVectorQueryTool, ensureCatalogVectorIndex } from "./catalogRag";

let advisorAgent: Agent | null = null;

export async function getAdvisorAgent() {
  if (advisorAgent) {
    return advisorAgent;
  }

  await ensureCatalogVectorIndex();

  const { Agent } = await import("@mastra/core/agent");
  const [primaryTarget] = resolveAdvisorModelChain();
  const catalogSearchTool = createCatalogVectorQueryTool();

  advisorAgent = new Agent({
    id: "workspace-advisor",
    name: "Workspace Advisor",
    instructions:
      "You are a helpful assistant for One & Only Furniture workspace planning and configuration. Use catalog_vector_search when catalog or product context would improve layout guidance.",
    model: toMastraModel(primaryTarget) ?? "google/gemini-2.5-flash",
    memory: getAdvisorMemory(),
    ...(catalogSearchTool
      ? {
          tools: {
            catalog_vector_search: catalogSearchTool,
          },
        }
      : {}),
  });

  return advisorAgent;
}
