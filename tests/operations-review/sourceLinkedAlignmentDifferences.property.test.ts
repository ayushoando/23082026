// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 12: Alignment comparison produces complete, source-linked differences.
//
// **Validates: Requirements 9.1, 9.2**
//
// Every AlignmentDifference produced by compareAlignment must carry:
//   - non-empty sourcePaths[0] and sourcePaths[1] (both sides)
//   - non-empty exactDifference text
//   - a valid surface enum value
//   - a non-empty recommendedResolution
//
// No difference may be emitted without full source attribution.

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  compareAlignment,
  validateAlignmentDifference,
} from "../../scripts/operations-review/alignmentComparator";
import type { AlignmentInput } from "../../scripts/operations-review/alignmentComparator";
import type { RepositorySource } from "../../scripts/operations-review/sourceAdapter";
import type { Surface } from "../../scripts/operations-review/models";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_SURFACES: readonly Surface[] = [
  "vercel-application",
  "cloudflare-worker",
  "products-database",
  "admin-database",
  "r2-backup",
  "monitoring",
  "runbook-ci-alignment",
];

const VALID_DIMENSIONS = [
  "command",
  "owner",
  "environment",
  "order",
  "approval",
  "recovery",
] as const;

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeSource(filePath: string, content: string): RepositorySource {
  return {
    content,
    source: {
      path: filePath,
      locator: `test-fixture:${filePath}`,
      observedAt: "2026-01-01T00:00:00.000Z",
      contentDigest: `sha256-test-${filePath.replace(/[^a-z0-9]/gi, "-")}`,
    },
  };
}

/**
 * Minimal baseline where no mismatch is expected:
 * all runbook and CI references resolve to scripts that exist in package.json.
 */
