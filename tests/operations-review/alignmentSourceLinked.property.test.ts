// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 12: Alignment comparison produces complete, source-linked differences.
//
// Validates: Requirements 9.1, 9.2

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  compareAlignment,
  validateAlignmentDifference,
  type AlignmentInput,
  type RepositorySource,
} from "../../scripts/operations-review";

// ---------------------------------------------------------------------------
// Valid dimension set
// ---------------------------------------------------------------------------

const ALIGNMENT_DIMENSIONS = [
  "command",
  "owner",
  "environment",
  "order",
  "approval",
  "recovery",
] as const;

// ---------------------------------------------------------------------------
// Source fixture helpers
// ---------------------------------------------------------------------------

function makeSource(path: string, content: string): RepositorySource {
  return {
    content,
    source: {
      path,
      locator: `alignment-test fixture for ${path}`,
      observedAt: "2026-01-01T00:00:00.000Z",
      contentDigest: `digest-${path}`,
    },
  };
}

/**
 * Minimal baseline AlignmentInput where no mismatch is expected.
 * All runbook script references exist in package.json; no orphaned commands.
 */
function baselineInput(): AlignmentInput {
  return {
    runbook: makeSource(
      "OPERATIONS_RUNBOOK.md",
      [
        "# Operations Runbook",
        "## Deployment",
        "Run `pnpm run vercel:prod` to deploy.",
        "Run `pnpm run worker:deploy` for the Worker.",
        "## Backup",
        "Run `pnpm run backup:supabase:r2` for backups.",
        "## Recovery",
        "Run `pnpm run db:restore` for database recovery.",
      ].join("\n"),
    ),
    rootPackage: makeSource(
      "package.json",
      JSON.stringify({
        scripts: {
          "vercel:prod": "vercel --prod",
          "worker:deploy": "wrangler deploy",
          "backup:supabase:r2": "node scripts/backup.mjs",
          "db:restore": "node scripts/restore.mjs",
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
        "      - run: pnpm run backup:supabase:r2",
        "      # recovery: restore via db:restore",
      ].join("\n"),
    ),
    operationsRouter: makeSource(
      "scripts/run-ops.mjs",
      "// operations router\n",
    ),
  };
}

// ---------------------------------------------------------------------------
// Arbitraries for mismatch injection
// ---------------------------------------------------------------------------

/** A well-formed script name that is unlikely to collide with baseline scripts. */
const phantomScriptArb = fc
  .stringMatching(/^[a-z][a-z0-9-]{3,20}$/)
  .filter(
    (s) =>
      ![
        "vercel:prod",
        "worker:deploy",
        "backup:supabase:r2",
        "db:restore",
      ].includes(s),
  );

/** An all-caps environment variable name. */
const envVarArb = fc.stringMatching(/^[A-Z][A-Z0-9_]{3,30}$/);

// ---------------------------------------------------------------------------
// Property 12 tests
// ---------------------------------------------------------------------------

describe("Property 12: Alignment comparison produces complete, source-linked differences", () => {
  it("returns no differences for a fully consistent baseline input", () => {
    const result = compareAlignment(baselineInput());
    // Baseline has no mismatches — all runbook references exist in package.json
    // and the CI workflow only uses existing commands.
    expect(result.differences).toHaveLength(0);
  });

  it("every detected difference has both non-empty source paths", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        // Inject a runbook reference to a script that doesn't exist
        const input: AlignmentInput = {
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} to operate.\n`,
          ),
        };
        const { differences } = compareAlignment(input);

        for (const diff of differences) {
          expect(diff.sourcePaths[0].trim()).not.toBe("");
          expect(diff.sourcePaths[1].trim()).not.toBe("");
          // Both paths should be non-identical (two different sources compared)
          // They may or may not be equal depending on the dimension, but each
          // must be a valid non-empty path string.
          expect(typeof diff.sourcePaths[0]).toBe("string");
          expect(typeof diff.sourcePaths[1]).toBe("string");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every detected difference has non-empty exactDifference and recommendedResolution", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const input: AlignmentInput = {
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} to operate.\n`,
          ),
        };
        const { differences } = compareAlignment(input);

        for (const diff of differences) {
          expect(diff.exactDifference.trim()).not.toBe("");
          expect(diff.recommendedResolution.trim()).not.toBe("");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every detected difference has a valid dimension", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const input: AlignmentInput = {
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} to operate.\n`,
          ),
        };
        const { differences } = compareAlignment(input);

        for (const diff of differences) {
          expect(ALIGNMENT_DIMENSIONS).toContain(diff.dimension);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("a runbook command reference missing from package.json produces a command-dimension difference", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const input: AlignmentInput = {
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} to operate.\n`,
          ),
        };
        const { differences } = compareAlignment(input);

        const commandDiffs = differences.filter(
          (d) => d.dimension === "command",
        );
        expect(commandDiffs.length).toBeGreaterThan(0);

        const matchingDiff = commandDiffs.find((d) =>
          d.exactDifference.includes(phantomScript),
        );
        expect(matchingDiff).toBeDefined();
        expect(matchingDiff!.sourcePaths).toContain("OPERATIONS_RUNBOOK.md");
        expect(matchingDiff!.sourcePaths).toContain("package.json");
      }),
      { numRuns: 100 },
    );
  });

  it("a CI command reference missing from package.json produces a command-dimension difference", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const input: AlignmentInput = {
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
        };
        const { differences } = compareAlignment(input);

        const commandDiffs = differences.filter(
          (d) => d.dimension === "command",
        );
        expect(commandDiffs.length).toBeGreaterThan(0);

        const matchingDiff = commandDiffs.find((d) =>
          d.exactDifference.includes(phantomScript),
        );
        expect(matchingDiff).toBeDefined();
        expect(matchingDiff!.sourcePaths).toContain(
          ".github/workflows/supabase-backup-r2.yml",
        );
        expect(matchingDiff!.sourcePaths).toContain("package.json");
      }),
      { numRuns: 100 },
    );
  });

  it("an undocumented vercel.json env var produces an environment-dimension difference", () => {
    fc.assert(
      fc.property(envVarArb, (envVar) => {
        const input: AlignmentInput = {
          ...baselineInput(),
          vercelConfig: makeSource(
            "vercel.json",
            JSON.stringify({ version: 2, env: { [envVar]: "@secret" } }),
          ),
          // Runbook has no reference to this var
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            "# Runbook\nNo environment variables documented here.\n",
          ),
        };
        const { differences } = compareAlignment(input);

        const envDiffs = differences.filter(
          (d) => d.dimension === "environment",
        );
        expect(envDiffs.length).toBeGreaterThan(0);

        const matchingDiff = envDiffs.find((d) =>
          d.exactDifference.includes(envVar),
        );
        expect(matchingDiff).toBeDefined();
        expect(matchingDiff!.sourcePaths).toContain("vercel.json");
        expect(matchingDiff!.sourcePaths).toContain("OPERATIONS_RUNBOOK.md");
      }),
      { numRuns: 100 },
    );
  });

  it("every difference passes the structural validation invariant", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const input: AlignmentInput = {
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} for operations.\n`,
          ),
        };
        const { differences } = compareAlignment(input);

        for (const diff of differences) {
          const violation = validateAlignmentDifference(diff);
          expect(violation).toBeNull();
        }
      }),
      { numRuns: 100 },
    );
  });

  it("differences from independent mismatch types do not share sourcePath pairs in conflicting order", () => {
    // For a given pair of sources, the comparison order should be deterministic.
    // Calling compareAlignment twice with the same input must produce the same results.
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const input: AlignmentInput = {
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            `# Runbook\nRun pnpm run ${phantomScript} for operations.\n`,
          ),
        };
        const result1 = compareAlignment(input);
        const result2 = compareAlignment(input);

        // Determinism: same input → same output length and same paths
        expect(result1.differences).toHaveLength(result2.differences.length);
        for (let i = 0; i < result1.differences.length; i++) {
          expect(result1.differences[i]!.sourcePaths).toEqual(
            result2.differences[i]!.sourcePaths,
          );
          expect(result1.differences[i]!.exactDifference).toBe(
            result2.differences[i]!.exactDifference,
          );
        }
      }),
      { numRuns: 100 },
    );
  });

  it("a recovery-procedure command missing from package.json produces a recovery-dimension difference citing both paths", () => {
    fc.assert(
      fc.property(phantomScriptArb, (phantomScript) => {
        const input: AlignmentInput = {
          ...baselineInput(),
          runbook: makeSource(
            "OPERATIONS_RUNBOOK.md",
            [
              "# Runbook",
              "## Recovery",
              `Run pnpm run ${phantomScript} for database recovery.`,
            ].join("\n"),
          ),
        };
        const { differences } = compareAlignment(input);

        const recoveryDiffs = differences.filter(
          (d) => d.dimension === "recovery",
        );
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

  it("a CI workflow automating backup without approval or recovery reference produces an approval-dimension difference", () => {
    // The approval comparison fires when runbook requires approval but CI has none.
    const input: AlignmentInput = {
      ...baselineInput(),
      runbook: makeSource(
        "OPERATIONS_RUNBOOK.md",
        [
          "# Runbook",
          "An authorized owner must approve the backup run.",
          "Approval required before triggering backup workflow.",
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
          "      - run: pnpm run backup:supabase:r2",
          // no environment: or required_reviewers: line — no approval gate
          // no recovery reference
        ].join("\n"),
      ),
    };
    const { differences } = compareAlignment(input);

    const approvalDiffs = differences.filter((d) => d.dimension === "approval");
    expect(approvalDiffs.length).toBeGreaterThan(0);

    for (const diff of approvalDiffs) {
      expect(diff.sourcePaths).toContain(
        ".github/workflows/supabase-backup-r2.yml",
      );
      expect(diff.sourcePaths).toContain("OPERATIONS_RUNBOOK.md");
      expect(diff.exactDifference.trim()).not.toBe("");
      expect(diff.recommendedResolution.trim()).not.toBe("");
    }
  });
});
