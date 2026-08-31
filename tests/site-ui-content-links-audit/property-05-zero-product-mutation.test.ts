// @vitest-environment node
// Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation

/**
 * Property-based test for the Zero product-code mutation contract (Task 1.11).
 *
 * **Validates: Requirements 4.7, 23.6, 23.7**
 *
 * The audit program must never write to product-code boundaries. This test
 * generates random file path manifests (lists of paths that could appear in
 * changedPaths) and verifies:
 *
 * 1. Every path under `site/**` is REJECTED by the manifest validator.
 * 2. Paths under `scripts/site-ui-content-links-audit/**`,
 *    `results/site-ui-content-links-audit/**`, and
 *    `agents-work/site-ui-content-links-audit/**` are ACCEPTED.
 * 3. Paths under `site/{components,lib,hooks,store,server}/{Studio,Planner}/**`
 *    (fork trees) are always rejected.
 * 4. The run manifest `changedPaths` field only ever contains accepted
 *    audit-tooling paths.
 * 5. The real Wave 0 run manifest (changedPaths: []) passes the constraint
 *    that no product-code writes occurred.
 *
 * At least 100 generated path manifests are tested, including edge cases:
 * Planner product tree, Studio product tree, admin pages, API routes.
 *
 * No `site/**` imports are used. This file imports only from
 * `scripts/site-ui-content-links-audit/` modules.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  AuditArtifactPathError,
  resolveApprovedArtifactPath,
  verifyFailClosedArtifactPolicy,
} from "../../scripts/site-ui-content-links-audit/artifactPaths";
import type { AuditRunConfiguration } from "../../scripts/site-ui-content-links-audit/config";
import { AUDIT_SCHEMA_VERSION } from "../../scripts/site-ui-content-links-audit/schemas";

/** Inline type guard (manifests.ts does not export isRecord). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// Shared run configuration — no product-code paths
// ---------------------------------------------------------------------------

const WAVE0_RUN_ID = "20260830T164237000Z-74b6a5346ac0-3c217a4a5266";
const VALID_RUN_ID = "20260823T120000000Z-aabbccddeeff-001122334455";
const REPO_ROOT = path.resolve(__dirname, "../..");

const BASE_CONFIG: AuditRunConfiguration = {
  auditId: "site-ui-content-links-audit",
  schemaVersion: "1.0.0",
  specId: "a1d0ec75-82d5-42af-907f-c43024cb4a1e",
  specConfigPath: ".kiro/specs/site-ui-content-links-audit/.config.kiro",
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
 * Covers: app pages, components, lib, hooks, Planner tree, Studio tree,
 * focss layers, migrations, drizzle schema — all product-code writes.
 */
const PROHIBITED_SITE_PATHS: readonly string[] = [
  // General application pages
  "site/app/page.tsx",
  "site/app/(site)/page.tsx",
  "site/app/admin/page.tsx",
  "site/app/api/products/route.ts",
  // Generic components/lib/hooks
  "site/components/AuditReport.tsx",
  "site/lib/auditHelper.ts",
  "site/hooks/useAuditData.ts",
  // Planner product tree (fork boundary)
  "site/components/Planner/Canvas.tsx",
  "site/components/Planner/Sidebar.tsx",
  "site/components/Planner/hooks/useLayout.ts",
  "site/hooks/Planner/usePlannerState.ts",
  "site/lib/Planner/plannerUtils.ts",
  "site/server/Planner/plannerApi.ts",
  "site/store/Planner/plannerStore.ts",
  "site/focss/planner/tokens.css",
  // Studio product tree (fork boundary)
  "site/components/Studio/Toolbar.tsx",
  "site/components/Studio/Canvas.tsx",
  "site/components/Studio/hooks/useCanvas.ts",
  "site/hooks/Studio/useStudioState.ts",
  "site/lib/Studio/studioUtils.ts",
  "site/server/Studio/studioApi.ts",
  "site/store/Studio/studioStore.ts",
  "site/focss/studio/tokens.css",
  // Database migrations (forbidden writes)
  "site/platform/supabase/migrations/audit.sql",
  "site/platform/supabase/migrations.admin/audit.sql",
  "site/platform/drizzle/schema/audit.ts",
];

/** Other prohibited boundaries: workers, raw results root, unpartitioned paths, config */
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
const arbProhibitedSitePath: fc.Arbitrary<string> = fc.constantFrom(...PROHIBITED_SITE_PATHS);
const arbProhibitedPath: fc.Arbitrary<string> = fc.constantFrom(...ALL_PROHIBITED_PATHS);