function baselineInput(): AlignmentInput {
  return {
    runbook: makeSource(
      "OPERATIONS_RUNBOOK.md",
      [
        "# Operations Runbook",
        "## Deployment",
        "Run `pnpm run vercel:prod` to deploy the application.",
        "Run `pnpm run worker:deploy` to deploy the Worker.",
        "## Backup",
        "Run `pnpm run r2:backup` to back up to R2.",
        "## Recovery",
        "Run `pnpm run db:restore` to restore the database.",
      ].join("\n"),
    ),
    rootPackage: makeSource(
      "package.json",
      JSON.stringify({
        scripts: {
          "vercel:prod": "vercel --prod",
          "worker:deploy": "wrangler deploy",
          "r2:backup": "node scripts/r2-backup.mjs",
          "db:restore": "node scripts/db-restore.mjs",
        },
      }),
    ),
    vercelConfig: makeSource("vercel.json", JSON.stringify({ version: 2 })),
    workerConfig: makeSource(
      "workers/oando-worker-proxy/wrangler.toml",
      'name = "oando-worker-proxy"\nmain = "src/index.js"',
    ),
    ciWorkflow: makeSource(
      ".github/workflows/supabase-backup-r2.yml",
      [
        "on:",
        "  schedule:",
        "    - cron: '0 2 * * *'",
        "jobs:",
        "  backup:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: pnpm run r2:backup",
      ].join("\n"),
    ),
    operationsRouter: makeSource("scripts/run-ops.mjs", "// operations router\n"),
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A well-formed script name that does not collide with any baseline script. */
const phantomScriptArb = fc
  .stringMatching(/^[a-z][a-z0-9-]{3,20}$/)
  .filter(
    (s) =>
      !["vercel:prod", "worker:deploy", "r2:backup", "db:restore"].includes(s),
  );

/** An all-caps env var name matching the pattern vercel.json uses. */
const envVarNameArb = fc.stringMatching(/^[A-Z][A-Z0-9_]{3,30}$/);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 12: Alignment comparison produces complete, source-linked differences", () => {
  // -------------------------------------------------------------------------
  // Baseline sanity
  // -------------------------------------------------------------------------

  it("produces no differences for a fully consistent baseline input", () => {
    const { differences } = compareAlignment(baselineInput());
    expect(differences).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Core property: every emitted difference is fully source-attributed
  // -------------------------------------------------------------------------

  it("every difference has non-empty sourcePaths on both sides", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const { differences } = compareAlignment({
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} to operate.\n`,
          ),
        });

        for (const diff of differences) {
          expect(diff.sourcePaths[0].trim()).not.toBe("");
          expect(diff.sourcePaths[1].trim()).not.toBe("");
          expect(typeof diff.sourcePaths[0]).toBe("string");
          expect(typeof diff.sourcePaths[1]).toBe("string");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every difference has non-empty exactDifference text", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const { differences } = compareAlignment({
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} to operate.\n`,
          ),
        });

        for (const diff of differences) {
          expect(diff.exactDifference.trim()).not.toBe("");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every difference has a non-empty recommendedResolution", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const { differences } = compareAlignment({
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} to operate.\n`,
          ),
        });

        for (const diff of differences) {
          expect(diff.recommendedResolution.trim()).not.toBe("");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every difference has a valid surface value", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const { differences } = compareAlignment({
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} to operate.\n`,
          ),
        });

        for (const diff of differences) {
          expect(VALID_SURFACES).toContain(diff.surface);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every difference has a valid dimension value", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const { differences } = compareAlignment({
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} to operate.\n`,
          ),
        });

        for (const diff of differences) {
          expect(VALID_DIMENSIONS as readonly string[]).toContain(diff.dimension);
        }
      }),
      { numRuns: 100 },
    );
  });

  // -------------------------------------------------------------------------
  // validateAlignmentDifference passes for all generated differences
  // -------------------------------------------------------------------------

  it("every difference passes the structural validation invariant (validateAlignmentDifference returns null)", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const { differences } = compareAlignment({
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} for operations.\n`,
          ),
        });

        for (const diff of differences) {
          const violation = validateAlignmentDifference(diff);
          expect(violation).toBeNull();
        }
      }),
      { numRuns: 100 },
    );
  });

  // -------------------------------------------------------------------------
  // Dimension-specific source attribution checks
  // -------------------------------------------------------------------------

  it("a runbook reference missing from package.json produces a command difference citing runbook and package.json paths", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const { differences } = compareAlignment({
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} to operate.\n`,
          ),
        });

        const commandDiffs = differences.filter((d) => d.dimension === "command");
        expect(commandDiffs.length).toBeGreaterThan(0);

        const matching = commandDiffs.find((d) =>
          d.exactDifference.includes(phantomScript),
        );
        expect(matching).toBeDefined();
        expect(matching!.sourcePaths).toContain("OPERATIONS_RUNBOOK.md");
        expect(matching!.sourcePaths).toContain("package.json");
      }),
      { numRuns: 100 },
    );
  });

  it("a CI workflow command missing from package.json produces a command difference citing workflow and package.json paths", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const { differences } = compareAlignment({
          ...baselineInput(),
          ciWorkflow: makeSource(
            ".github/workflows/supabase-backup-r2.yml",
            [
              "on:",
              "  schedule:",
              "    - cron: '0 2 * * *'",
              "jobs:",
              "  backup:",
              "    runs-on: ubuntu-latest",
              "    steps:",
              `      - run: pnpm run ${phantomScript}`,
            ].join("\n"),
          ),
        });

        const commandDiffs = differences.filter((d) => d.dimension === "command");
        expect(commandDiffs.length).toBeGreaterThan(0);

        const matching = commandDiffs.find((d) =>
          d.exactDifference.includes(phantomScript),
        );
        expect(matching).toBeDefined();
        expect(matching!.sourcePaths).toContain(
          ".github/workflows/supabase-backup-r2.yml",
        );
        expect(matching!.sourcePaths).toContain("package.json");
      }),
      { numRuns: 100 },
    );
  });

  it("an undocumented vercel.json env var produces an environment difference citing vercel.json and runbook paths", () => {
    fc.assert(
      fc.property(envVarNameArb, (envVar) => {
        const { differences } = compareAlignment({
          ...baselineInput(),
          vercelConfig: makeSource(
            "vercel.json",
            JSON.stringify({ version: 2, env: { [envVar]: "@secret" } }),
          ),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            "# Runbook\nNo environment variables documented here.\n",
          ),
        });

        const envDiffs = differences.filter((d) => d.dimension === "environment");
        expect(envDiffs.length).toBeGreaterThan(0);

        const matching = envDiffs.find((d) => d.exactDifference.includes(envVar));
        expect(matching).toBeDefined();
        expect(matching!.sourcePaths).toContain("vercel.json");
        expect(matching!.sourcePaths).toContain("OPERATIONS_RUNBOOK.md");
      }),
      { numRuns: 100 },
    );
  });

  it("a recovery procedure command missing from package.json produces a recovery difference citing runbook and package.json paths", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const { differences } = compareAlignment({
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            [
              "# Runbook",
              "## Recovery",
              `Run pnpm run ${phantomScript} to restore the database.`,
            ].join("\n"),
          ),
        });

        const recoveryDiffs = differences.filter((d) => d.dimension === "recovery");
        expect(recoveryDiffs.length).toBeGreaterThan(0);

        for (const diff of recoveryDiffs) {
          expect(diff.sourcePaths[0].trim()).not.toBe("");
          expect(diff.sourcePaths[1].trim()).not.toBe("");
          expect(diff.exactDifference.trim()).not.toBe("");
          expect(diff.recommendedResolution.trim()).not.toBe("");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("a CI workflow automating backup without approval gate produces an approval difference citing workflow and runbook paths", () => {
    const input: AlignmentInput = {
      ...baselineInput(),
      runbook: makeSource(
        "OPERATIONS_RUNBOOK.md",
        [
          "# Runbook",
          "An authorized owner must approve the backup run.",
          "Approval required before triggering the backup workflow.",
        ].join("\n"),
      ),
      ciWorkflow: makeSource(
        ".github/workflows/supabase-backup-r2.yml",
        [
          "on:",
          "  schedule:",
          "    - cron: '0 2 * * *'",
          "jobs:",
          "  backup:",
          "    runs-on: ubuntu-latest",
          "    steps:",
          "      - run: pnpm run r2:backup",
          // intentionally no environment: or required_reviewers:, no recovery ref
        ].join("\n"),
      ),
    };

    const { differences } = compareAlignment(input);
    const approvalDiffs = differences.filter((d) => d.dimension === "approval");
    expect(approvalDiffs.length).toBeGreaterThan(0);

    for (const diff of approvalDiffs) {
      expect(diff.sourcePaths).toContain(".github/workflows/supabase-backup-r2.yml");
      expect(diff.sourcePaths).toContain("OPERATIONS_RUNBOOK.md");
      expect(diff.exactDifference.trim()).not.toBe("");
      expect(diff.recommendedResolution.trim()).not.toBe("");
    }
  });

  // -------------------------------------------------------------------------
  // Determinism: same input always produces the same output
  // -------------------------------------------------------------------------

  it("compareAlignment is deterministic — identical inputs produce identical outputs", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const input: AlignmentInput = {
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} for operations.\n`,
          ),
        };

        const r1 = compareAlignment(input);
        const r2 = compareAlignment(input);

        expect(r1.differences).toHaveLength(r2.differences.length);
        for (let i = 0; i < r1.differences.length; i++) {
          expect(r1.differences[i]!.sourcePaths).toEqual(r2.differences[i]!.sourcePaths);
          expect(r1.differences[i]!.exactDifference).toBe(r2.differences[i]!.exactDifference);
          expect(r1.differences[i]!.recommendedResolution).toBe(
            r2.differences[i]!.recommendedResolution,
          );
        }
      }),
      { numRuns: 50 },
    );
  });

  // -------------------------------------------------------------------------
  // No difference is emitted without source attribution (the core invariant)
  // -------------------------------------------------------------------------

  it("no difference is emitted without complete source attribution across varied inputs", () => {
    fc.assert(
      fc.property(
        fc.record({
          phantomScript: phantomScriptArb,
          envVar: envVarNameArb,
        }),
        ({ phantomScript, envVar }) => {
          const inputs: AlignmentInput[] = [
            // Runbook command mismatch
            {
              ...baselineInput(),
              runbook: makeSource(
                "OPERATIONS_RUNBOOK.md",
                `# Runbook\nRun pnpm run ${phantomScript} to operate.\n`,
              ),
            },
            // CI command mismatch
            {
              ...baselineInput(),
              ciWorkflow: makeSource(
                ".github/workflows/supabase-backup-r2.yml",
                `on:\n  schedule:\n    - cron: '0 2 * * *'\njobs:\n  backup:\n    steps:\n      - run: pnpm run ${phantomScript}\n`,
              ),
            },
            // Env var mismatch
            {
              ...baselineInput(),
              vercelConfig: makeSource(
                "vercel.json",
                JSON.stringify({ version: 2, env: { [envVar]: "@secret" } }),
              ),
              runbook: makeSource("OPERATIONS_RUNBOOK.md", "# Runbook\nNo vars.\n"),
            },
          ];

          for (const input of inputs) {
            const { differences } = compareAlignment(input);
            for (const diff of differences) {
              // Core invariant: both source paths must be non-empty strings
              expect(diff.sourcePaths[0].trim().length).toBeGreaterThan(0);
              expect(diff.sourcePaths[1].trim().length).toBeGreaterThan(0);
              // Core invariant: exact difference and resolution must be non-empty
              expect(diff.exactDifference.trim().length).toBeGreaterThan(0);
              expect(diff.recommendedResolution.trim().length).toBeGreaterThan(0);
              // Structural invariant
              expect(validateAlignmentDifference(diff)).toBeNull();
            }
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});
