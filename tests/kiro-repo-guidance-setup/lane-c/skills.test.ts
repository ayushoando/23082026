// @vitest-environment node

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import { describe, afterEach, expect, it } from "vitest";

import {
  evaluateSkills,
  PRIMARY_REPOSITORY_GUIDANCE_SKILL,
  SKILL_ROOT,
  STEERING_PATH,
} from "../../../scripts/kiro-repo-guidance-setup/skills.ts";
import {
  INITIAL_SKILL_CANDIDATES,
  OWNER_DECISIONS,
  type OwnerDecision,
  type ValidationRun,
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";

const repositoryRoot = resolve("D:\\23082026");
const temporaryRoots: string[] = [];

function createValidationRun(skill: string, overrides: Partial<ValidationRun> = {}): ValidationRun {
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
    commandOrInteraction: "read-only repository-local skill manifest and prerequisite validation",
    exitCodeOrOutcome: "exit 0",
    evidenceRefs: [validationId],
    unverifiedItems: [],
    blocker: "none",
    ...overrides,
  };
}

function createFixture(overrides: { readonly wrongName?: string; readonly extra?: boolean } = {}): string {
  const root = mkdtempSync(join(tmpdir(), "kiro-skills-"));
  temporaryRoots.push(root);

  const manifestSourceRoot = join(repositoryRoot, SKILL_ROOT);
  for (const skill of INITIAL_SKILL_CANDIDATES) {
    const skillDirectory = join(root, ".kiro", "skills", skill);
    mkdirSync(skillDirectory, { recursive: true });
    let manifest = readFileSync(join(manifestSourceRoot, skill, "SKILL.md"), "utf8");
    if (skill === "repo-map" && overrides.wrongName) {
      manifest = manifest.replace("name: repo-map", `name: ${overrides.wrongName}`);
    }
    writeFileSync(join(skillDirectory, "SKILL.md"), manifest, "utf8");
  }

  const canonicalPaths = new Set<string>([
    "AGENTS.md",
    "START.md",
    "Testing-handbook.md",
    "package.json",
    ".github/instructions/boundaries.instructions.md",
    ".github/instructions/focss.instructions.md",
    ".github/instructions/migrations.instructions.md",
    "Agents/02-testing.md",
    "Agents/07-css.md",
    "docs/architecture/layout.md",
    "docs/architecture/stack.md",
    "docs/architecture/routes.md",
    "docs/architecture/product-map.md",
    "docs/architecture/css.md",
    "docs/database/schema.md",
    "docs/database/ops.md",
    "config/build/postcss.config.mjs",
    "scripts/graph-impact.mjs",
    "scripts/scan-boundaries.mjs",
    "site/platform/supabase",
    "tests/vitest.config.ts",
    "tests/vitest.tech-docs.config.ts",
  ]);
  canonicalPaths.add(STEERING_PATH);

  for (const path of canonicalPaths) {
    const absolutePath = join(root, path);
    if (path === "site/platform/supabase") {
      mkdirSync(absolutePath, { recursive: true });
      continue;
    }
    mkdirSync(join(absolutePath, ".."), { recursive: true });
    if (path === "package.json") {
      writeFileSync(
        absolutePath,
        JSON.stringify(
          {
            scripts: {
              "docs:sync": "node scripts/docs-sync.mjs",
              "gate:fast": "node scripts/gate-fast.mjs",
              gate: "node scripts/gate.mjs",
              "scan:boundaries": "node scripts/scan-boundaries.mjs",
              "verify:focss": "node scripts/verify-focss.mjs",
              "lint:ui:strict": "node scripts/lint-ui.mjs",
              "check:style-tokens": "node scripts/style-tokens.mjs",
              "db:apply": "node scripts/db-apply.mjs",
              "db:apply:admin": "node scripts/db-apply-admin.mjs",
              "db:types": "node scripts/db-types.mjs",
              "db:types:admin": "node scripts/db-types-admin.mjs",
            },
          },
          null,
          2,
        ),
        "utf8",
      );
    } else if (path === STEERING_PATH) {
      writeFileSync(absolutePath, "---\ninclusion: always\n---\nrelationship fixture\n", "utf8");
    } else {
      writeFileSync(absolutePath, "fixture\n", "utf8");
    }
  }

  if (overrides.extra) {
    mkdirSync(join(root, ".kiro", "skills", "extra"), { recursive: true });
    writeFileSync(
      join(root, ".kiro", "skills", "extra", "SKILL.md"),
      "---\nname: extra\ndescription: Use when testing an extra repository skill manifest scope.\n---\n",
      "utf8",
    );
  }

  return root;
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) rmSync(root, { recursive: true, force: true });
  }
});

