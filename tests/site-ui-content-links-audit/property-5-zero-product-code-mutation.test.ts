// @vitest-environment node
// Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation

/**
 * Property-based test for the Zero product-code mutation contract.
 *
 * **Validates: Requirements 4.7, 23.6, 23.7**
 *
 * The audit program must never write to product-code boundaries. This test
 * generates random path manifests containing mixes of approved and prohibited
 * paths, then asserts that:
 *
 * 1. Every approved audit path (tooling, generated evidence, authored work)
 *    is accepted by `resolveApprovedArtifactPath`.
 * 2. Every prohibited path (`site/**`, product-tree paths, database
 *    migrations, worker roots, Planner product tree, Studio product tree,
 *    production filesystem targets, unpartitioned results, and raw root
 *    report files) is rejected with an `AuditArtifactPathError`.
 * 3. A change manifest containing any `site/**` path is always rejected.
 * 4. Planner and Studio product-tree paths are always rejected, even when
 *    surrounded by otherwise-valid approved paths.
 * 5. `verifyFailClosedArtifactPolicy` passes without throwing for any valid
 *    run configuration (it internally checks prohibited paths and will throw
 *    on policy failure).
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  AuditArtifactPathError,
  resolveApprovedArtifactPath,
  verifyFailClosedArtifactPolicy,
} from "../../scripts/site-ui-content-links-audit/artifactPaths";
import type { AuditRunConfiguration } from "../../scripts/site-ui-content-links-audit/config";

// ---------------------------------------------------------------------------
// Shared run configuration pointing to non-product paths only
// ---------------------------------------------------------------------------

const VALID_RUN_ID = "20260823T120000000Z-aabbccddeeff-001122334455";

const BASE_CONFIG: AuditRunConfiguration = {
  auditId: "site-ui-content-links-audit",
  schemaVersion: "1.0.0",
  specId: "a1d0ec75-82d5-42af-907f-c43024cb4a1e",
  specConfigPath: ".removed-specs/site-ui-content-links-audit/spec-config.json",
  artifactPaths: {
    toolingRoot: "scripts/site-ui-content-links-audit",
    generatedRoot: "results/site-ui-content-links-audit",
    authoredRoot: "agents-work/site-ui-content-links-audit",
    generatedPurposes: [
      "manifests",
      "registries",
      "inventories",
      "profiles",
      "matrices",
      "evidence",
      "findings",
      "handoff-indexes",
      "completion-proof",
      "quarantine",
    ],
    authoredReportTypes: [
      "decisions",
      "copy-review",
      "gap-analysis",
      "remediation-handoffs",
    ],
  },
  surfacePartitions: {
    marketing: "marketing",
    catalogConfigurator: "catalog-configurator",
    portalDashboard: "portal-dashboard",
    authentication: "authentication",
    legal: "legal",
    administration: "administration",
    planner: "planner",
    studio: "studio",
    offline: "offline",
    sharedShell: "shared-shell",
  },
  waves: [
    {
      id: 0,
      name: "inventory-and-matrix",
      dependencies: [],
      entryCriteria: ["repository revision recorded"],
      exitCriteria: ["all discovered items classified"],
      ownedOutputs: ["manifests", "registries", "inventories", "profiles", "matrices"],
      authorization: "static-inspection-only",
    },
    {
      id: 1,
      name: "shared-foundations",
      dependencies: [0],
      entryCriteria: ["Wave 0 closed"],
      exitCriteria: ["all Wave 1 items have terminal static conclusions"],
      ownedOutputs: ["inventories", "evidence", "findings"],
      authorization: "protected-portions-require-exact-authorization",
    },
    {
      id: 2,
      name: "marketing-and-primary-journeys",
      dependencies: [1],
      entryCriteria: ["Wave 1 dependencies resolved or recorded"],
      exitCriteria: ["all scoped journeys and occurrences are terminal or gapped"],
      ownedOutputs: ["inventories", "evidence", "findings"],
      authorization: "protected-portions-require-exact-authorization",
    },
    {
      id: 3,
      name: "administration-planner-studio",
      dependencies: [2],
      entryCriteria: ["required fixtures and ownership recorded"],
      exitCriteria: ["all rows terminal"],
      ownedOutputs: ["inventories", "evidence", "findings"],
      authorization: "protected-access-requires-exact-authorization",
    },
    {
      id: 4,
      name: "protected-runtime-evidence",
      dependencies: [3],
      entryCriteria: ["profiles and budgets frozen", "operations registered"],
      exitCriteria: [
        "every selected operation has authorization evidence and a result or an exact blocked/not-run record",
      ],
      ownedOutputs: ["evidence", "findings", "manifests"],
      authorization: "exact-current-session-authorization-and-hook-permission",
    },
    {
      id: 5,
      name: "reconciliation-and-handoff",
      dependencies: [4],
      entryCriteria: ["Waves 0 through 4 terminal"],
      exitCriteria: ["all closure invariants pass"],
      ownedOutputs: ["findings", "handoff-indexes", "completion-proof", "manifests"],
      authorization: "static-reconciliation-only",
    },
  ],
};

const REPO_ROOT = "/repo";

// ---------------------------------------------------------------------------
// Approved path building blocks
// ---------------------------------------------------------------------------

/** Approved audit-tooling paths under scripts/site-ui-content-links-audit */
const APPROVED_TOOLING_PATHS: readonly string[] = [
  "scripts/site-ui-content-links-audit/index.ts",
  "scripts/site-ui-content-links-audit/artifactPaths.ts",
  "scripts/site-ui-content-links-audit/config.ts",
  "scripts/site-ui-content-links-audit/discovery.ts",
  "scripts/site-ui-content-links-audit/manifests.ts",
  "scripts/site-ui-content-links-audit/profiles.ts",
  "scripts/site-ui-content-links-audit/runIdentity.ts",
  "scripts/site-ui-content-links-audit/schemas.ts",
  "scripts/site-ui-content-links-audit/wave.ts",
  "scripts/site-ui-content-links-audit/cli.ts",
];

