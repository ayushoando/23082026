import "server-only";

import { Agent } from "@mastra/core/agent";

import { resolveAdvisorModelChain, toMastraModel } from "./providers";
import { getAdvisorMemory } from "./advisorMemory";
import { createCatalogVectorQueryTool, ensureCatalogVectorIndex } from "./catalogRag";

/**
 * Unified advisor agent factory. Two roles share the same memory, tools, and
 * model chain — only the system instruction differs.
 *
 * "workspace" — Planner AI advisor (layout guidance, space planning).
 * "catalog"   — Catalog AI advisor (product recommendations, configurator).
 */

export type AdvisorRole = "workspace" | "catalog";

const INSTRUCTIONS: Record<AdvisorRole, string> = {
  workspace:
    "You are a helpful assistant for One & Only Furniture workspace planning and configuration. " +
    "Use catalog_vector_search when catalog or product context would improve layout guidance.",
  catalog:
    "You are an enterprise workspace engineering consultant for One & Only Furniture. " +
    "Use catalog_vector_search when product or page context would improve the answer.",
};

const agents = new Map<AdvisorRole, Agent>();

export function createAdvisorAgent(role: AdvisorRole = "workspace"): Agent {
  const cached = agents.get(role);
  if (cached) return cached;

  const chain = resolveAdvisorModelChain();
  const catalogSearchTool = createCatalogVectorQueryTool();

  // Use the first available provider. Failover happens at the request level
  // (requestAdvisorText.ts), not here — the agent is a singleton, but the
  // model target is passed per-call via execution options.
  const agent = new Agent({
    id: `${role}-advisor`,
    name: role === "catalog" ? "Catalog Advisor" : "Workspace Advisor",
    instructions: INSTRUCTIONS[role],
    model: toMastraModel(chain[0]) ?? "google/gemini-3.6-flash",
    memory: getAdvisorMemory(),
    ...(catalogSearchTool
      ? { tools: { catalog_vector_search: catalogSearchTool } }
      : {}),
  });

  agents.set(role, agent);
  return agent;
}

export async function getAdvisorAgent(role: AdvisorRole = "workspace"): Promise<Agent> {
  const cached = agents.get(role);
  if (cached) return cached;

  await ensureCatalogVectorIndex();
  return createAdvisorAgent(role);
}

/** @deprecated Use getAdvisorAgent("workspace") */
export const getWorkspaceAdvisorAgent = () => getAdvisorAgent("workspace");
/** @deprecated Use getAdvisorAgent("catalog") */
export const getCatalogAdvisorAgent = () => getAdvisorAgent("catalog");