describe("SkillEvaluator", () => {
  it("validates the six live manifests, designates repo-map, and resolves all overlaps without claiming activation", () => {
    const result = evaluateSkills({ repositoryRoot });

    expect(result.status).toBe("partial");
    expect(result.output?.skills).toHaveLength(6);
    expect(result.output?.exactCandidateSet).toEqual(INITIAL_SKILL_CANDIDATES);
    expect(result.output?.primaryRepositoryGuidanceSkill).toBe(PRIMARY_REPOSITORY_GUIDANCE_SKILL);
    expect(result.output?.skills.filter((skill) => skill.isPrimaryRepositoryGuidanceSkill)).toHaveLength(1);
    expect(result.output?.skills.find((skill) => skill.folderName === "repo-map")?.manifestValid).toBe(true);
    expect(result.output?.skills.every((skill) => skill.inventoryStatus === "present and readable")).toBe(true);
    expect(result.output?.skills.every((skill) => skill.owner === "repository owner")).toBe(true);
    expect(result.output?.skills.every((skill) => skill.rollbackPath.length > 0)).toBe(true);
    expect(result.output?.skills.every((skill) => skill.activationClaimed === false)).toBe(true);
    expect(result.output?.activationScopeClaimsAllowed).toBe(false);
    expect(result.output?.skills.every((skill) => skill.activationScope.startsWith("unverified:"))).toBe(true);

    const resolutions = result.output?.overlapResolutions ?? [];
    expect(resolutions.length).toBeGreaterThanOrEqual(11);
    expect(resolutions.every((resolution) => ["merge", "delegate", "retire", "reject"].includes(resolution.resolution))).toBe(
      true,
    );
    expect(
      resolutions
        .filter((resolution) => resolution.targetPath.endsWith("repo-map/SKILL.md"))
        .every((resolution) => resolution.authoritativePath.endsWith("repo-map/SKILL.md")),
    ).toBe(true);
    expect(
      resolutions
        .filter((resolution) => resolution.sourcePath.includes("steering/") && !resolution.targetPath.endsWith("repo-map/SKILL.md"))
        .every((resolution) => resolution.authoritativePath === resolution.targetPath),
    ).toBe(true);
    expect(result.output?.steering).toHaveLength(11);
    expect(result.output?.steering.find((record) => record.path === STEERING_PATH)?.inclusion).toBe("always");
    expect(result.output?.steering.every((record) => record.inventoryStatus === "present and readable")).toBe(true);
  });

  it("claims activation scope only with OD-08 and a fresh passing local validation for every skill", () => {
    const od08 = OWNER_DECISIONS.find((decision) => decision.decisionId === "OD-08") as OwnerDecision;
    const validationRuns = INITIAL_SKILL_CANDIDATES.map((skill) => createValidationRun(skill));
    const result = evaluateSkills({ repositoryRoot, reviewDateUtc: "2026-08-25", ownerDecisions: [od08], validationRuns });

    expect(result.status).toBe("pass");
    expect(result.output?.activationScopeClaimsAllowed).toBe(true);
    expect(result.output?.skills.every((skill) => skill.activationClaimed)).toBe(true);
    expect(result.output?.skills.every((skill) => !skill.activationScope.startsWith("unverified:"))).toBe(true);
    expect(result.output?.activationEvidenceRefs).toHaveLength(6);
    expect(result.output?.skills.every((skill) => skill.validationRunRefs.length === 1)).toBe(true);
  });

  it("does not claim activation from a rejected or unresolved OD-08 record", () => {
    const recordedOd08 = OWNER_DECISIONS.find((decision) => decision.decisionId === "OD-08") as OwnerDecision;
    const unresolvedOd08 = {
      ...recordedOd08,
      approvalStatus: "rejected",
      unresolvedStatus: "unresolved",
    } as OwnerDecision;
    const validationRuns = INITIAL_SKILL_CANDIDATES.map((skill) => createValidationRun(skill));
    const result = evaluateSkills({ repositoryRoot, reviewDateUtc: "2026-08-25", ownerDecisions: [unresolvedOd08], validationRuns });

    expect(result.status).toBe("partial");
    expect(result.output?.activationScopeClaimsAllowed).toBe(false);
    expect(result.output?.skills.every((skill) => skill.activationClaimed === false)).toBe(true);
    expect(result.output?.activationBlockers).toHaveLength(6);
  });


  it("does not treat a passing record as fresh without the review-date anchor", () => {
    const od08 = OWNER_DECISIONS.find((decision) => decision.decisionId === "OD-08") as OwnerDecision;
    const validationRuns = INITIAL_SKILL_CANDIDATES.map((skill) => createValidationRun(skill));
    const result = evaluateSkills({ repositoryRoot, ownerDecisions: [od08], validationRuns });

    expect(result.status).toBe("partial");
    expect(result.output?.activationScopeClaimsAllowed).toBe(false);
    expect(result.output?.skills.every((skill) => skill.activationClaimed === false)).toBe(true);
    expect(result.output?.activationBlockers.every((blocker) => blocker.includes("no review date"))).toBe(true);
  });

  it("requires fresh local evidence for this repository root and explicit manifest prerequisites", () => {
    const od08 = OWNER_DECISIONS.find((decision) => decision.decisionId === "OD-08") as OwnerDecision;
    const cases: readonly Partial<ValidationRun>[] = [
      { startedAtUtc: "2026-08-24T12:00:00Z" },
      { repositoryRootOrActiveSurface: resolve("D:/other-repository") },
      {
        action: "validate local skill manifest",
        scope: ".kiro/skills/repo-map/SKILL.md; manifest; repository-local evidence; rollback path",
        commandOrInteraction: "read-only repository-local skill manifest validation",
      },
    ];

    for (const overrides of cases) {
      const validationRuns = INITIAL_SKILL_CANDIDATES.map((skill) => createValidationRun(skill, overrides));
      const result = evaluateSkills({
        repositoryRoot,
        reviewDateUtc: "2026-08-25",
        ownerDecisions: [od08],
        validationRuns,
      });

      expect(result.status).toBe("partial");
      expect(result.output?.activationScopeClaimsAllowed).toBe(false);
      expect(result.output?.skills.every((skill) => skill.activationClaimed === false)).toBe(true);
    }
  });

  it("blocks a folder/name mismatch and preserves fail-closed disposition", () => {
    const root = createFixture({ wrongName: "not-repo-map" });
    const result = evaluateSkills({ repositoryRoot: root });
    const repoMap = result.output?.skills.find((skill) => skill.folderName === "repo-map");

    expect(result.status).toBe("blocked");
    expect(result.output?.activationScopeClaimsAllowed).toBe(false);
    expect(repoMap?.manifestValid).toBe(false);
    expect(repoMap?.disposition).toBe("defer");
    expect(repoMap?.manifestName).toBe("not-repo-map");
    expect(repoMap?.activationClaimed).toBe(false);
  });

  it("blocks an extra manifest instead of silently expanding the candidate set", () => {
    const root = createFixture({ extra: true });
    const result = evaluateSkills({ repositoryRoot: root });

    expect(result.status).toBe("blocked");
    expect(result.output?.skills).toHaveLength(6);
    expect(result.output?.exactCandidateSet).toEqual(INITIAL_SKILL_CANDIDATES);
    expect(result.blockers.some((blocker) => blocker.includes("exactly six manifests"))).toBe(true);
    expect(result.output?.activationScopeClaimsAllowed).toBe(false);
  });
});