/** Approved generated evidence paths under results/site-ui-content-links-audit */
const APPROVED_GENERATED_PATHS: readonly string[] = [
  `results/site-ui-content-links-audit/${VALID_RUN_ID}/manifests/run.json`,
  `results/site-ui-content-links-audit/${VALID_RUN_ID}/inventories/routes.ndjson`,
  `results/site-ui-content-links-audit/${VALID_RUN_ID}/profiles/viewports.json`,
  `results/site-ui-content-links-audit/${VALID_RUN_ID}/matrices/wave-0.ndjson`,
  `results/site-ui-content-links-audit/${VALID_RUN_ID}/evidence/findings.ndjson`,
];

/** Approved authored audit-work paths under agents-work/site-ui-content-links-audit */
const APPROVED_AUTHORED_PATHS: readonly string[] = [
  "agents-work/site-ui-content-links-audit/decisions/wave-0-scope.md",
  "agents-work/site-ui-content-links-audit/copy-review/homepage.md",
  "agents-work/site-ui-content-links-audit/gap-analysis/dynamic-routes.md",
  "agents-work/site-ui-content-links-audit/remediation-handoffs/links.md",
];

const ALL_APPROVED_PATHS: readonly string[] = [
  ...APPROVED_TOOLING_PATHS,
  ...APPROVED_GENERATED_PATHS,
  ...APPROVED_AUTHORED_PATHS,
];

// ---------------------------------------------------------------------------
// Prohibited path building blocks
// ---------------------------------------------------------------------------

/**
 * Paths under site/** — always prohibited.
 * Includes Planner and Studio product trees explicitly.
 */
const PROHIBITED_SITE_PATHS: readonly string[] = [
  "site/app/page.tsx",
  "site/app/(site)/page.tsx",
  "site/components/AuditReport.tsx",
  "site/lib/auditHelper.ts",
  "site/components/Planner/Canvas.tsx",
  "site/components/Planner/Sidebar.tsx",
  "site/components/Planner/hooks/useLayout.ts",
  "site/components/Studio/Toolbar.tsx",
  "site/components/Studio/Canvas.tsx",
  "site/hooks/Planner/usePlannerState.ts",
  "site/hooks/Studio/useStudioState.ts",
  "site/focss/planner/tokens.css",
  "site/focss/studio/tokens.css",
  "site/platform/supabase/migrations/audit.sql",
  "site/platform/supabase/migrations.admin/audit.sql",
  "site/platform/drizzle/schema/audit.ts",
];

