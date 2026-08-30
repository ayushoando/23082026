// @vitest-environment node
//
// Feature: operations-deployment-backup-review
// Property 1: Evidence admission preserves the repository boundary.
//
// Validates: Requirements 1.4

import { fileURLToPath } from "node:url";

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  RepositorySourceAccessError,
  RepositorySourceAdapter,
  type AllowedRepositorySource,
} from "../../scripts/operations-review";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const pathSegmentArb = fc.stringMatching(/^[a-z][a-z0-9_-]{0,24}$/);

const unsupportedEvidencePathArb = fc.oneof(
  fc.constantFrom(
    ".env",
    ".env.local",
    "site/.env.local",
    "README.md",
    "tests/operations-review/untrusted-evidence.json",
    "scripts/operations-review/models.ts",
  ),
  pathSegmentArb.map((segment) => `unapproved/${segment}.txt`),
  pathSegmentArb.map((segment) => `../${segment}.txt`),
  pathSegmentArb.map((segment) => `C:\\${segment}.txt`),
);

describe("Property 1: Evidence admission preserves the repository boundary", () => {
  it("rejects every generated unsupported evidence source instead of admitting it as repository evidence", async () => {
    const sourceAdapter = new RepositorySourceAdapter(repositoryRoot);

    await fc.assert(
      fc.asyncProperty(unsupportedEvidencePathArb, async (candidatePath) => {
        await expect(
          sourceAdapter.readSource(
            candidatePath as AllowedRepositorySource,
            "generated unsupported evidence candidate",
          ),
        ).rejects.toBeInstanceOf(RepositorySourceAccessError);
      }),
      { numRuns: 100 },
    );
  });
});
