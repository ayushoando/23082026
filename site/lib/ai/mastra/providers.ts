import "server-only";

import { createAmazonBedrock, type AmazonBedrockProvider } from "@ai-sdk/amazon-bedrock";

import { env } from "@/lib/env.server";
import { SITE_URL } from "@/lib/siteUrl";

export type AdvisorProviderId = "gemini" | "openrouter" | "openai" | "bedrock";

type AdvisorRouterTarget = {
  provider: Exclude<AdvisorProviderId, "bedrock">;
  label: string;
  id: `${string}/${string}`;
  url?: string;
  apiKey?: string;
  headers?: Record<string, string>;
} | {
  provider: Exclude<AdvisorProviderId, "bedrock">;
  label: string;
  providerId: string;
  modelId: string;
  url?: string;
  apiKey?: string;
  headers?: Record<string, string>;
};

type BedrockLanguageModel = ReturnType<AmazonBedrockProvider["languageModel"]>;

type AdvisorBedrockTarget = {
  provider: "bedrock";
  label: string;
  model: BedrockLanguageModel;
};

export type AdvisorModelTarget = AdvisorRouterTarget | AdvisorBedrockTarget;

// ---------------------------------------------------------------------------
// Allowlist — only provider/label pairs listed here may enter the model chain.
// ---------------------------------------------------------------------------

type AllowlistEntry = {
  provider: AdvisorProviderId;
  label: string;
};

export const APPROVED_PROVIDER_MODELS: readonly AllowlistEntry[] = [
  { provider: "gemini",     label: "gemini" },
  { provider: "openrouter", label: "openrouter" },
  { provider: "openrouter", label: "openrouter-backup" },
  { provider: "openai",     label: "openai" },
  { provider: "bedrock",    label: "bedrock" },
] as const;

export function isAllowlisted(provider: AdvisorProviderId, label: string): boolean {
  return APPROVED_PROVIDER_MODELS.some(
    (entry) => entry.provider === provider && entry.label === label,
  );
}

export function filterAllowlistedChain(chain: AdvisorModelTarget[]): AdvisorModelTarget[] {
  return chain.filter((target) => isAllowlisted(target.provider, target.label));
}

const DEFAULT_OPENROUTER_MODEL = env.OPENROUTER_MODEL || "openrouter/auto";

function toOpenRouterModelId(model: string): `${string}/${string}` {
  return model.includes("/") ? (model as `${string}/${string}`) : `openrouter/${model}`;
}

function toOpenAIModelId(model: string): `${string}/${string}` {
  return `openai/${model}` as `${string}/${string}`;
}

function pushOpenRouterTarget(
  chain: AdvisorModelTarget[],
  apiKey: string,
  label: string,
) {
  chain.push({
    provider: "openrouter",
    label,
    id: toOpenRouterModelId(DEFAULT_OPENROUTER_MODEL),
    url: "https://openrouter.ai/api/v1",
    apiKey,
    headers: {
      "HTTP-Referer": SITE_URL,
      "X-Title": "One and Only",
    },
  });
}

function pushOpenAITarget(chain: AdvisorModelTarget[], apiKey: string) {
  chain.push({
    provider: "openai",
    label: "openai",
    id: toOpenAIModelId(env.OPENAI_MODEL?.trim() || "gpt-4o-mini"),
    apiKey,
  });
}

function createBedrockTarget(): AdvisorBedrockTarget | undefined {
  const region = env.AWS_REGION?.trim();
  const modelId = env.BEDROCK_MODEL?.trim() || "us.amazon.nova-lite-v1:0";
  const bearerToken = env.AWS_BEARER_TOKEN_BEDROCK?.trim();

  if (!region) {
    return undefined;
  }

  if (bearerToken) {
    const provider = createAmazonBedrock({ region, apiKey: bearerToken });
    return {
      provider: "bedrock",
      label: "bedrock",
      model: provider.languageModel(modelId),
    };
  }

  const accessKeyId = env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) {
    return undefined;
  }

  const provider = createAmazonBedrock({
    region,
    accessKeyId,
    secretAccessKey,
    sessionToken: env.AWS_SESSION_TOKEN?.trim(),
  });

  return {
    provider: "bedrock",
    label: "bedrock",
    model: provider.languageModel(modelId),
  };
}

export function toMastraModel(target: AdvisorModelTarget | undefined) {
  if (!target) {
    return undefined;
  }
  return "model" in target ? target.model : target;
}

/**
 * Build the LLM provider chain in priority order:
 *
 *   1. **Gemini** (free tier — 15 RPM, 1M tokens/day on Flash models)
 *   2. **OpenRouter** primary key (paid or free models)
 *   3. **OpenRouter** backup key
 *   4. **OpenAI** (paid fallback)
 *   5. **Bedrock** (paid fallback)
 *
 * Each provider is only added when its API key is configured AND it appears
 * in the APPROVED_PROVIDER_MODELS allowlist.
 */
export function resolveAdvisorModelChain(): AdvisorModelTarget[] {
  const chain: AdvisorModelTarget[] = [];

  // 1. Gemini — primary (free tier)
  const geminiKey = env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    const candidate: AdvisorModelTarget = {
      provider: "gemini",
      label: "gemini",
      providerId: "google",
      modelId: env.GEMINI_MODEL || "gemini-2.5-flash",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: geminiKey,
    };
    if (isAllowlisted(candidate.provider, candidate.label)) {
      chain.push(candidate);
    }
  }

  // 2. OpenRouter — backup
  const primaryKey = env.OPENROUTER_API_KEY_PRIMARY?.trim();
  if (primaryKey && isAllowlisted("openrouter", "openrouter")) {
    pushOpenRouterTarget(chain, primaryKey, "openrouter");
  }

  const backupKey = env.OPENROUTER_API_KEY_BACKUP?.trim();
  if (backupKey && isAllowlisted("openrouter", "openrouter-backup")) {
    pushOpenRouterTarget(chain, backupKey, "openrouter-backup");
  }

  // 3. OpenAI — paid fallback (only if explicitly configured)
  const openAiKey = env.OPENAI_API_KEY?.trim();
  if (openAiKey && isAllowlisted("openai", "openai")) {
    pushOpenAITarget(chain, openAiKey);
  }

  // 4. Bedrock — paid fallback (only if explicitly configured)
  const bedrockTarget = createBedrockTarget();
  if (bedrockTarget && isAllowlisted(bedrockTarget.provider, bedrockTarget.label)) {
    chain.push(bedrockTarget);
  }

  return chain;
}
