// @vitest-environment node

import { resolve } from "node:path";

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  evaluateSkills,
  PRIMARY_REPOSITORY_GUIDANCE_SKILL,
  STEERING_PATH,
  STEERING_ROOT,
  type SkillEvaluatorInput,
} from "../../../scripts/kiro-repo-guidance-setup/skills.ts";
import {
  INITIAL_SKILL_CANDIDATES,
  OWNER_DECISIONS,
  type OwnerDecision,
  type RepositoryPath,
  type ValidationRun,
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";

const repositoryRoot = resolve("D:\\23082026");
const RECORDED_OD08 = OWNER_DECISIONS.find((decision) => decision.decisionId === "OD-08") as OwnerDecision;
const ALLOWED_RESOLUTIONS = ["merge", "delegate", "retire", "reject"] as const;
const PRIMARY_SKILL_PATH = `.kiro/skills/${PRIMARY_REPOSITORY_GUIDANCE_SKILL}/SKILL.md`;

// The evaluator delegates these known steering files to a specialized skill.
// Generating them exercises the overlap-graph branch beyond the base relationship model.
const KNOWN_STEERING_FILES = [
  "graph-layer.md",
  "testing.md",
  "planner-studio.md",
  "ui-css.md",
  "database.md",
] as const;

/**
 * A fresh, passing Local_Repository_Surface validation run for one skill. This
 * mirrors the shape the evaluator accepts as activation evidence.
 */
function passingValidationRun(skill: string): ValidationRun {
  const validationId = `validation:skill:${skill}`;
  const path = `.kiro/skills/${skill}/SKILL.md`;
  return {
    validationId,
    action: "validate local skill manifest and prerequisites",
    repositoryRootOrActiveSurface: repositoryRoot,
    surface: "Local_Repository_Surface",
    version: "repository",
    scope: `${path}; manifest; prerequisites; repository-local evidence; rollback path`,
    executionLayer: "surface_validation",
    startedAtUtc: "2026-08-25T12:00:00Z",
    result: "pass",
    blocker: "none",
    commandOrInteraction: "read-only repository-local skill manifest and prerequisite validation",
    exitCodeOrOutcome: "exit 0",
    evidenceRefs: [validationId],
    unverifiedItems: [],
  };
}

/**
 * A validation run that must NOT satisfy the activation predicate: it either
 * targets a different surface/version, is not fresh (fails/partial), or carries
 * an unverified item. Property 8 requires none of these enables an activation
 * claim.
 */
type StaleKind = "wrong-surface" | "wrong-version" | "not-pass" | "has-unverified" | "has-blocker";

function staleValidationRun(skill: string, kind: StaleKind): ValidationRun {
  const base = passingValidationRun(skill);
  switch (kind) {
    case "wrong-surface":
      return { ...base, surface: "IDE" };
    case "wrong-version":
      return { ...base, version: "3.x" };
    case "not-pass":
      return { ...base, result: "fail", exitCodeOrOutcome: "exit 1" };
    case "has-unverified":
      return { ...base, unverifiedItems: ["activation behavior not confirmed on target surface"] };
    case "has-blocker":
      return { ...base, blocker: "activation validation interrupted" };
  }
}

/** OD-08 in an unresolved/rejected state cannot satisfy the OD-08 predicate. */
type UnusableOd08Kind = "rejected" | "unresolved" | "empty-owner";

function unusableOd08(kind: UnusableOd08Kind): OwnerDecision {
  switch (kind) {
    case "rejected":
      return { ...RECORDED_OD08, approvalStatus: "rejected" };
    case "unresolved":
      return { ...RECORDED_OD08, unresolvedStatus: "unresolved" };
    case "empty-owner":
      return { ...RECORDED_OD08, owner: "  " };
  }
}

/** Generator over steering path sets — the overlap graph the evaluator resolves. */
const steeringPathsArb: fc.Arbitrary<readonly RepositoryPath[] | undefined> = fc.oneof(
  fc.constant(undefined),
  fc
    .uniqueArray(
      fc.oneof(
        fc.constant(STEERING_PATH as RepositoryPath),
        ...KNOWN_STEERING_FILES.map(
          (file) => fc.constant(`${STEERING_ROOT}/${file}` as RepositoryPath),
        ),
        // Unknown steering files exercise the "retain, no delegation" branch.
        fc
          .stringMatching(/^[a-z][a-z0-9-]{2,12}$/)
          .map((name) => `${STEERING_ROOT}/${name}.md` as RepositoryPath),
      ),
      { minLength: 1, maxLength: 6 },
    ),
);

describe("Property 8: Skill authority is unique and prerequisites are explicit", () => {
  // Feature: kiro-repo-guidance-setup, Property 8: Skill authority is unique and prerequisites are explicit
  // **Validates: Requirements 6.2, 6.4, 6.5, 6.6**

  it("keeps exactly one primary skill and resolves every non-authoritative path across all overlap graphs", () => {
    fc.assert(
      fc.property(
        steeringPathsArb,
        fc.boolean(),
        (steeringPaths, provideOd08) => {
          const input: SkillEvaluatorInput = {
            repositoryRoot,
            ...(steeringPaths ? { steeringPaths } : {}),
            ...(provideOd08 ? { ownerDecisions: [RECORDED_OD08] } : {}),
          };
          const result = evaluateSkills(input);
          const output = result.output;
          expect(output).toBeDefined();
          if (!output) return;

          // Exactly one primary skill, and it is repo-map.
          const primaries = output.skills.filter((skill) => skill.isPrimaryRepositoryGuidanceSkill);
          expect(primaries).toHaveLength(1);
          expect(primaries[0]?.folderName).toBe(PRIMARY_REPOSITORY_GUIDANCE_SKILL);
          expect(output.primaryRepositoryGuidanceSkill).toBe(PRIMARY_REPOSITORY_GUIDANCE_SKILL);

          // Every non-authoritative path carries an allowed resolution.
          for (const resolution of output.overlapResolutions) {
            expect(ALLOWED_RESOLUTIONS).toContain(resolution.resolution);
            expect(resolution.authoritativePath.length).toBeGreaterThan(0);
            expect(resolution.reason.length).toBeGreaterThan(0);
          }

          // Every non-primary skill has at least one recorded overlap resolution
          // delegating its shared authority to repo-map.
          for (const skill of output.skills) {
            if (skill.folderName === PRIMARY_REPOSITORY_GUIDANCE_SKILL) continue;
            const delegatesToPrimary = output.overlapResolutions.some(
              (resolution) =>
                resolution.sourcePath === skill.path &&
                resolution.authoritativePath === PRIMARY_SKILL_PATH,
            );
            expect(delegatesToPrimary).toBe(true);
          }

          // Every steering path in the overlap graph is resolved to an
          // authoritative path (merge/delegate/retire/reject), never left dangling.
          for (const steering of output.steering) {
            const hasResolutionOrRetains =
              output.overlapResolutions.some((resolution) => resolution.sourcePath === steering.path) ||
              steering.overlapResolution.length > 0;
            expect(hasResolutionOrRetains).toBe(true);
          }
        },
      ),
      { numRuns: 150 },
    );
  });

  it("emits no activation claim unless OD-08, a valid manifest, prerequisites, and rollback are all present", () => {
    fc.assert(
      fc.property(
        // OD-08: absent, unusable, or recorded.
        fc.oneof(
          fc.constant<{ readonly kind: "absent" }>({ kind: "absent" }),
          fc
            .constantFrom<UnusableOd08Kind>("rejected", "unresolved", "empty-owner")
            .map((kind) => ({ kind: "unusable", detail: kind }) as const),
          fc.constant<{ readonly kind: "recorded" }>({ kind: "recorded" }),
        ),
        // Validation evidence: none, stale, or fresh-passing for every skill.
        fc.oneof(
          fc.constant<{ readonly kind: "none" }>({ kind: "none" }),
          fc
            .constantFrom<StaleKind>("wrong-surface", "wrong-version", "not-pass", "has-unverified", "has-blocker")
            .map((detail) => ({ kind: "stale", detail }) as const),
          fc.constant<{ readonly kind: "fresh" }>({ kind: "fresh" }),
        ),
        (od08Choice, evidenceChoice) => {
          const ownerDecisions =
            od08Choice.kind === "recorded"
              ? [RECORDED_OD08]
              : od08Choice.kind === "unusable"
                ? [unusableOd08(od08Choice.detail)]
                : [];

          const validationRuns =
            evidenceChoice.kind === "fresh"
              ? INITIAL_SKILL_CANDIDATES.map((skill) => passingValidationRun(skill))
              : evidenceChoice.kind === "stale"
                ? INITIAL_SKILL_CANDIDATES.map((skill) => staleValidationRun(skill, evidenceChoice.detail))
                : [];

          const od08Usable = od08Choice.kind === "recorded";
          const evidenceUsable = evidenceChoice.kind === "fresh";
          const shouldClaim = od08Usable && evidenceUsable;

          const result = evaluateSkills({ repositoryRoot, reviewDateUtc: "2026-08-25", ownerDecisions, validationRuns });
          const output = result.output;
          expect(output).toBeDefined();
          if (!output) return;

          // Aggregate activation claim gate.
          expect(output.activationScopeClaimsAllowed).toBe(shouldClaim);

          if (shouldClaim) {
            // With all predicates satisfied every skill may claim activation, and
            // each carries the fresh validation reference and a rollback path.
            expect(output.skills.every((skill) => skill.activationClaimed)).toBe(true);
            expect(output.skills.every((skill) => skill.activationBlockers.length === 0)).toBe(true);
            expect(output.skills.every((skill) => skill.validationRunRefs.length > 0)).toBe(true);
            expect(output.skills.every((skill) => skill.rollbackPath.length > 0)).toBe(true);
            expect(output.skills.every((skill) => !skill.activationScope.startsWith("unverified:"))).toBe(true);
          } else {
            // Any missing predicate must leave every skill fail-closed: no
            // activation claim, an explicit blocker, and an unverified scope.
            expect(output.skills.every((skill) => skill.activationClaimed === false)).toBe(true);
            expect(output.skills.every((skill) => skill.activationBlockers.length > 0)).toBe(true);
            expect(output.skills.every((skill) => skill.activationScope.startsWith("unverified:"))).toBe(true);
            // Manifests still carry a rollback path even when inactive.
            expect(output.skills.every((skill) => skill.rollbackPath.length > 0)).toBe(true);
          }
        },
      ),
      { numRuns: 150 },
    );
  });
});
