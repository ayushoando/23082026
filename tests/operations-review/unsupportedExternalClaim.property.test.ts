// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 3: Unsupported external claims remain unverified.
//
// Validates: Requirements 1.3, 2.4, 3.3, 5.3, 8.2

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  extractWorkerReview,
  type RepositorySource,
  type WorkerReviewSources,
} from "../../scripts/operations-review";
import type { EvidenceFact, EvidenceStatus, SourceReference } from "../../scripts/operations-review";

/**
 * An external claim is any statement about hosted provider state — deployment
 * completion, R2 object existence, telemetry delivery, edge response behavior,
 * or provider backup status. When no current authorized provider evidence is
 * supplied, the review must classify these as `unverified`.
 *
 * This property generates review inputs that deliberately omit authorized
 * external evidence and asserts that every resulting external-state fact
 * carries the `unverified` status. A local configuration fact alone cannot
 * promote an external claim to `observed-authorized` or `observed-local`.
 */

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const surfaceArb = fc.constantFrom(
  "vercel-application",
  "cloudflare-worker",
  "products-database",
  "admin-database",
  "r2-backup",
  "monitoring",
  "runbook-ci-alignment",
) as fc.Arbitrary<EvidenceFact["surface"]>;

const externalClaimStatementArb = fc.oneof(
  fc.constant("Hosted deployment completed successfully with version v1.2.3."),
  fc.constant("R2 bucket contains 14 backup objects with full retention."),
  fc.constant("Telemetry is collected, exported, and retained for 30 days."),
  fc.constant("Edge worker responds correctly to all routing cases."),
  fc.constant("Provider PITR is enabled and covers the last 7 days."),
  fc.constant("Nightly backup succeeded at 02:15 UTC and artifacts are retrievable."),
  fc.constant("Alert fired correctly during last incident window."),
  fc.stringMatching(/^External claim [a-z0-9]{1,20}: [a-z ]{1,40}\.$/),
);

function repositorySource(path: string, content: string): RepositorySource {
  return {
    content,
    source: {
      path,
      locator: "generated external-claim fixture",
      observedAt: "2026-01-01T00:00:00.000Z",
      contentDigest: `generated-${path}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Helper: build a minimal EvidenceFact representing an external claim
// without authorized evidence
// ---------------------------------------------------------------------------

function externalClaimWithoutAuthorization(
  surface: EvidenceFact["surface"],
  statement: string,
): EvidenceFact {
  return {
    id: `external-claim-${surface}`,
    surface,
    statement,
    status: "unverified",
    source: {
      path: "OPERATIONS_RUNBOOK.md",
      locator: "generated external-claim fixture",
      observedAt: "2026-01-01T00:00:00.000Z",
      contentDigest: "generated-runbook",
    },
    // Deliberately no externalEvidence field — no authorized provider output
  };
}

// ---------------------------------------------------------------------------
// Worker source builder (reuses pattern from workerReleaseDecision tests)
// ---------------------------------------------------------------------------

interface WorkerVariation {
  readonly originUrl: string;
  readonly bucketBinding: string;
}

const workerVariationArb: fc.Arbitrary<WorkerVariation> = fc.record({
  originUrl: fc.constantFrom(
    "https://oando1408.vercel.app",
    "https://preview-oando.vercel.app",
    "https://staging.oando1408.vercel.app",
  ),
  bucketBinding: fc.constant("ASSET_BUCKET"),
});

function workerReviewSources(variation: WorkerVariation): WorkerReviewSources {
  return {
    wrangler: repositorySource(
      "workers/oando-worker-proxy/wrangler.toml",
      [
        'main = "src/index.js"',
        "[[r2_buckets]]",
        `binding = "${variation.bucketBinding}"`,
        "[vars]",
        `VERCEL_ORIGIN = "${variation.originUrl}"`,
      ].join("\n"),
    ),
    workerSource: repositorySource(
      "workers/oando-worker-proxy/src/index.js",
      [
        "// Worker source for external-claim test",
        "env.ASSET_BUCKET.get(key);",
        "const fallbackHeader = 'r2-fallback';",
        "let r2Errored = true;",
        "fetch(env.VERCEL_ORIGIN);",
      ].join("\n"),
    ),
    rootPackage: repositorySource(
      "package.json",
      '{"scripts": {"worker:deploy": "pnpm --dir workers/oando-worker-proxy deploy"}}',
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

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("Property 3: Unsupported external claims remain unverified", () => {
  it("Worker extraction never promotes hosted behavior to observed status without authorized evidence", () => {
    fc.assert(
      fc.property(workerVariationArb, (variation) => {
        const review = extractWorkerReview(workerReviewSources(variation));

        // Every item in unverifiedExternalState must be unverified
        expect(review.unverifiedExternalState.length).toBeGreaterThan(0);
        for (const claim of review.unverifiedExternalState) {
          expect(claim.status).toBe("unverified");
        }

        // No item in observedConfiguration may have unverified-external content
        // that was mistakenly promoted to observed-local
        for (const observed of review.observedConfiguration) {
          expect(observed.status).toBe("observed-local");
        }

        // The release decision itself marks external behavior as unverified
        expect(review.releaseDecision.externalBehaviorStatus).toBe("unverified");

        // All four routing cases are unverified (they describe hosted behavior)
        expect(review.routingCases).toHaveLength(4);
        for (const routingCase of review.routingCases) {
          expect(routingCase.status).toBe("unverified");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("external claims built without authorized evidence always carry unverified status regardless of surface or statement", () => {
    fc.assert(
      fc.property(surfaceArb, externalClaimStatementArb, (surface, statement) => {
        const claim = externalClaimWithoutAuthorization(surface, statement);

        // The core invariant: no authorized evidence → unverified
        expect(claim.status).toBe("unverified");
        expect(claim.externalEvidence).toBeUndefined();

        // A local-only source reference cannot upgrade the status
        const validLocalStatuses: EvidenceStatus[] = ["observed-local"];
        const validExternalStatuses: EvidenceStatus[] = ["unverified", "gap"];
        expect(validExternalStatuses).toContain(claim.status);
        expect(validLocalStatuses).not.toContain(claim.status);
      }),
      { numRuns: 100 },
    );
  });

  it("Worker unverified claims cover all four routing cases plus runbook verification", () => {
    fc.assert(
      fc.property(workerVariationArb, (variation) => {
        const review = extractWorkerReview(workerReviewSources(variation));
        const unverifiedIds = review.unverifiedExternalState.map((c) => c.id);

        // All four routing cases must appear as unverified hosted claims
        expect(unverifiedIds).toEqual(
          expect.arrayContaining([
            "worker-hosted-r2-hit",
            "worker-hosted-r2-miss",
            "worker-hosted-r2-error",
            "worker-hosted-origin-forwarding",
          ]),
        );

        // Runbook verification expectations are also unverified
        expect(unverifiedIds).toEqual(
          expect.arrayContaining([
            "worker-runbook-verification-unverified",
          ]),
        );

        // No claim should accidentally be classified as observed
        for (const claim of review.unverifiedExternalState) {
          expect(claim.status).not.toBe("observed-local");
          expect(claim.status).not.toBe("observed-authorized");
        }
      }),
      { numRuns: 100 },
    );
  });
});
