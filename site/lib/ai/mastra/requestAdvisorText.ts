import "server-only";

import type { Agent } from "@mastra/core/agent";

import { sanitizeUserInput } from "@/lib/ai/sanitizeUserInput";

import { getAdvisorAgent } from "./advisorAgent";
import { resolveAdvisorModelChain, toMastraModel, type AdvisorModelTarget } from "./providers";

export type AdvisorChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type RequestAdvisorMessagesOptions = {
  signal?: AbortSignal;
  stream?: boolean;
  onDelta?: (delta: string) => void;
  temperature?: number;
  jsonMode?: boolean;
};

type RequestAdvisorTextOptions = RequestAdvisorMessagesOptions;

type MastraMessageListInput = Parameters<Agent["generate"]>[0];

function toMastraMessages(messages: AdvisorChatMessage[]): MastraMessageListInput {
  return messages.map((message) => {
    switch (message.role) {
      case "system":
        return { role: "system", content: message.content };
      case "user":
        return { role: "user", content: message.content };
      case "assistant":
        return { role: "assistant", content: message.content };
      default: {
        const exhaustive: never = message.role;
        return exhaustive;
      }
    }
  });
}

function isAbortLikeError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; message?: string };
  return (
    e.name === "AbortError" ||
    String(e.message ?? "").toLowerCase().includes("aborted")
  );
}

async function requestAgentText(
  agent: Agent,
  target: AdvisorModelTarget,
  messages: AdvisorChatMessage[],
  options: RequestAdvisorMessagesOptions = {},
): Promise<string> {
  const executionOptions = {
    model: toMastraModel(target),
    abortSignal: options.signal,
    modelSettings: {
      temperature: options.temperature ?? 0.4,
    },
    ...(options.jsonMode
      ? {
          providerOptions: {
            google: {
              responseMimeType: "application/json",
            },
            openrouter: {
              response_format: { type: "json_object" as const },
            },
          },
        }
      : {}),
  };

  const mastraMessages = toMastraMessages(messages);

  if (options.stream) {
    const output = await agent.stream(mastraMessages, executionOptions);
    let raw = "";

    for await (const chunk of output.fullStream) {
      if (chunk.type !== "text-delta") {
        continue;
      }

      const delta = chunk.payload.text;
      if (!delta) {
        continue;
      }

      raw += delta;
      options.onDelta?.(delta);
    }

    return raw || (await output.text);
  }

  const output = await agent.generate(mastraMessages, executionOptions);
  return await output.text;
}

export async function requestAdvisorMessages(
  target: AdvisorModelTarget,
  messages: AdvisorChatMessage[],
  options: RequestAdvisorMessagesOptions = {},
): Promise<string> {
  // Legacy signature passes a single target. Use failover starting from that target.
  const chain = resolveAdvisorModelChain();
  const targetIndex = chain.findIndex((t) => t.label === target.label);
  const remainingChain = targetIndex >= 0 ? chain.slice(targetIndex) : chain;

  // AI-FIX-08: user-role content is interpolated into the model prompt.
  const safeMessages = messages.map((message) =>
    message.role === "user"
      ? { ...message, content: sanitizeUserInput(message.content) }
      : message,
  );

  const agent = await getAdvisorAgent("workspace");
  let lastError: unknown;

  for (const t of remainingChain) {
    try {
      return await requestAgentText(agent, t, safeMessages, options);
    } catch (err) {
      if (isAbortLikeError(err)) throw err;
      lastError = err;
      console.warn(`[advisor] ${t.label} failed, trying next:`, err);
    }
  }

  throw lastError;
}

export async function requestAdvisorText(
  target: AdvisorModelTarget,
  systemPrompt: string,
  query: string,
  options: RequestAdvisorTextOptions = {},
): Promise<string> {
  const chain = resolveAdvisorModelChain();
  const targetIndex = chain.findIndex((t) => t.label === target.label);
  const remainingChain = targetIndex >= 0 ? chain.slice(targetIndex) : chain;

  const agent = await getAdvisorAgent("catalog");
  let lastError: unknown;

  for (const t of remainingChain) {
    try {
      return await requestAgentText(
        agent,
        t,
        [
          { role: "system", content: systemPrompt },
          // AI-FIX-08: the query is user-supplied and enters the prompt directly.
          { role: "user", content: sanitizeUserInput(query) },
        ],
        { ...options, jsonMode: options.jsonMode ?? true },
      );
    } catch (err) {
      if (isAbortLikeError(err)) throw err;
      lastError = err;
      console.warn(`[advisor] ${t.label} failed, trying next:`, err);
    }
  }

  throw lastError;
}
