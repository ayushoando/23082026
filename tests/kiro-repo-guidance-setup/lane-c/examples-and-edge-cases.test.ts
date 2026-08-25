// @vitest-environment node

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import {
  evaluateCapabilities,
  type ExtensionCandidateInput,
} from "../../../scripts/kiro-repo-guidance-setup/capabilities.ts";
import {
  CONTINUITY_CAPABILITY_KINDS,
  CREW_INCOMPATIBLE_BEHAVIORS,
  GRAPH_IMPACT_MAX_ITERATIONS,
  LTM_CAPTURE_COMMAND,
  evaluateContinuity,
  type ContinuityCapabilityInput,
} from "../../../scripts/kiro-repo-guidance-setup/continuity.ts";
import { evaluateHooks } from "../../../scripts/kiro-repo-guidance-setup/hooks.ts";
import {
  INITIAL_SKILL_CANDIDATES,
  OWNER_DECISIONS,
  type RepositoryPath,
  type ValidationRun,
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";
import {
  evaluateSkills,
  PRIMARY_REPOSITORY_GUIDANCE_SKILL,
  SKILL_ROOT,
  STEERING_PATH,
  STEERING_ROOT,
} from "../../../scripts/kiro-repo-guidance-setup/skills.ts";

const repositoryRoot = resolve("D:\\23082026");
const temporaryRoots: string[] = [];

function createSkillOnlyRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "kiro-lane-c-skills-"));
  temporaryRoots.push(root);

  for (const skill of INITIAL_SKILL_CANDIDATES) {
    const targetDirectory = join(root, SKILL_ROOT, skill);
    mkdirSync(targetDirectory, { recursive: true });
    writeFileSync(
      join(targetDirectory, "SKILL.md"),
      readFileSync(join(repositoryRoot, SKILL_ROOT, skill, "SKILL.md"), "utf8"),
      "utf8",
    );
  }
  return root;
}

function createHookRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "kiro-lane-c-hooks-"));
  temporaryRoots.push(root);
  mkdirSync(join(root, ".kiro", "hooks"), { recursive: true });
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ scripts: { "check:target": "node scripts/check-target.mjs" } }),
    "utf8",
  );
  return root;
}

function writeHookManifest(root: string, name: string, value: string | object): void {
  writeFileSync(
    join(root, ".kiro", "hooks", name),
    typeof value === "string" ? value : JSON.stringify(value),
    "utf8",
  );
}

interface HookFixture {
  readonly version: "v1";
  readonly hooks: readonly object[];
}

function validHook(path: string): HookFixture {
  return {
    version: "v1",
    hooks: [{
      name: `Valid ${path}`,
      trigger: "PostFileSave",
      matcher: "^tests/.+\\.ts$",
      enabled: true,
      timeout: 30,
      action: {
        type: "command",
        command: "node -e \"process.stdin.on('data', value => JSON.parse(value))\"; pnpm run check:target",
      },
    }],
  };
}

function hookValidation(path: string, validationId: string, action: string): ValidationRun {
  return {
    validationId,
    action,
    repositoryRootOrActiveSurface: path,
    surface: "Local_Repository_Surface",
    version: "repository",
    scope: `${path}; hook behavior; rollback path`,
    executionLayer: "surface_validation",
    startedAtUtc: "2026-08-25T12:00:00Z",
    result: "pass",
    commandOrInteraction: `read-only validation for ${path}`,
    exitCodeOrOutcome: "exit 0",
    evidenceRefs: [validationId],
    unverifiedItems: [],
    blocker: "none",
  };
}