/** Other prohibited boundaries: workers, raw results root, database paths, config */
const PROHIBITED_OTHER_PATHS: readonly string[] = [
  "workers/oando-worker-proxy/src/index.ts",
  "results/audit.json",
  "results/site-ui-content-links-audit/report.json",
  "audit-report.md",
  "vercel.json",
  ".env.local",
];

const ALL_PROHIBITED_PATHS: readonly string[] = [
  ...PROHIBITED_SITE_PATHS,
  ...PROHIBITED_OTHER_PATHS,
];

// ---------------------------------------------------------------------------
// Arbitrary generators
// ---------------------------------------------------------------------------

const arbApprovedPath: fc.Arbitrary<string> = fc.constantFrom(...ALL_APPROVED_PATHS);

const arbProhibitedSitePath: fc.Arbitrary<string> = fc.constantFrom(
  ...PROHIBITED_SITE_PATHS,
);

const _arbProhibitedOtherPath: fc.Arbitrary<string> = fc.constantFrom(
  ...PROHIBITED_OTHER_PATHS,
);

const arbProhibitedPath: fc.Arbitrary<string> = fc.constantFrom(...ALL_PROHIBITED_PATHS);

/**
 * Generates a Planner product-tree path (site/components/Planner/**).
 * These must always be rejected regardless of context.
 */
const arbPlannerProductPath: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-z][a-z0-9-]{0,15}$/)
  .map((name) => `site/components/Planner/${name}.tsx`);

/**
 * Generates a Studio product-tree path (site/components/Studio/**).
 * These must always be rejected regardless of context.
 */
const arbStudioProductPath: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-z][a-z0-9-]{0,15}$/)
  .map((name) => `site/components/Studio/${name}.tsx`);

/**
 * Generates a change manifest: an array that may contain a mix of approved
 * and prohibited paths in any order. Always includes at least one approved
 * path and at least one prohibited path so both classifications are exercised.
 */
const arbMixedManifest: fc.Arbitrary<readonly string[]> = fc
  .tuple(
    fc.array(arbApprovedPath, { minLength: 1, maxLength: 5 }),
    fc.array(arbProhibitedPath, { minLength: 1, maxLength: 5 }),
  )
  .chain(([approved, prohibited]) =>
    fc.shuffledSubarray([...approved, ...prohibited], {
      minLength: approved.length + prohibited.length,
      maxLength: approved.length + prohibited.length,
    }),
  );

/**
 * Generates a pure-approved change manifest (no prohibited paths).
 * All paths must be accepted individually.
 */
const arbApprovedOnlyManifest: fc.Arbitrary<readonly string[]> = fc.array(
  arbApprovedPath,
  { minLength: 1, maxLength: 8 },
);

/**
 * Generates a manifest that contains at least one site/** path.
 * The overall manifest must always be rejected.
 */
const arbManifestWithSitePath: fc.Arbitrary<readonly string[]> = fc
  .tuple(
    fc.array(arbApprovedPath, { minLength: 0, maxLength: 4 }),
    arbProhibitedSitePath,
    fc.array(arbApprovedPath, { minLength: 0, maxLength: 4 }),
  )
  .map(([before, sitePath, after]) => [...before, sitePath, ...after]);

/**
 * Generates a manifest containing at least one Planner product-tree path.
 */
const arbManifestWithPlannerPath: fc.Arbitrary<readonly string[]> = fc
  .tuple(
    fc.array(arbApprovedPath, { minLength: 0, maxLength: 3 }),
    arbPlannerProductPath,
    fc.array(arbApprovedPath, { minLength: 0, maxLength: 3 }),
  )
  .map(([before, plannerPath, after]) => [...before, plannerPath, ...after]);

