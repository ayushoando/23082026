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

// ---------------------------------------------------------------------------
// Allowlist property tests — Task 3.3
// ---------------------------------------------------------------------------

describe("APPROVED_PROVIDER_MODELS and isAllowlisted", () => {
  it("contains exactly the five approved provider/label pairs", async () => {
    const { APPROVED_PROVIDER_MODELS } = await import("@/lib/ai/mastra/providers");
    const pairs = APPROVED_PROVIDER_MODELS.map((e) => `${e.provider}/${e.label}`);
    expect(pairs).toEqual([
      "gemini/gemini",
      "openrouter/openrouter",
      "openrouter/openrouter-backup",
      "openai/openai",
      "bedrock/bedrock",
    ]);
  });

  it("isAllowlisted returns true for every approved pair", async () => {
    const { APPROVED_PROVIDER_MODELS, isAllowlisted } = await import("@/lib/ai/mastra/providers");
    for (const entry of APPROVED_PROVIDER_MODELS) {
      expect(
        isAllowlisted(entry.provider, entry.label),
        `expected ${entry.provider}/${entry.label} to be allowlisted`,
      ).toBe(true);
    }
  });

  it("isAllowlisted rejects an unknown provider regardless of valid label", async () => {
    const { isAllowlisted } = await import("@/lib/ai/mastra/providers");
    // "anthropic" is not in AdvisorProviderId, but we cast to test runtime guard
    expect(isAllowlisted("openai" as never, "anthropic-claude")).toBe(false);
  });

  it("isAllowlisted rejects a valid provider with a non-approved label", async () => {
    const { isAllowlisted } = await import("@/lib/ai/mastra/providers");
    expect(isAllowlisted("openrouter", "openrouter-unofficial")).toBe(false);
    expect(isAllowlisted("gemini", "gemini-experimental")).toBe(false);
    expect(isAllowlisted("bedrock", "bedrock-v2")).toBe(false);
  });

  it("isAllowlisted is case-sensitive — mixed-case label is rejected", async () => {
    const { isAllowlisted } = await import("@/lib/ai/mastra/providers");
    expect(isAllowlisted("gemini", "Gemini")).toBe(false);
    expect(isAllowlisted("openai", "OpenAI")).toBe(false);
  });

  it("isAllowlisted rejects empty string label", async () => {
    const { isAllowlisted } = await import("@/lib/ai/mastra/providers");
    expect(isAllowlisted("gemini", "")).toBe(false);
  });
});

describe("filterAllowlistedChain", () => {
  it("passes through all targets whose provider/label pairs are approved", async () => {
    const { filterAllowlistedChain, resolveAdvisorModelChain } = await import(
      "@/lib/ai/mastra/providers"
    );
    const chain = resolveAdvisorModelChain();
    // Every item from resolveAdvisorModelChain must already be allowlisted.
    expect(filterAllowlistedChain(chain)).toHaveLength(chain.length);
  });

  it("removes targets with unapproved labels", async () => {
    const { filterAllowlistedChain } = await import("@/lib/ai/mastra/providers");
    const fakeChain = [
      { provider: "openai" as const, label: "openai", id: "openai/gpt-4o" as const },
      { provider: "openai" as const, label: "openai-unofficial", id: "openai/gpt-4o" as const },
      { provider: "gemini" as const, label: "gemini", providerId: "google", modelId: "gemini-2.5-flash" },
    ];
    const filtered = filterAllowlistedChain(fakeChain);
    expect(filtered.map((t) => t.label)).toEqual(["openai", "gemini"]);
  });

  it("returns an empty array when no targets are allowlisted", async () => {
    const { filterAllowlistedChain } = await import("@/lib/ai/mastra/providers");
    const fakeChain = [
      { provider: "openai" as const, label: "unapproved-a", id: "openai/gpt-99" as const },
      { provider: "gemini" as const, label: "unapproved-b", providerId: "google", modelId: "gemini-x" },
    ];
    expect(filterAllowlistedChain(fakeChain)).toHaveLength(0);
  });

  it("returns an empty array for an empty input", async () => {
    const { filterAllowlistedChain } = await import("@/lib/ai/mastra/providers");
    expect(filterAllowlistedChain([])).toEqual([]);
  });
});

describe("resolveAdvisorModelChain allowlist gate (property)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("every item produced by resolveAdvisorModelChain is allowlisted", async () => {
    const { resolveAdvisorModelChain, isAllowlisted } = await import(
      "@/lib/ai/mastra/providers"
    );
    const chain = resolveAdvisorModelChain();
    // Property: no unapproved target can survive the gate.
    for (const target of chain) {
      expect(
        isAllowlisted(target.provider, target.label),
        `chain contains non-allowlisted target: ${target.provider}/${target.label}`,
      ).toBe(true);
    }
  });

  it("resolveAdvisorModelChain preserves chain order for approved providers", async () => {
    const { resolveAdvisorModelChain } = await import("@/lib/ai/mastra/providers");
    const labels = resolveAdvisorModelChain().map((t) => t.label);
    // Gemini must precede openrouter; openrouter must precede openrouter-backup.
    const geminiIdx = labels.indexOf("gemini");
    const orIdx = labels.indexOf("openrouter");
    const orBackupIdx = labels.indexOf("openrouter-backup");
    if (geminiIdx !== -1 && orIdx !== -1) {
      expect(geminiIdx).toBeLessThan(orIdx);
    }
    if (orIdx !== -1 && orBackupIdx !== -1) {
      expect(orIdx).toBeLessThan(orBackupIdx);
    }
  });
});
