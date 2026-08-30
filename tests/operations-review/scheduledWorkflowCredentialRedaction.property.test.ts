// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 7: Scheduled-workflow credentials are redacted.
//
// Validates: Requirements 5.4

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  extractR2WorkflowReview,
  type R2WorkflowReviewSources,
} from "../../scripts/operations-review";
import type { EvidenceFact, Gap, ProtectedOperation, SourceReference } from "../../scripts/operations-review";

/**
 * The R2 backup workflow YAML contains secret references whose *values* must
 * never appear in review output. Only the secret *names* (keys) are permitted.
 *
 * This property generates workflow YAML sources containing synthetic
 * secret-like values — AWS-style keys, Supabase tokens, bearer tokens,
 * random hex strings, and base64 blobs — and asserts that:
 *  1. No extracted string field ever contains the raw secret value.
 *  2. Secret names (e.g. `R2_ACCESS_KEY_ID`, `SUPABASE_DB_URL`) ARE
 *     preserved in the `secretNames` array.
 *  3. Redaction applies consistently across all output collections:
 *     observedConfiguration, unverifiedExternalState, commandRoutes,
 *     artifactCategories, gaps, protectedOperations, and workflow metadata.
 */

// ---------------------------------------------------------------------------
// Secret value arbitraries
// ---------------------------------------------------------------------------

/** 32-character uppercase alphanumeric key (AWS-key style). */
const awsStyleKeyArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[A-Z0-9]{32}$/)
  .filter((s) => s.length === 32);

/** Lowercase API key with sk- prefix. */
const skPrefixedKeyArb: fc.Arbitrary<string> = fc
  .stringMatching(/^sk-[a-z0-9]{32}$/)
  .filter((s) => s.length === 35);

/** Minimal JWT-like token (two base64url segments). */
const jwtLikeTokenArb: fc.Arbitrary<string> = fc.tuple(
  fc.stringMatching(/^[A-Za-z0-9]{20,40}$/),
  fc.stringMatching(/^[A-Za-z0-9]{20,40}$/),
).map(([a, b]) => `ey${a}.${b}`);

/** Random 40-hex string (git SHA / generic secret). */
const hexSecretArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-f0-9]{40}$/)
  .filter((s) => s.length === 40);

/** One of the four secret value shapes. */
const secretValueArb: fc.Arbitrary<string> = fc.oneof(
  awsStyleKeyArb,
  skPrefixedKeyArb,
  jwtLikeTokenArb,
  hexSecretArb,
);

// ---------------------------------------------------------------------------
// Secret name arbitraries (names must be preserved, values must be redacted)
// ---------------------------------------------------------------------------

const knownSecretNamesArb: fc.Arbitrary<string> = fc.constantFrom(
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "SUPABASE_DB_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "DATABASE_URL",
  "BACKUP_SIGNING_KEY",
);

// ---------------------------------------------------------------------------
// Repository source builder
// ---------------------------------------------------------------------------

