import { AuthorizationGuard } from "../authorizationGuard";
import type {
  EvidenceFact,
  ReleaseDecision,
  SourceReference,
} from "../models";
import type { RepositorySource } from "../sourceAdapter";

const WORKER_SURFACE = "cloudflare-worker" as const;

export type WorkerRoutingCaseId =
  | "r2-hit"
  | "r2-miss"
  | "r2-error"
  | "origin-forwarding";

export interface WorkerRoutingCase {
  readonly id: WorkerRoutingCaseId;
  readonly expectedConfiguredBehavior: string;
  readonly status: "unverified";
  readonly source: SourceReference;
}

export interface WorkerReleaseDecision extends ReleaseDecision {
  readonly surface: "cloudflare-worker";
  readonly sourceReferences: readonly SourceReference[];
  readonly releaseState: "pending-authorization";
  readonly externalBehaviorStatus: "unverified";
}

export interface WorkerReviewSources {
  readonly wrangler: RepositorySource;
  readonly workerSource: RepositorySource;
  readonly rootPackage: RepositorySource;
  readonly workerPackage: RepositorySource;
  readonly runbook: RepositorySource;
}

export interface WorkerReviewExtraction {
  readonly observedConfiguration: readonly EvidenceFact[];
  readonly unverifiedExternalState: readonly EvidenceFact[];
  readonly routingCases: readonly WorkerRoutingCase[];
  readonly releaseDecision: WorkerReleaseDecision;
  readonly deploymentOperation: ReturnType<AuthorizationGuard["classify"]>;
}

function sourceAt(source: RepositorySource, locator: string): SourceReference {
  return { ...source.source, locator };
}

function requireText(source: RepositorySource, text: string, description: string): void {
  if (!source.content.includes(text)) {
    throw new Error(`${description} was not found at ${source.source.path}: ${text}`);
  }
}

function fact(
  id: string,
  statement: string,
  source: RepositorySource,
  locator: string,
  status: EvidenceFact["status"] = "observed-local",
): EvidenceFact {
  return {
    id,
    surface: WORKER_SURFACE,
    statement,
    status,
    source: sourceAt(source, locator),
  };
}

/**
 * Extracts the Cloudflare Worker as an independent release surface.
 *
 * This function only parses caller-supplied repository text. It has no network,
 * provider, process, environment, deployment, or output-writing capability.
 */