/**
 * Generates a manifest containing at least one Studio product-tree path.
 */
const arbManifestWithStudioPath: fc.Arbitrary<readonly string[]> = fc
  .tuple(
    fc.array(arbApprovedPath, { minLength: 0, maxLength: 3 }),
    arbStudioProductPath,
    fc.array(arbApprovedPath, { minLength: 0, maxLength: 3 }),
  )
  .map(([before, studioPath, after]) => [...before, studioPath, ...after]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validate every path in the manifest against `resolveApprovedArtifactPath`.
 * Returns the first rejected path, or `null` if all paths were accepted.
 */
function firstRejectedPath(
  manifest: readonly string[],
  config: AuditRunConfiguration,
  runId?: string,
): string | null {
  for (const changedPath of manifest) {
    try {
      resolveApprovedArtifactPath(REPO_ROOT, changedPath, config, runId);
    } catch (error) {
      if (error instanceof AuditArtifactPathError) {
        return changedPath;
      }
      throw error;
    }
  }
  return null;
}

/**
 * Returns true when the manifest contains at least one path under `site/`.
 */
function containsSitePath(manifest: readonly string[]): boolean {
  return manifest.some((p) => p.startsWith("site/") || p.startsWith("site\\"));
}

/**
 * Returns true when the manifest contains at least one Planner product-tree path.
 */
function containsPlannerPath(manifest: readonly string[]): boolean {
  return manifest.some(
    (p) =>
      p.startsWith("site/components/Planner/") ||
      p.startsWith("site/hooks/Planner/") ||
      p.startsWith("site/focss/planner/"),
  );
}

/**
 * Returns true when the manifest contains at least one Studio product-tree path.
 */
function containsStudioPath(manifest: readonly string[]): boolean {
  return manifest.some(
    (p) =>
      p.startsWith("site/components/Studio/") ||
      p.startsWith("site/hooks/Studio/") ||
      p.startsWith("site/focss/studio/"),
  );
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe(
  "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation",
  () => {
    /**
     * Property 5a: every approved audit path is accepted.
     *
     * For every known approved path, `resolveApprovedArtifactPath` must not
     * throw. This covers all three artifact classes: audit tooling, generated
     * evidence, and authored work.
     *
     * **Validates: Requirements 4.7, 23.6, 23.7**
     */
    it(
      "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation — every approved audit-tooling and artifact path is accepted",
      () => {
        fc.assert(
          fc.property(arbApprovedOnlyManifest, (manifest) => {
            // Every path in a pure-approved manifest must resolve without error.
            for (const approvedPath of manifest) {
              expect(() =>
                resolveApprovedArtifactPath(
                  REPO_ROOT,
                  approvedPath,
                  BASE_CONFIG,
                  // Supply a run ID only for generated-evidence paths.
                  approvedPath.includes(VALID_RUN_ID) ? VALID_RUN_ID : undefined,
                ),
              ).not.toThrow();
            }

            // A pure-approved manifest has no rejected paths.
            const rejected = firstRejectedPath(manifest, BASE_CONFIG);
            expect(rejected).toBeNull();
          }),
          { numRuns: 100 },
        );
      },
    );

    /**
     * Property 5b: every prohibited path is rejected.
     *
     * For every known prohibited path, `resolveApprovedArtifactPath` must
     * throw an `AuditArtifactPathError`. This covers site/**, Planner/Studio
     * product trees, database mutation paths, workers, and raw results roots.
     *
     * **Validates: Requirements 4.7, 23.6, 23.7**
     */
    it(
      "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation — every prohibited product-code path is rejected",
      () => {
        fc.assert(
          fc.property(arbProhibitedPath, (prohibitedPath) => {
            expect(() =>
              resolveApprovedArtifactPath(REPO_ROOT, prohibitedPath, BASE_CONFIG),
            ).toThrow(AuditArtifactPathError);
          }),
          { numRuns: 100 },
        );
      },
    );

    /**
     * Property 5c: a manifest containing any site/** path is always rejected.
     *
     * Regardless of how many approved paths surround it, the presence of any
     * path under site/ must cause `firstRejectedPath` to identify that path
     * (or another prohibited path) as rejected.
     *
     * **Validates: Requirements 4.7, 23.6, 23.7**
     */
    it(
      "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation — a manifest with any site/** path is always rejected",
      () => {
        fc.assert(
          fc.property(arbManifestWithSitePath, (manifest) => {
            expect(containsSitePath(manifest)).toBe(true);

            // At least one path in this manifest must be rejected.
            const rejected = firstRejectedPath(manifest, BASE_CONFIG, VALID_RUN_ID);
            expect(rejected).not.toBeNull();

            // The rejected path must itself be under site/ or another
            // prohibited boundary (never one of the approved paths).
            if (rejected !== null) {
              const isApproved = ALL_APPROVED_PATHS.includes(rejected);
              expect(isApproved).toBe(false);
            }
          }),
          { numRuns: 100 },
        );
      },
    );

    /**
     * Property 5d: Planner product-tree paths are always rejected.
     *
     * Any path under site/components/Planner/**, site/hooks/Planner/**,
     * or site/focss/planner/** must be rejected with an AuditArtifactPathError,
     * even when surrounded by valid approved paths.
     *
     * **Validates: Requirements 4.7, 23.6, 23.7**
     */
    it(
      "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation — Planner product-tree paths are always rejected",
      () => {
        fc.assert(
          fc.property(arbManifestWithPlannerPath, (manifest) => {
            expect(containsPlannerPath(manifest)).toBe(true);

            const rejected = firstRejectedPath(manifest, BASE_CONFIG, VALID_RUN_ID);
            expect(rejected).not.toBeNull();
          }),
          { numRuns: 100 },
        );
      },
    );

    /**
     * Property 5e: Studio product-tree paths are always rejected.
     *
     * Any path under site/components/Studio/**, site/hooks/Studio/**,
     * or site/focss/studio/** must be rejected with an AuditArtifactPathError,
     * even when surrounded by valid approved paths.
     *
     * **Validates: Requirements 4.7, 23.6, 23.7**
     */
    it(
      "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation — Studio product-tree paths are always rejected",
      () => {
        fc.assert(
          fc.property(arbManifestWithStudioPath, (manifest) => {
            expect(containsStudioPath(manifest)).toBe(true);

            const rejected = firstRejectedPath(manifest, BASE_CONFIG, VALID_RUN_ID);
            expect(rejected).not.toBeNull();
          }),
          { numRuns: 100 },
        );
      },
    );

    /**
     * Property 5f: mixed manifests always surface at least one rejected path.
     *
     * Any change manifest containing at least one prohibited path must have
     * that path detected as rejected, regardless of the number of approved
     * paths also present in the manifest.
     *
     * **Validates: Requirements 4.7, 23.6, 23.7**
     */
    it(
      "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation — mixed manifests always surface rejected product-code paths",
      () => {
        fc.assert(
          fc.property(arbMixedManifest, (manifest) => {
            // A mixed manifest by construction contains at least one prohibited path.
            const rejected = firstRejectedPath(manifest, BASE_CONFIG, VALID_RUN_ID);
            expect(rejected).not.toBeNull();
          }),
          { numRuns: 100 },
        );
      },
    );

    /**
     * Property 5g: verifyFailClosedArtifactPolicy passes for the base config.
     *
     * The fail-closed policy check must complete without throwing for any
     * valid run configuration derived from the base config. This proves the
     * enforcement function correctly rejects its own internal prohibited-path
     * list.
     *
     * **Validates: Requirements 4.7, 23.6, 23.7**
     */
    it(
      "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation — verifyFailClosedArtifactPolicy passes for valid configurations",
      () => {
        fc.assert(
          fc.property(arbApprovedOnlyManifest, (_manifest) => {
            // The policy verifier uses the config's artifact paths to enforce
            // prohibited destinations. It must not throw for any valid config
            // derived from our base configuration.
            expect(() =>
              verifyFailClosedArtifactPolicy(REPO_ROOT, BASE_CONFIG),
            ).not.toThrow();
          }),
          { numRuns: 100 },
        );
      },
    );
  },
);
