// @vitest-environment node

import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  classifyPowerFormat,
  evaluateCapabilities,
  LOCAL_POWER_PATH,
  POWER_FORMATS,
  type ExtensionCandidateInput,
} from "../../capabilities.ts

const repositoryRoot = resolve(import.meta.dirname, "../../..");

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

describe("CapabilityEvaluator", () => {
  it("classifies all power format combinations exactly", () => {
    expect(POWER_FORMATS).toEqual(["Legacy_POWER", "Agent_Plugin", "Both", "Neither"]);
    expect(classifyPowerFormat(false, false)).toBe("Neither");
    expect(classifyPowerFormat(true, false)).toBe("Legacy_POWER");
    expect(classifyPowerFormat(false, true)).toBe("Agent_Plugin");
    expect(classifyPowerFormat(true, true)).toBe("Both");
  });

  it("records the local oando-workflow observations separately and keeps loading Unverified", () => {
    const result = evaluateCapabilities({
      repositoryRoot,
      powerPaths: [LOCAL_POWER_PATH],
    });
    const power = result.output?.powers.find((candidate) => candidate.name === "oando-workflow");

    expect(power).toBeDefined();
    expect(power?.pathOrInstallation).toBe(LOCAL_POWER_PATH);
    expect(power?.format).toBe("Legacy_POWER");
    expect(power?.external).toBe(false);
    expect(power?.disposition).toBe("observe");
    expect(power?.observations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        component: "POWER.md",
        present: true,
        evidenceState: "Observed",
      }),
      expect.objectContaining({
        component: "mcp.json",
        present: true,
        empty: true,
        value: "present and empty ({})",
        evidenceState: "Observed",
      }),
      expect.objectContaining({
        component: "plugin.json",
        present: false,
        value: "absent",
        evidenceState: "Observed",
      }),
      expect.objectContaining({
        component: "registryId: local",
        present: true,
        value: expect.stringContaining("Unverified"),
        evidenceState: "Unverified",
      }),
    ]));
    expect(power?.observations.every((observation) => observation.provenance.cwdOrSurface === repositoryRoot)).toBe(true);
    expect(power?.repositoryAnswer).toBe("Answered");
    expect(result.output?.repositoryAnswerChecks.find((check) => check.capabilityId === power?.capabilityId)).toEqual(
      expect.objectContaining({
        evaluatedBeforeExternalRouting: true,
        externalRoutingRequested: false,
        externalRoutingAllowed: false,
      }),
    );
    expect(power?.evidence).toEqual(expect.objectContaining({
      revisionOrVersion: "unavailable",
      licenseOrSource: "unavailable",
      trustDecision: "trusted",
      integrityResult: "pass",
      secrets: "none_declared",
      permissions: "none_declared",
      serviceAndDataBoundary: "repository-local power; no external service",
      resourceUris: ["None"],
      ownerApprovalRef: "none",
      targetValidationRefs: [],
      dagOrReviewGraph: "not applicable to power loading",
      maximumConcurrency: 0,
      iterationCeiling: 0,
      approvalBehavior: "explicit",
      failureBehavior: "fail_closed",
    }));
  });

  it("evaluates MCP, tools, custom agents, and subagents with bounded evidence", () => {
    const mcp = completeExtension("MCP_Service", "fixture-mcp", {
      canonicalSource: ".kiro/settings/mcp.json",
      repositoryAnswer: "Not_Answered",
      externalRoutingRequested: true,
      serviceAndDataBoundary: "fixture MCP service; repository fixture data only",
      secretBoundary: "none_declared",
      permissionBoundary: "none_declared",
    });
    const tool = completeExtension("Tool_Surface", "fixture-tool", {
      repositoryAnswer: "Answered",
    });
    const customAgent = completeExtension("Custom_Agent", "fixture-agent", {
      resourceUris: ["None"],
    });
    const subagent = completeExtension("Subagent", "fixture-subagent", {
      dagOrReviewGraph: "implementation -> review -> handoff",
    });

    const result = evaluateCapabilities({
      repositoryRoot,
      mcpServices: [mcp],
      tools: [tool],
      customAgents: [customAgent],
      subagents: [subagent],
    });
    const records = result.output?.extensions ?? [];

    expect(records).toHaveLength(4);
    expect(records.map((record) => record.kind)).toEqual([
      "MCP_Service",
      "Tool_Surface",
      "Custom_Agent",
      "Subagent",
    ]);

    const mcpRecord = records.find((record) => record.kind === "MCP_Service");
    expect(mcpRecord?.repositoryAnswerCheck).toEqual(expect.objectContaining({
      result: "Not_Answered",
      evaluatedBeforeExternalRouting: true,
      externalRoutingRequested: true,
      externalRoutingAllowed: true,
    }));
    expect(mcpRecord?.evidence).toEqual(expect.objectContaining({
      serviceAndDataBoundary: "fixture MCP service; repository fixture data only",
      secrets: "none_declared",
      permissions: "none_declared",
      resourceUris: ["None"],
      ownerApprovalRef: "none",
      dagOrReviewGraph: "not applicable",
      maximumConcurrency: 1,
      iterationCeiling: 3,
      approvalBehavior: "explicit",
      failureBehavior: "fail_closed",
      rollbackPath: "disable fixture-mcp and restore configuration",
    }));
    expect(mcpRecord?.externalRoutingAllowed).toBe(false);

    const toolRecord = records.find((record) => record.kind === "Tool_Surface");
    expect(toolRecord?.repositoryAnswerCheck.result).toBe("Answered");
    expect(toolRecord?.evidence.resourceUris).toEqual(["None"]);

    const agentRecord = records.find((record) => record.kind === "Custom_Agent");
    expect(agentRecord?.resourceUris).toEqual(["None"]);
    expect(agentRecord?.evidence.resourceUris).toEqual(["None"]);
    expect(agentRecord?.blockers).not.toContain("custom agent must record every applicable resource URI or an explicit None value");

    const subagentRecord = records.find((record) => record.kind === "Subagent");
    expect(subagentRecord?.dagOrReviewGraph).toBe("implementation -> review -> handoff");
    expect(subagentRecord?.evidence.dagOrReviewGraph).toBe("implementation -> review -> handoff");
    expect(subagentRecord?.maximumConcurrency).toBe(1);
    expect(subagentRecord?.iterationCeiling).toBe(3);
    expect(records.every((record) => record.rollbackPath.length > 0)).toBe(true);
    expect(records.every((record) => record.disposition === "defer")).toBe(true);
  });

  it("does not permit an untestable repository answer or missing subagent graph to become active", () => {
    const result = evaluateCapabilities({
      repositoryRoot,
      mcpServices: [{
        kind: "MCP_Service",
        name: "unverified-mcp",
        canonicalSource: "https://example.invalid/mcp",
        configurationFormat: "MCP configuration",
        surfaceAvailability: ["IDE"],
        scope: "external service",
        activation: "external activation",
        authorityRelationship: "external capability",
        resourceUris: ["https://example.invalid/resource"],
        serviceAndDataBoundary: "named service boundary",
        secretBoundary: "none_declared",
        permissionBoundary: "none_declared",
        maximumConcurrency: 0,
        iterationCeiling: 0,
        approvalBehavior: "explicit",
        failureBehavior: "fail_closed",
        repositoryCompatibility: "Unverified",
        validationRunRefs: [],
        owner: "repository owner",
        rollbackPath: "revoke service and remove route",
        trustDecision: "unresolved",
        integrityResult: "unverified",
      }],
      subagents: [completeExtension("Subagent", "missing-graph", { dagOrReviewGraph: undefined })],
    });

    const mcpRecord = result.output?.extensions.find((record) => record.name === "unverified-mcp");
    const subagentRecord = result.output?.extensions.find((record) => record.name === "missing-graph");
    expect(mcpRecord?.repositoryAnswerCheck.result).toBe("Not_Testable");
    expect(mcpRecord?.externalRoutingAllowed).toBe(false);
    expect(mcpRecord?.disposition).toBe("defer");
    expect(subagentRecord?.blockers).toContain("DAG or review graph is missing or invalid");
    expect(subagentRecord?.disposition).toBe("defer");
  });
});
