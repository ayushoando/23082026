import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env.server", () => ({
  env: {
    GEMINI_API_KEY: "test-gemini",
    GEMINI_MODEL: undefined,
    OPENROUTER_API_KEY_PRIMARY: "or-primary",
    OPENROUTER_API_KEY_BACKUP: "or-backup",
    OPENROUTER_MODEL: undefined,
  },
}));

vi.mock("@/lib/siteUrl", () => ({
  SITE_URL: "https://oando.co.in",
}));

describe("resolveAdvisorModelChain", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("prefers Gemini then OpenRouter primary and backup", async () => {
    const { resolveAdvisorModelChain } = await import("@/lib/ai/mastra/providers");
    const chain = resolveAdvisorModelChain();
    expect(chain.map((item) => item.label)).toEqual(["gemini", "openrouter", "openrouter-backup"]);
    expect(chain[0]).toMatchObject({
      provider: "gemini",
      providerId: "google",
      modelId: "gemini-2.5-flash",
    });
    expect(chain[1]).toMatchObject({
      provider: "openrouter",
      id: "openrouter/auto",
    });
  });
});