/**
 * Generates a Planner product-tree path under site/components/Planner/**,
 * site/hooks/Planner/**, or site/lib/Planner/** — always rejected.
 */
const arbPlannerProductPath: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom(
      "site/components/Planner",
      "site/hooks/Planner",
      "site/lib/Planner",
      "site/server/Planner",
      "site/store/Planner",
    ),
    fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
    fc.constantFrom(".tsx", ".ts", ".css"),
  )
  .map(([base, name, ext]) => `${base}/${name}${ext}`);

/**
 * Generates a Studio product-tree path under site/components/Studio/**,
 * site/hooks/Studio/**, or site/lib/Studio/** — always rejected.
 */
const arbStudioProductPath: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom(
      "site/components/Studio",
      "site/hooks/Studio",
      "site/lib/Studio",
      "site/server/Studio",
      "site/store/Studio",
    ),
    fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
    fc.constantFrom(".tsx", ".ts", ".css"),
  )
  .map(([base, name, ext]) => `${base}/${name}${ext}`);

/**
 * Generates a manifest containing only approved paths.
 * Every path must be accepted individually.
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
 * Generates a manifest containing at least one Planner product-tree path,
 * optionally surrounded by approved paths.
 */
const arbManifestWithPlannerPath: fc.Arbitrary<readonly string[]> = fc
  .tuple(
    fc.array(arbApprovedPath, { minLength: 0, maxLength: 3 }),
    arbPlannerProductPath,
    fc.array(arbApprovedPath, { minLength: 0, maxLength: 3 }),
  )
  .map(([before, plannerPath, after]) => [...before, plannerPath, ...after]);

/**
 * Generates a manifest containing at least one Studio product-tree path,
 * optionally surrounded by approved paths.
 */
const arbManifestWithStudioPath: fc.Arbitrary<readonly string[]> = fc
  .tuple(
    fc.array(arbApprovedPath, { minLength: 0, maxLength: 3 }),
    arbStudioProductPath,
    fc.array(arbApprovedPath, { minLength: 0, maxLength: 3 }),
  )
  .map(([before, studioPath, after]) => [...before, studioPath, ...after]);

/**
 * Generates a change manifest with at least one approved AND at least one
 * prohibited path, in a random shuffled order.
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the first path in the manifest that is rejected by
 * `resolveApprovedArtifactPath`, or `null` if all paths are accepted.
 * Re-throws any non-path-error exceptions.
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

/** Returns true when the manifest contains at least one path under site/. */
function containsSitePath(manifest: readonly string[]): boolean {
  return manifest.some((p) => p.startsWith("site/") || p.startsWith("site\\"));
}

/** Returns true when the manifest contains at least one Planner product-tree path. */
function containsPlannerPath(manifest: readonly string[]): boolean {
  return manifest.some(
    (p) =>
      p.startsWith("site/components/Planner/") ||
      p.startsWith("site/hooks/Planner/") ||
      p.startsWith("site/lib/Planner/") ||
      p.startsWith("site/server/Planner/") ||
      p.startsWith("site/store/Planner/") ||
      p.startsWith("site/focss/planner/"),
  );
}

/** Returns true when the manifest contains at least one Studio product-tree path. */
function containsStudioPath(manifest: readonly string[]): boolean {
  return manifest.some(
    (p) =>
      p.startsWith("site/components/Studio/") ||
      p.startsWith("site/hooks/Studio/") ||
      p.startsWith("site/lib/Studio/") ||
      p.startsWith("site/server/Studio/") ||
      p.startsWith("site/store/Studio/") ||
      p.startsWith("site/focss/studio/"),
  );
}

// ---------------------------------------------------------------------------
// Property test suite
// ---------------------------------------------------------------------------