export function extractWorkerReview(sources: WorkerReviewSources): WorkerReviewExtraction {
  requireText(sources.wrangler, 'main = "src/index.js"', "Worker entry point");
  requireText(sources.wrangler, 'binding = "ASSET_BUCKET"', "R2 binding");
  requireText(sources.wrangler, "VERCEL_ORIGIN", "Vercel origin variable");
  requireText(sources.rootPackage, '"worker:deploy"', "Root Worker deploy route");
  requireText(sources.workerPackage, '"deploy": "wrangler deploy"', "Nested Worker deploy route");
  requireText(sources.runbook, "pnpm run worker:deploy", "Runbook Worker deploy route");
  requireText(sources.workerSource, "env.ASSET_BUCKET.get(key)", "R2 asset lookup");
  requireText(sources.workerSource, "'r2-fallback'", "R2 miss fallback response");
  requireText(sources.workerSource, "r2Errored = true", "R2 error fallback state");
  requireText(sources.workerSource, "env.VERCEL_ORIGIN", "Origin forwarding dependency");

  const observedConfiguration: EvidenceFact[] = [
    fact(
      "worker-entry-point",
      "The Worker entry point is configured as src/index.js.",
      sources.wrangler,
      'main = "src/index.js"',
    ),
    fact(
      "worker-root-deployment-route",
      "The root worker:deploy route delegates to the Worker package deploy route.",
      sources.rootPackage,
      'scripts["worker:deploy"] = "pnpm --dir workers/oando-worker-proxy deploy"',
    ),
    fact(
      "worker-package-deployment-route",
      "The Worker package deploy route invokes wrangler deploy.",
      sources.workerPackage,
      'scripts.deploy = "wrangler deploy"',
    ),
    fact(
      "worker-runbook-deployment-route",
      "The runbook documents pnpm run worker:deploy as a manual Cloudflare Worker deployment.",
      sources.runbook,
      "§1 Edge worker: pnpm run worker:deploy",
    ),
    fact(
      "worker-r2-binding",
      "The Worker config binds the oando-asset-cdn R2 bucket as ASSET_BUCKET.",
      sources.wrangler,
      '[[r2_buckets]] binding = "ASSET_BUCKET"; bucket_name = "oando-asset-cdn"',
    ),
    fact(
      "worker-vercel-origin",
      "The Worker depends on VERCEL_ORIGIN and the repository config supplies https://oando1408.vercel.app.",
      sources.wrangler,
      '[vars] VERCEL_ORIGIN = "https://oando1408.vercel.app"',
    ),
  ];

  const routingCases: WorkerRoutingCase[] = [
    {
      id: "r2-hit",
      expectedConfiguredBehavior:
        "For an asset path, return the first R2 object found with x-oando-proxy: r2 and immutable cache control.",
      status: "unverified",
      source: sourceAt(
        sources.workerSource,
        "fetch(): isAssetPath lookup; if (object) response with x-oando-proxy = r2",
      ),
    },
    {
      id: "r2-miss",
      expectedConfiguredBehavior:
        "For an asset-path miss without a primary R2 error, try marketing/brand/logos/logo-sharp.png; return it with x-oando-proxy: r2-fallback, or return 404 with x-oando-proxy: r2-miss. This branch does not forward to Vercel.",
      status: "unverified",
      source: sourceAt(
        sources.workerSource,
        "fetch(): if (isAssetPath && !assetObject && !r2Errored) fallback lookup and 404 response",
      ),
    },
    {
      id: "r2-error",
      expectedConfiguredBehavior:
        "When the primary R2 asset lookup throws, mark r2Errored and continue to Vercel-origin forwarding for resilience.",
      status: "unverified",
      source: sourceAt(
        sources.workerSource,
        "fetch(): primary ASSET_BUCKET try/catch sets r2Errored = true; execution continues to origin",
      ),
    },
    {
      id: "origin-forwarding",
      expectedConfiguredBehavior:
        "For non-asset requests and primary R2 errors, construct the upstream URL from VERCEL_ORIGIN (with a repository fallback), set origin and forwarded headers, fetch upstream, and return the rebuilt response.",
      status: "unverified",
      source: sourceAt(
        sources.workerSource,
        "fetch(): // Fall back to Vercel through fetch(upstreamRequest) and final Response",
      ),
    },
  ];

  const unverifiedExternalState = routingCases.map((routingCase) => ({
    id: `worker-hosted-${routingCase.id}`,
    surface: WORKER_SURFACE,
    statement: `Hosted edge behavior is unverified: ${routingCase.expectedConfiguredBehavior}`,
    status: "unverified" as const,
    source: routingCase.source,
  }));

  unverifiedExternalState.push(
    fact(
      "worker-runbook-verification-unverified",
      "The runbook's expected dead-asset and valid-asset responses are verification expectations only; no current authorized provider evidence was supplied.",
      sources.runbook,
      "§1 Edge worker: Verify dead asset path and valid asset response headers",
      "unverified",
    ),
  );

  const releaseDecision: WorkerReleaseDecision = {
    surface: WORKER_SURFACE,
    approvalPoint:
      "Before pnpm run worker:deploy, the Worker release owner must separately approve the Cloudflare Worker target, reviewed diff, rollback version, and evidence plan; Vercel release approval or state does not satisfy this approval.",
    rollbackOrRecoveryProcedure:
      "Stop the Worker release on failed verification. With separate explicit authorization, redeploy the last known-good Worker source/configuration using the Worker-only deploy route; if safe redeployment is unavailable, apply the owner-approved Cloudflare Worker rollback/recovery mechanism. Re-run all four Worker cases and retain deployment/version and response evidence before declaring recovery.",
    expectedVerificationEvidence: [
      "Authorized Worker deployment output identifying the Cloudflare Worker target and deployed version.",
      "Authorized response evidence for an R2 hit showing the expected object response and x-oando-proxy: r2.",
      "Authorized response evidence for an R2 miss showing either r2-fallback or r2-miss without origin forwarding.",
      "Authorized controlled R2-error evidence showing origin fallback, with the test boundary and cleanup recorded.",
      "Authorized non-asset response evidence showing Worker origin forwarding and the expected proxy header.",
      "Rollback or recovery evidence identifying the restored Worker version and repeated four-case results.",
    ],
    sourceReferences: [
      sourceAt(sources.rootPackage, 'scripts["worker:deploy"]'),
      sourceAt(sources.workerPackage, 'scripts.deploy = "wrangler deploy"'),
      sourceAt(sources.runbook, "§1 Edge worker deployment and verification"),
      sourceAt(sources.workerSource, "fetch(): R2 and Vercel-origin routing branches"),
    ],
    releaseState: "pending-authorization",
    externalBehaviorStatus: "unverified",
  };

  const deploymentOperation = new AuthorizationGuard().classify({
    action: "cloudflare-worker-deployment",
    targetSurface: WORKER_SURFACE,
    expectedEvidence: releaseDecision.expectedVerificationEvidence,
  });

  return {
    observedConfiguration,
    unverifiedExternalState,
    routingCases,
    releaseDecision,
    deploymentOperation,
  };
}
