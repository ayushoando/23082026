// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 5: Worker changes retain independent release decisions.
//
// Validates: Requirements 3.2

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  extractWorkerReview,
  type RepositorySource,
  type WorkerReviewSources,
} from "../../scripts/operations-review";

interface ReleaseChangeContext {
  readonly workerChangeId: string;
  readonly vercelDeploymentCommand: string | null;
}

const releaseChangeContextArb: fc.Arbitrary<ReleaseChangeContext> = fc.record({
  workerChangeId: fc.stringMatching(/^[a-z][a-z0-9-]{0,24}$/),
  vercelDeploymentCommand: fc.option(
    fc.constantFrom("vercel --prod", "vercel --prebuilt", "vercel --prod --force"),
    { nil: null },
  ),
});

function repositorySource(path: string, content: string): RepositorySource {
  return {
    content,
    source: {
      path,
      locator: "generated independent-release fixture",
      observedAt: "2026-01-01T00:00:00.000Z",
      contentDigest: `generated-${path}`,
    },
  };
}

function workerReviewSources(context: ReleaseChangeContext): WorkerReviewSources {
  const vercelRoute =
    context.vercelDeploymentCommand === null
      ? ""
      : `, \"vercel:prod\": \"${context.vercelDeploymentCommand}\"`;

  return {
    wrangler: repositorySource(
      "workers/oando-worker-proxy/wrangler.toml",
      [
        'main = "src/index.js"',
        "[[r2_buckets]]",
        'binding = "ASSET_BUCKET"',
        "[vars]",
        'VERCEL_ORIGIN = "https://oando1408.vercel.app"',
      ].join("\n"),
    ),
    workerSource: repositorySource(
      "workers/oando-worker-proxy/src/index.js",
      [
        `// reviewed Worker change: ${context.workerChangeId}`,
        "env.ASSET_BUCKET.get(key);",
        "const fallbackHeader = 'r2-fallback';",
        "let r2Errored = true;",
        "fetch(env.VERCEL_ORIGIN);",
      ].join("\n"),
    ),
    rootPackage: repositorySource(
      "package.json",
      `{\"scripts\": {\"worker:deploy\": \"pnpm --dir workers/oando-worker-proxy deploy\"${vercelRoute}}}`,
    ),
    workerPackage: repositorySource(
      "workers/oando-worker-proxy/package.json",
      '{"scripts": {"deploy": "wrangler deploy"}}',
    ),
    runbook: repositorySource(
      "OPERATIONS_RUNBOOK.md",
      "Worker release route: pnpm run worker:deploy",
    ),
  };
}

describe("Property 5: Worker changes retain independent release decisions", () => {
  it("gives every Worker change its own release decision regardless of a Vercel route change", () => {
    fc.assert(
      fc.property(releaseChangeContextArb, (context) => {
        const review = extractWorkerReview(workerReviewSources(context));
        const decision = review.releaseDecision;

        expect(decision.surface).toBe("cloudflare-worker");
        expect(decision.releaseState).toBe("pending-authorization");
        expect(decision.approvalPoint).toContain("separately approve");
        expect(decision.approvalPoint).toContain(
          "Vercel release approval or state does not satisfy this approval",
        );
        expect(decision.rollbackOrRecoveryProcedure).toContain("Worker-only deploy route");
        expect(decision.expectedVerificationEvidence.length).toBeGreaterThan(0);
        expect(decision.expectedVerificationEvidence).toEqual(
          expect.arrayContaining([
            expect.stringContaining("R2 hit"),
            expect.stringContaining("R2 miss"),
            expect.stringContaining("R2-error"),
            expect.stringContaining("origin forwarding"),
          ]),
        );
        expect(review.deploymentOperation).toMatchObject({
          operation: "cloudflare-worker-deployment",
          targetSurface: "cloudflare-worker",
          classification: "protected-operation",
          executionStatus: "pending-authorization",
        });
        expect(review.deploymentOperation.expectedEvidence).toEqual(
          decision.expectedVerificationEvidence,
        );
      }),
      { numRuns: 100 },
    );
  });
});