describe(
  "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation",
  () => {
    /**
     * Property 5a: every approved audit path is accepted.
     *
     * For every manifest containing only approved paths, no path should throw
     * an AuditArtifactPathError. Covers tooling, generated evidence, and
     * authored work artifact classes.
     *
     * **Validates: Requirements 4.7, 23.6, 23.7**
     */
    it(
      "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation — every approved audit-tooling and artifact path is accepted",
      () => {
        fc.assert(
          fc.property(arbApprovedOnlyManifest, (manifest) => {
            // Every path in an approved-only manifest must resolve without error.
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

            // No path in an approved-only manifest should be rejected.
            const rejected = firstRejectedPath(manifest, BASE_CONFIG);
            expect(rejected).toBeNull();
          }),
          { numRuns: 100 },
        );
      },
    );

    /**
     * Property 5b: every prohibited path is rejected with AuditArtifactPathError.
     *
     * For every known prohibited path (site/**, Planner/Studio product trees,
     * database mutations, workers, raw results roots), the path validator must
     * throw an AuditArtifactPathError — never accept silently.
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
     * path under site/ must cause at least one rejection. No approved path
     * may be incorrectly identified as the rejected one.
     *
     * **Validates: Requirements 4.7, 23.6, 23.7**
     */
    it(
      "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation — a manifest with any site/** path is always rejected",
      () => {
        fc.assert(
          fc.property(arbManifestWithSitePath, (manifest) => {
            expect(containsSitePath(manifest)).toBe(true);

            const rejected = firstRejectedPath(manifest, BASE_CONFIG, VALID_RUN_ID);
            expect(rejected).not.toBeNull();

            // The rejected path must not be one of the known approved paths.
            if (rejected !== null) {
              expect(ALL_APPROVED_PATHS.includes(rejected)).toBe(false);
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
     * site/lib/Planner/**, site/server/Planner/**, site/store/Planner/**,
     * or site/focss/planner/** must be rejected, even when surrounded by
     * valid approved paths. Fork boundaries are ownership boundaries.
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
     * site/lib/Studio/**, site/server/Studio/**, site/store/Studio/**,
     * or site/focss/studio/** must be rejected, even when surrounded by
     * valid approved paths. Fork boundaries are ownership boundaries.
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
     * Any change manifest containing at least one prohibited path (mixed with
     * approved paths in any order) must have that path detected as rejected.
     * The approved paths in the same manifest must not cause false positives.
     *
     * **Validates: Requirements 4.7, 23.6, 23.7**
     */
    it(
      "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation — mixed manifests always surface rejected product-code paths",
      () => {
        fc.assert(
          fc.property(arbMixedManifest, (manifest) => {
            // By construction every mixed manifest has at least one prohibited path.
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
     * list, validating the fail-closed guarantee.
     *
     * **Validates: Requirements 4.7, 23.6, 23.7**
     */
    it(
      "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation — verifyFailClosedArtifactPolicy passes for valid configurations",
      () => {
        fc.assert(
          fc.property(arbApprovedOnlyManifest, (_manifest) => {
            expect(() =>
              verifyFailClosedArtifactPolicy(REPO_ROOT, BASE_CONFIG),
            ).not.toThrow();
          }),
          { numRuns: 100 },
        );
      },
    );

    /**
     * Property 5h: the Wave 0 run manifest changedPaths is empty.
     *
     * Fixture test: the real Wave 0 run manifest at
     * results/site-ui-content-links-audit/20260830T164237000Z-74b6a5346ac0-3c217a4a5266/manifests/run-manifest.json
     * must have changedPaths: [] — confirming no product-code writes occurred.
     *
     * This is a fixture-based property verifying the constraint on the
     * already-produced run manifest: the changedPaths field must either be
     * empty or contain only accepted audit-tooling paths.
     *
     * **Validates: Requirements 4.7, 23.6, 23.7**
     */
    it(
      "Feature: site-ui-content-links-audit, Property 5: Zero product-code mutation — Wave 0 run manifest changedPaths contains no product-code writes",
      async () => {
        const manifestPath = path.resolve(
          REPO_ROOT,
          `results/site-ui-content-links-audit/${WAVE0_RUN_ID}/manifests/run-manifest.json`,
        );

        const raw = await readFile(manifestPath, "utf8");
        const parsed: unknown = JSON.parse(raw);

        // The manifest must be a record with the required shape.
        expect(isRecord(parsed)).toBe(true);
        if (!isRecord(parsed)) return;

        // The schema version must match the audit schema version from schemas.ts.
        expect(parsed["schemaVersion"]).toBe(AUDIT_SCHEMA_VERSION);

        // changedPaths must be an array.
        const { changedPaths } = parsed;
        expect(Array.isArray(changedPaths)).toBe(true);
        if (!Array.isArray(changedPaths)) return;

        // The Wave 0 run manifest is expected to have changedPaths: [].
        // Every path (if any) must be an accepted audit-tooling path.
        for (const changedPath of changedPaths) {
          expect(typeof changedPath).toBe("string");
          expect(() =>
            resolveApprovedArtifactPath(
              REPO_ROOT,
              changedPath as string,
              BASE_CONFIG,
              WAVE0_RUN_ID,
            ),
          ).not.toThrow();
        }

        // No path in changedPaths may be under site/** (product-code boundary).
        const siteWrites = (changedPaths as string[]).filter(
          (p) => typeof p === "string" && (p.startsWith("site/") || p.startsWith("site\\")),
        );
        expect(siteWrites).toHaveLength(0);
      },
    );
  },
);