function repositorySource(path: string, content: string) {
  return {
    content,
    source: {
      path,
      locator: "generated credential-redaction fixture",
      observedAt: "2026-01-01T00:00:00.000Z",
      contentDigest: `generated-${path}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Minimal valid workflow YAML template with injected secret names and values
// ---------------------------------------------------------------------------

function buildWorkflowYaml(secretName: string, secretValue: string): string {
  return [
    "name: supabase-backup-r2",
    "on:",
    '  schedule:',
    '    - cron: "15 2 * * *"',
    "  workflow_dispatch:",
    "jobs:",
    "  backup:",
    "    runs-on: ubuntu-latest",
    "    timeout-minutes: 30",
    "    steps:",
    "      - name: Run backup",
    "        run: pnpm run ops backup:supabase:r2",
    "        env:",
    `          ${secretName}: \${{ secrets.${secretName} }}`,
    `          # value hint (must not appear in review): ${secretValue}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Minimal valid companion sources (structure mirrors the real source fixture)
// ---------------------------------------------------------------------------

const minimalRootPackage = repositorySource(
  "package.json",
  JSON.stringify({
    scripts: {
      "r2:backup": "node scripts/run-ops.mjs backup:r2",
      "r2:catalog-snapshot": "node scripts/run-ops.mjs catalog:snapshot:r2",
      "r2:repo-backup": "node scripts/run-ops.mjs repo:backup:r2",
      "ops": "node scripts/run-ops.mjs",
    },
  }),
);

const minimalOperationsRouter = repositorySource(
  "scripts/run-ops.mjs",
  [
    '"backup:supabase:r2": () => runTsx("db_backup_upload_r2.ts")',
    '"catalog:snapshot:r2": () => runTsx("catalog_snapshot_upload_r2.ts")',
    '"repo:backup:r2": () => runTsx("repo_backup_upload_r2.ts")',
  ].join("\n"),
);

const minimalDatabaseOperations = repositorySource(
  "docs/database/ops.md",
  [
    "## §1 Nightly backups",
    "| `backups/products/pgdump-products-*.dump` | Products DB |",
    "| `backups/admin/pgdump-admin-*.dump` | Admin DB |",
    "| `backups/catalog/catalog-latest.json` | Catalog snapshot for degraded reads |",
    "| `backups/repo/oofplweb-*.zip` | Git archive |",
    "## §3 Restore from R2",
    "Follow the restore procedure to retrieve artifacts.",
  ].join("\n"),
);

const minimalRunbook = repositorySource(
  "OPERATIONS_RUNBOOK.md",
  "Nightly: `.github/workflows/supabase-backup-r2.yml` (02:15 UTC)",
);

function buildSources(secretName: string, secretValue: string): R2WorkflowReviewSources {
  return {
    workflow: repositorySource(
      ".github/workflows/supabase-backup-r2.yml",
      buildWorkflowYaml(secretName, secretValue),
    ),
    rootPackage: minimalRootPackage,
    operationsRouter: minimalOperationsRouter,
    databaseOperations: minimalDatabaseOperations,
    runbook: minimalRunbook,
  };
}

// ---------------------------------------------------------------------------
// Helpers: collect all string values from extraction output
// ---------------------------------------------------------------------------

function collectStringsFromSourceRef(ref: SourceReference): string[] {
  return [ref.path, ref.locator, ref.observedAt, ref.contentDigest];
}

function collectStringsFromFact(fact: EvidenceFact): string[] {
  return [
    fact.id,
    fact.surface,
    fact.statement,
    fact.status,
    ...collectStringsFromSourceRef(fact.source),
  ];
}

function collectStringsFromGap(gap: Gap): string[] {
  return [
    gap.id,
    gap.surface,
    gap.missingOrContradictoryElement,
    gap.risk,
    gap.priority,
    ...gap.sourcePaths,
    gap.recommendedFollowUp,
    ...(gap.namedOwner ? [gap.namedOwner] : []),
  ];
}

function collectStringsFromProtectedOperation(op: ProtectedOperation): string[] {
  return [
    op.operation,
    op.targetSurface,
    op.classification,
    op.requiredAuthorization,
    op.executionStatus,
    ...op.expectedEvidence,
  ];
}

function collectAllStringsFromExtraction(
  extraction: ReturnType<typeof extractR2WorkflowReview>,
): string[] {
  const strings: string[] = [];

  // workflow metadata
  strings.push(
    extraction.workflow.schedule,
    extraction.workflow.commandRoute,
    ...extraction.workflow.triggerModes,
    ...extraction.workflow.secretNames,
    String(extraction.workflow.timeoutMinutes),
  );

  // observed configuration facts
  for (const fact of extraction.observedConfiguration) {
    strings.push(...collectStringsFromFact(fact));
  }

  // unverified external state facts
  for (const fact of extraction.unverifiedExternalState) {
    strings.push(...collectStringsFromFact(fact));
  }

  // command routes
  for (const route of extraction.commandRoutes) {
    strings.push(
      route.command,
      route.purpose,
      ...route.artifactCategories,
      ...collectStringsFromSourceRef(route.source),
    );
  }

  // artifact categories
  for (const category of extraction.artifactCategories) {
    strings.push(
      category.id,
      category.description,
      category.status,
      ...category.declaredArtifactPaths,
    );
    for (const ref of category.sourceReferences) {
      strings.push(...collectStringsFromSourceRef(ref));
    }
  }

  // gaps
  for (const gap of extraction.gaps) {
    strings.push(...collectStringsFromGap(gap));
  }

  // protected operations
  for (const op of extraction.protectedOperations) {
    strings.push(...collectStringsFromProtectedOperation(op));
  }

  return strings;
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("Property 7: Scheduled-workflow credentials are redacted", () => {
  it("Secret values never appear in any string field of the extraction output", () => {
    fc.assert(
      fc.property(knownSecretNamesArb, secretValueArb, (secretName, secretValue) => {
        const sources = buildSources(secretName, secretValue);
        const extraction = extractR2WorkflowReview(sources);

        const allStrings = collectAllStringsFromExtraction(extraction);

        for (const str of allStrings) {
          expect(str).not.toContain(secretValue);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("Secret names are preserved in workflow metadata secretNames array", () => {
    fc.assert(
      fc.property(knownSecretNamesArb, secretValueArb, (secretName, secretValue) => {
        const sources = buildSources(secretName, secretValue);
        const extraction = extractR2WorkflowReview(sources);

        // The secret name (not value) must be retained
        expect(extraction.workflow.secretNames).toContain(secretName);

        // But the secret value must not appear anywhere
        const allStrings = collectAllStringsFromExtraction(extraction);
        for (const str of allStrings) {
          expect(str).not.toContain(secretValue);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("The observed-configuration fact for secret-names mentions the name but never the value", () => {
    fc.assert(
      fc.property(knownSecretNamesArb, secretValueArb, (secretName, secretValue) => {
        const sources = buildSources(secretName, secretValue);
        const extraction = extractR2WorkflowReview(sources);

        const secretNamesFact = extraction.observedConfiguration.find(
          (f) => f.id === "r2.workflow.secret-names",
        );

        expect(secretNamesFact).toBeDefined();

        // The fact statement mentions the secret name
        expect(secretNamesFact!.statement).toContain(secretName);

        // The fact statement does not contain the secret value
        expect(secretNamesFact!.statement).not.toContain(secretValue);

        // The fact statement contains the redaction notice
        expect(secretNamesFact!.statement).toContain("Credential values are redacted");
      }),
      { numRuns: 100 },
    );
  });

  it("All four secret value shapes are consistently redacted across AWS-key, sk-prefix, JWT-like, and hex formats", () => {
    fc.assert(
      fc.property(
        knownSecretNamesArb,
        fc.oneof(
          awsStyleKeyArb.map((v) => ({ shape: "aws" as const, value: v })),
          skPrefixedKeyArb.map((v) => ({ shape: "sk" as const, value: v })),
          jwtLikeTokenArb.map((v) => ({ shape: "jwt" as const, value: v })),
          hexSecretArb.map((v) => ({ shape: "hex" as const, value: v })),
        ),
        (secretName, secret) => {
          const sources = buildSources(secretName, secret.value);
          const extraction = extractR2WorkflowReview(sources);

          const allStrings = collectAllStringsFromExtraction(extraction);

          for (const str of allStrings) {
            expect(str).not.toContain(secret.value);
          }

          // Secret name survives regardless of the value shape
          expect(extraction.workflow.secretNames).toContain(secretName);
        },
      ),
      { numRuns: 100 },
    );
  });
});
