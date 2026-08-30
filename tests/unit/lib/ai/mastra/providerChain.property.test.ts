/**
 * Feature: ai-implementation-audit
 * Property 8: Provider chain is a credential-gated subsequence of the canonical order
 *
 * Task 8.1 — verifies resolveAdvisorModelChain() produces only providers whose
 * credentials are configured, in canonical order, with no duplicates beyond what
 * the source allows (openrouter primary + backup are two distinct labels).
 *
 * Strategy: use vi.resetModules() + dynamic import per iteration so each run
 * sees a fresh env mock with an independently generated credential config.
 */

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";

// Canonical order of labels as specified in the audit property.
const CANONICAL_ORDER = [
  "gemini",
  "openrouter",
  "openrouter-backup",
  "openai",
  "bedrock",
] as const;

type CanonicalLabel = (typeof CANONICAL_ORDER)[number];

/**
 * Returns true iff `sub` is a subsequence of `seq` (order-preserving, not
 * necessarily contiguous).
 */
function isSubsequence(sub: string[], seq: readonly string[]): boolean {
  let si = 0;
  for (const element of seq) {
    if (si < sub.length && sub[si] === element) {
      si++;
    }
  }
  return si === sub.length;
}

/** Credential config for one fast-check run. */
interface CredentialConfig {
  GEMINI_API_KEY: string | undefined;
  OPENROUTER_API_KEY_PRIMARY: string | undefined;
  OPENROUTER_API_KEY_BACKUP: string | undefined;
  OPENAI_API_KEY: string | undefined;
  AWS_REGION: string | undefined;
  AWS_ACCESS_KEY_ID: string | undefined;
  AWS_SECRET_ACCESS_KEY: string | undefined;
}

/** Returns which canonical labels should be present given the config. */
function expectedLabels(cfg: CredentialConfig): CanonicalLabel[] {
  const labels: CanonicalLabel[] = [];
  if (cfg.GEMINI_API_KEY) labels.push("gemini");
  if (cfg.OPENROUTER_API_KEY_PRIMARY) labels.push("openrouter");
  if (cfg.OPENROUTER_API_KEY_BACKUP) labels.push("openrouter-backup");
  if (cfg.OPENAI_API_KEY) labels.push("openai");
  if (cfg.AWS_REGION && cfg.AWS_ACCESS_KEY_ID && cfg.AWS_SECRET_ACCESS_KEY) {
    labels.push("bedrock");
  }
  return labels;
}

// Arbitrary that generates a CredentialConfig where each credential is
// independently present (non-empty string) or absent (undefined).
const credentialConfigArb: fc.Arbitrary<CredentialConfig> = fc.record({
  GEMINI_API_KEY: fc.oneof(fc.constant(undefined), fc.constant("gemini-key")),
  OPENROUTER_API_KEY_PRIMARY: fc.oneof(fc.constant(undefined), fc.constant("or-primary")),
  OPENROUTER_API_KEY_BACKUP: fc.oneof(fc.constant(undefined), fc.constant("or-backup")),
  OPENAI_API_KEY: fc.oneof(fc.constant(undefined), fc.constant("openai-key")),
  // AWS Bedrock requires all three: region, accessKeyId, secretAccessKey.
  // We model "all present" vs "all absent" because the source logic requires all three.
  AWS_REGION: fc.oneof(fc.constant(undefined), fc.constant("us-east-1")),
  AWS_ACCESS_KEY_ID: fc.oneof(fc.constant(undefined), fc.constant("aws-key-id")),
  AWS_SECRET_ACCESS_KEY: fc.oneof(fc.constant(undefined), fc.constant("aws-secret")),
});

describe("Property 8: Provider chain is a credential-gated subsequence of the canonical order", () => {
  it("result is a subsequence of canonical order with correct credential gating (≥100 iterations)", async () => {
    await fc.assert(
      fc.asyncProperty(credentialConfigArb, async (cfg) => {
        vi.resetModules();

        vi.doMock("@/lib/env.server", () => ({
          env: {
            GEMINI_API_KEY: cfg.GEMINI_API_KEY,
            GEMINI_MODEL: undefined,
            OPENROUTER_API_KEY_PRIMARY: cfg.OPENROUTER_API_KEY_PRIMARY,
            OPENROUTER_API_KEY_BACKUP: cfg.OPENROUTER_API_KEY_BACKUP,
            OPENROUTER_MODEL: undefined,
            OPENAI_API_KEY: cfg.OPENAI_API_KEY,
            OPENAI_MODEL: undefined,
            AWS_REGION: cfg.AWS_REGION,
            AWS_ACCESS_KEY_ID: cfg.AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY: cfg.AWS_SECRET_ACCESS_KEY,
            AWS_BEARER_TOKEN_BEDROCK: undefined,
            AWS_SESSION_TOKEN: undefined,
            BEDROCK_MODEL: undefined,
          },
        }));

        vi.doMock("@/lib/siteUrl", () => ({
          SITE_URL: "https://test.example.com",
        }));

        // Mock the Bedrock SDK to avoid real AWS SDK initialization.
        vi.doMock("@ai-sdk/amazon-bedrock", () => ({
          createAmazonBedrock: vi.fn(() => ({
            languageModel: vi.fn(() => ({ modelId: "mocked-bedrock-model" })),
          })),
        }));

        const { resolveAdvisorModelChain } = await import(
          "@/lib/ai/mastra/providers"
        );

        const chain = resolveAdvisorModelChain();
        const labels = chain.map((t) => t.label);
        const expected = expectedLabels(cfg);

        // Assertion 1: result is a subsequence of the canonical order.
        expect(
          isSubsequence(labels, CANONICAL_ORDER),
          `chain labels [${labels.join(", ")}] are not a subsequence of canonical order`,
        ).toBe(true);

        // Assertion 2: each expected label is present in the chain.
        for (const lbl of expected) {
          expect(
            labels,
            `expected label "${lbl}" to be present for config ${JSON.stringify(cfg)}`,
          ).toContain(lbl);
        }

        // Assertion 3: labels not expected are absent from the chain.
        const unexpectedLabels = (CANONICAL_ORDER as readonly string[]).filter(
          (lbl) => !(expected as string[]).includes(lbl),
        );
        for (const lbl of unexpectedLabels) {
          expect(
            labels,
            `label "${lbl}" should be absent for config ${JSON.stringify(cfg)}`,
          ).not.toContain(lbl);
        }

        // Assertion 4: each label appears at most once (no duplicates beyond
        // the canonical set itself — primary and backup are distinct labels).
        const seen = new Set<string>();
        for (const lbl of labels) {
          expect(
            seen.has(lbl),
            `duplicate label "${lbl}" in chain [${labels.join(", ")}]`,
          ).toBe(false);
          seen.add(lbl);
        }
      }),
      { numRuns: 100, seed: 20260843 },
    );
  });
});