function completeExtension(
  kind: ExtensionCandidateInput["kind"],
  name: string,
  overrides: Partial<ExtensionCandidateInput> = {},
): ExtensionCandidateInput {
  return {
    kind,
    name,
    canonicalSource: `.kiro/${name}`,
    configurationFormat: `${name} configuration`,
    surfaceAvailability: ["IDE", "CLI 2.x"],
    scope: "repository-local project scope",
    activation: "explicit activation after validation",
    authorityRelationship: "subordinate to repository authority",
    resourceUris: ["None"],
    dagOrReviewGraph: kind === "Subagent" ? "subagent -> bounded review" : "not applicable",
    maximumConcurrency: 1,
    iterationCeiling: 3,
    approvalBehavior: "explicit",
    failureBehavior: "fail_closed",
    repositoryCompatibility: "compatible",
    validationRunRefs: [],
    owner: "repository owner",
    rollbackPath: `disable ${name} and restore configuration`,
    trustDecision: "trusted",
    integrityResult: "pass",
    ...overrides,
  };
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) rmSync(root, { recursive: true, force: true });
  }
});

describe("Lane C deterministic examples and edge cases", () => {
  it("keeps one repo-map authority while normalizing duplicate steering overlap paths", () => {
    const result = evaluateSkills({
      repositoryRoot,
      steeringPaths: [
        STEERING_PATH,
        ".kiro\\steering\\powers-skills-model.md" as RepositoryPath,
        `${STEERING_ROOT}/graph-layer.md` as RepositoryPath,
        `${STEERING_ROOT}/graph-layer.md` as RepositoryPath,
      ],
    });
    const output = result.output;

    expect(output).toBeDefined();
    if (!output) return;

    expect(output.primaryRepositoryGuidanceSkill).toBe(PRIMARY_REPOSITORY_GUIDANCE_SKILL);
    expect(output.skills.filter((skill) => skill.isPrimaryRepositoryGuidanceSkill)).toHaveLength(1);
    expect(output.steering.map((record) => record.path)).toEqual([
      STEERING_PATH,
      `${STEERING_ROOT}/graph-layer.md`,
    ]);
    expect(
      output.overlapResolutions.filter(
        (resolution) => resolution.sourcePath === `${STEERING_ROOT}/graph-layer.md`,
      ),
    ).toHaveLength(1);
    expect(
      output.overlapResolutions.some(
        (resolution) =>
          resolution.sourcePath === `${STEERING_ROOT}/graph-layer.md` &&
          resolution.targetPath === ".kiro/skills/graph-impact/SKILL.md" &&
          resolution.resolution === "delegate",
      ),
    ).toBe(true);
    expect(result.status).toBe("partial");
  });

  it("blocks valid-looking skills when canonical prerequisites and steering are unavailable", () => {
    const root = createSkillOnlyRoot();
    const result = evaluateSkills({ repositoryRoot: root });

    expect(result.status).toBe("blocked");
    expect(result.output?.skills).toHaveLength(INITIAL_SKILL_CANDIDATES.length);
    expect(result.output?.skills.every((skill) => skill.manifestValid)).toBe(true);
    expect(result.output?.skills.every((skill) => skill.disposition === "defer")).toBe(true);
    expect(result.blockers.some((blocker) => blocker.includes("required prerequisite is unavailable: AGENTS.md"))).toBe(true);
    expect(result.blockers.some((blocker) => blocker.includes("steering file") && blocker.includes("absent"))).toBe(true);
    expect(result.output?.activationScopeClaimsAllowed).toBe(false);
  });

  it("fails closed for invalid JSON, unsupported versions, empty manifests, and escaping hook paths", () => {
    const root = createHookRoot();
    writeHookManifest(root, "invalid.json", "{not-json");
    writeHookManifest(root, "wrong-version.json", { version: "v2", hooks: [...validHook("wrong-version.json").hooks] });
    writeHookManifest(root, "empty.json", { version: "v1", hooks: [] });

    const result = evaluateHooks({
      repositoryRoot: root,
      hookPaths: [
        ".kiro/hooks/invalid.json",
        ".kiro/hooks/wrong-version.json",
        ".kiro/hooks/empty.json",
        "../outside.json" as RepositoryPath,
      ],
    });

    expect(result.status).toBe("blocked");
    expect(result.output?.hooks).toEqual([]);
    expect(result.blockers).toEqual(expect.arrayContaining([
      "hook manifest is not valid JSON: .kiro/hooks/invalid.json",
      ".kiro/hooks/wrong-version.json must declare version v1",
      ".kiro/hooks/empty.json must declare at least one hook definition",
      "hook manifests must be standalone .kiro/hooks/*.json files",
    ]));
  });

  it("blocks overlapping enabled hooks until distinct purpose and owner approval are recorded", () => {
    const root = createHookRoot();
    writeHookManifest(root, "first.json", validHook("first.json"));
    writeHookManifest(root, "second.json", validHook("second.json"));
    const firstPath = ".kiro/hooks/first.json";
    const secondPath = ".kiro/hooks/second.json";
    const validationRuns = [
      hookValidation(firstPath, "validation:first", `validate ${firstPath}`),
      hookValidation(firstPath, "validation:first:restore", `validate rollback restore for ${firstPath}`),
      hookValidation(secondPath, "validation:second", `validate ${secondPath}`),
      hookValidation(secondPath, "validation:second:restore", `validate rollback restore for ${secondPath}`),
    ];

    const result = evaluateHooks({ repositoryRoot: root, validationRuns });
    const hooks = result.output?.hooks ?? [];

    expect(result.status).toBe("partial");
    expect(hooks).toHaveLength(2);
    expect(hooks.every((hook) => hook.enabled)).toBe(true);
    expect(hooks.every((hook) => hook.overlapRefs.length === 1)).toBe(true);
    expect(hooks[0]?.overlapRefs).toEqual([`overlap:${firstPath}:${secondPath}`]);
    expect(hooks[1]?.overlapRefs).toEqual([`overlap:${firstPath}:${secondPath}`]);
    expect(result.blockers).toContain(
      `overlap:${firstPath}:${secondPath} requires distinct purpose, order independence, measured combined runtime, and owner approval`,
    );
  });

  it("records missing power manifests, MCP boundaries, and custom-agent None URI fallbacks as inactive", () => {
    const missingPower = evaluateCapabilities({
      repositoryRoot,
      powers: [{
        pathOrInstallation: ".kiro/powers/missing-power",
        name: "missing-power",
        powerManifestPresent: false,
        pluginManifestPresent: false,
      }],
    });
    const power = missingPower.output?.powers[0];

    expect(power?.format).toBe("Neither");
    expect(power?.disposition).toBe("disable");
    expect(power?.observations).toEqual(expect.arrayContaining([
      expect.objectContaining({ component: "POWER.md", present: false, evidenceState: "Unverified" }),
      expect.objectContaining({ component: "plugin.json", present: false, evidenceState: "Observed" }),
    ]));
    expect(power?.blockers).toEqual(expect.arrayContaining([
      "power has neither POWER.md nor plugin.json and cannot be adopted",
      "power integrity result is unverified",
    ]));

    const result = evaluateCapabilities({
      repositoryRoot,
      mcpServices: [completeExtension("MCP_Service", "missing-boundary-mcp", {
        canonicalSource: "https://example.invalid/mcp",
        repositoryAnswer: "Not_Answered",
        externalRoutingRequested: true,
        serviceAndDataBoundary: undefined,
        secretBoundary: undefined,
        permissionBoundary: undefined,
      })],
      customAgents: [completeExtension("Custom_Agent", "missing-resource-agent", {
        resourceUris: undefined,
      })],
      tools: [completeExtension("Tool_Surface", "bounded-tool", { repositoryAnswer: "Answered" })],
      subagents: [completeExtension("Subagent", "bounded-subagent")],
    });
    const records = result.output?.extensions ?? [];
    const mcp = records.find((record) => record.name === "missing-boundary-mcp");
    const agent = records.find((record) => record.name === "missing-resource-agent");
    const tool = records.find((record) => record.name === "bounded-tool");
    const subagent = records.find((record) => record.name === "bounded-subagent");

    expect(mcp?.disposition).toBe("defer");
    expect(mcp?.externalRoutingAllowed).toBe(false);
    expect(mcp?.blockers).toEqual(expect.arrayContaining([
      "named service/data boundary is missing or invalid",
      "secret boundary is missing or invalid",
      "permission boundary is missing or invalid",
    ]));
    expect(agent?.disposition).toBe("defer");
    expect(agent?.resourceUris).toEqual(["None"]);
    expect(agent?.blockers).toContain("resource URIs or explicit None is missing or invalid");
    expect(tool?.repositoryAnswerCheck.result).toBe("Answered");
    expect(subagent?.dagOrReviewGraph).toBe("subagent -> bounded review");
    expect(records.every((record) => record.rollbackPath.length > 0)).toBe(true);
  });

  it("preserves continuity fallbacks for invalid bounds, stubbed LTM, duplicate kinds, and Crew incompatibility", () => {
    const supplied: readonly ContinuityCapabilityInput[] = [
      {
        kind: "local_compaction",
        observedBehavior: ["first local observation"],
        validationRunRefs: ["validation:local"],
      },
      {
        kind: "local_compaction",
        observedBehavior: ["duplicate local observation must not replace the first"],
      },
      { kind: "ltm_capture", captureCommandIsStub: true },
      { kind: "graph_impact_automation", proposedIterations: GRAPH_IMPACT_MAX_ITERATIONS + 4 },
      { kind: "native_task_graph", proposedMaximumConcurrency: 4 },
      { kind: "review_loop", proposedIterationCeiling: -1 },
      { kind: "crew_task_runner", crewBehaviorFlags: { hiddenSpawning: true, usesOd04Exception: true } },
    ];

    const result = evaluateContinuity({
      repositoryRoot,
      ownerDecisions: OWNER_DECISIONS,
      capabilities: supplied,
      ltmCaptureIsStub: true,
    });
    const output = result.output;

    expect(output).toBeDefined();
    if (!output) return;

    expect(output.continuityRecords.map((record) => record.kind)).toEqual([...CONTINUITY_CAPABILITY_KINDS]);
    expect(output.records.filter((record) => record.kind === "local_compaction")).toHaveLength(1);
    expect(output.records.find((record) => record.kind === "local_compaction")?.observedBehavior).toContain("first local observation");

    const ltm = output.records.find((record) => record.kind === "ltm_capture");
    const graph = output.records.find((record) => record.kind === "graph_impact_automation");
    const native = output.records.find((record) => record.kind === "native_task_graph");
    const review = output.records.find((record) => record.kind === "review_loop");
    const crew = output.records.find((record) => record.kind === "crew_task_runner");

    expect(ltm?.disposition).toBe("disable");
    expect(ltm?.status).toBe("disabled");
    expect(ltm?.blockers.join(" ")).toContain(LTM_CAPTURE_COMMAND);
    expect(graph?.manualFallback).toContain("manual graph-impact loop");
    expect(graph?.iterationCeiling).toBe(GRAPH_IMPACT_MAX_ITERATIONS);
    expect(graph?.disposition).toBe("defer");
    expect(native?.maximumConcurrency).toBe(0);
    expect(native?.disposition).toBe("defer");
    expect(review?.iterationCeiling).toBe(0);
    expect(review?.disposition).toBe("defer");
    expect(crew?.disposition).toBe("exclude");
    expect(crew?.incompatibleBehaviors).toEqual(expect.arrayContaining([...CREW_INCOMPATIBLE_BEHAVIORS]));
    expect(output.executionRecords.map((record) => record.kind)).toEqual(expect.arrayContaining([
      "graph_impact_automation",
      "native_task_graph",
      "review_loop",
      "crew_task_runner",
    ]));
    expect(output.externalRoutingAttempted).toBe(false);
  });
});
