import { lstatSync, readdirSync } from "fs";
import { basename, extname, relative, resolve } from "path";

import {
  type ArtifactInventoryRecord,
  type ArtifactKind,
  type ConfigurationScope,
  type Identifier,
  type InventoryRequest,
  type InventoryResult,
  type InventoryStatus,
  type MaintenanceRisk,
  type RepositoryInventory as RepositoryInventoryContract,
  type RepositoryPath,
  type RollbackPath,
  type StageResult,
  INITIAL_SKILL_CANDIDATES,
  type SourceRecord,
  type Availability,
  type EvidenceProvenance,
} from "./contracts";

const REPOSITORY_OWNER = "repository owner";
const LOCAL_SURFACE = "Local_Repository_Surface";
const DEFAULT_EVIDENCE_REF = "source:repository:inventory";

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function identifierFor(path: RepositoryPath, kind: ArtifactKind): Identifier {
  return `artifact:${slug(kind)}:${slug(path)}`;
}

function configurationScopeFor(path: RepositoryPath): ConfigurationScope {
  if (path.startsWith(".kiro/skills/")) return "project";
  if (path.startsWith(".kiro/steering/")) return "project";
  if (path.startsWith(".kiro/hooks/")) return "project";
  if (path.startsWith(".kiro/powers/")) return "project";
  if (path.startsWith(".kiro/agents/")) return "project";
  if (path.startsWith(".kiro/settings/")) return "project";
  if (path.startsWith(".kiro/specs/")) return "project";
  if (path.startsWith(".kiro/")) return "project";
  if (path === "AGENTS.md" || path.startsWith("Agents/")) return "project";
  if (path.startsWith("docs/")) return "manual";
  return "project";
}

function canonicalSourceFor(path: RepositoryPath): string {
  if (path === "AGENTS.md") return "AGENTS.md";
  if (path === "START.md") return "START.md";
  if (path === "README.md") return "README.md";
  if (path === "CONTENTS.md") return "CONTENTS.md";
  if (path === "DOC-MAP.md") return "DOC-MAP.md";
  if (path === "HANDOVER.md") return "HANDOVER.md";
  if (path === "Testing-handbook.md") return "Testing-handbook.md";
  if (path === "OPERATIONS_RUNBOOK.md") return "OPERATIONS_RUNBOOK.md";
  if (path === "package.json") return "package.json";
  if (path === "pnpm-workspace.yaml") return "pnpm-workspace.yaml";
  if (path.startsWith("Agents/")) return "Agents/*";
  if (path.startsWith("docs/")) return "docs/*";
  if (path.startsWith("plans/")) return "plans/*";
  if (path.startsWith(".kiro/")) return ".kiro/*";
  return path;
}

function activationConditionFor(path: RepositoryPath, kind: ArtifactKind): string {
  switch (kind) {
    case "Kiro_Skill":
      return "on-demand or always-on after OD-08 validation";
    case "Steering_File":
      return "inclusion scope (always, file-match, manual) after OD-08 validation";
    case "Hook_Manifest":
      return "enabled, passes schema/safety checks, and OD-02 validation";
    case "Kiro_Power":
      return "activation after repository-answer check and OD-05 validation";
    case "Custom_Agent":
      return "activation after resource validation and OD-07 validation";
    case "MCP_Service":
      return "routing after named boundary and OD-06 validation";
    case "Tool_Surface":
      return "availability on selected surface";
    case "Subagent":
      return "invocation after DAG/review validation and OD-07 validation";
    case "Specification":
      return "execution after input/output validation";
    case "Permission_Configuration":
      return "application after precedence validation";
    case "Ignore_Configuration":
      return "matching after surface validation";
    case "Relevant_Setting":
      return "effect after scope validation";
    default:
      return "needs owner decision";
  }
}

function dispositionFor(path: RepositoryPath, kind: ArtifactKind, status: InventoryStatus): ArtifactInventoryRecord["disposition"] {
  if (status === "absent" || status === "unknown") return "observe";
  if (status === "present but unreadable") return "defer";
  
  switch (kind) {
    case "Kiro_Skill":
      return "retain";
    case "Steering_File":
      return "retain";
    case "Hook_Manifest":
      return path.includes("domain-fast-check") ? "update" : "retain";
    case "Kiro_Power":
      return path.includes("oando-workflow") ? "observe" : "retain";
    case "Custom_Agent":
      return "observe";
    case "MCP_Service":
      return "observe";
    case "Tool_Surface":
      return "retain";
    case "Subagent":
      return "observe";
    case "Specification":
      return "retain";
    case "Permission_Configuration":
      return "observe";
    case "Ignore_Configuration":
      return "retain";
    case "Relevant_Setting":
      return "observe";
    default:
      return "observe";
  }
}

function maintenanceRiskFor(path: RepositoryPath, kind: ArtifactKind): MaintenanceRisk {
  switch (kind) {
    case "Kiro_Skill":
      if (path.includes("repo-map")) return "low";
      return "medium";
    case "Hook_Manifest":
      if (path.includes("domain-fast-check")) return "high";
      if (path.includes("ltm-postturn-capture")) return "high";
      return "medium";
    case "Kiro_Power":
      if (path.includes("oando-workflow")) return "unknown with reason";
      return "medium";
    case "Custom_Agent":
    case "MCP_Service":
    case "Subagent":
      return "high";
    case "Steering_File":
    case "Tool_Surface":
    case "Specification":
    case "Permission_Configuration":
    case "Ignore_Configuration":
    case "Relevant_Setting":
      return "low";
    default:
      return "unknown with reason";
  }
}

function evidenceStateFor(status: InventoryStatus): ArtifactInventoryRecord["evidenceState"] {
  switch (status) {
    case "present and readable":
      return "Observed";
    case "present but unreadable":
    case "absent":
    case "unknown":
      return "Unverified";
    default:
      return "Unverified";
  }
}

function rollbackPathFor(path: RepositoryPath, kind: ArtifactKind, status: InventoryStatus): RollbackPath {
  if (status === "absent") return "no rollback applies";
  if (status === "unknown") return "no rollback applies";
  
  switch (kind) {
    case "Kiro_Skill":
      return "restore prior skill manifest";
    case "Steering_File":
      return "restore prior steering file";
    case "Hook_Manifest":
      return "disable hook and restore pre-change bytes";
    case "Kiro_Power":
      return "remove activation and restore prior registration";
    case "Custom_Agent":
      return "disable agent and restore configuration";
    case "MCP_Service":
      return "revoke service and remove route";
    case "Tool_Surface":
      return "restore prior tool configuration";
    case "Subagent":
      return "disable subagent";
    case "Specification":
      return "restore prior specification files";
    case "Permission_Configuration":
      return "restore prior permission settings";
    case "Ignore_Configuration":
      return "restore prior ignore rules";
    case "Relevant_Setting":
      return "restore prior setting value";
    default:
      return "no rollback applies";
  }
}

function artifactKindFor(path: RepositoryPath): ArtifactKind {
  if (path.startsWith(".kiro/skills/")) return "Kiro_Skill";
  if (path.startsWith(".kiro/steering/")) return "Steering_File";
  if (path.startsWith(".kiro/hooks/")) return "Hook_Manifest";
  if (path.startsWith(".kiro/powers/")) return "Kiro_Power";
  if (path.startsWith(".kiro/agents/")) return "Custom_Agent";
  if (path.startsWith(".kiro/settings/mcp.json")) return "MCP_Service";
  if (path.startsWith(".kiro/settings/")) return "Relevant_Setting";
  if (path === ".kiro/settings") return "Relevant_Setting";
  if (path.startsWith(".kiro/")) return "Specification";
  
  if (path === "AGENTS.md" || path.startsWith("Agents/")) return "Steering_File";
  if (path === "START.md") return "Steering_File";
  if (path === "README.md") return "Steering_File";
  if (path === "CONTENTS.md") return "Steering_File";
  if (path === "DOC-MAP.md") return "Steering_File";
  if (path === "HANDOVER.md") return "Steering_File";
  if (path === "Testing-handbook.md") return "Steering_File";
  if (path === "OPERATIONS_RUNBOOK.md") return "Steering_File";
  if (path.startsWith("docs/")) return "Steering_File";
  if (path.startsWith("plans/")) return "Specification";
  
  if (path === "package.json" || path === "pnpm-workspace.yaml") return "Relevant_Setting";
  
  return "Relevant_Setting";
}

function isSkillCandidate(path: RepositoryPath): boolean {
  const skillName = basename(path);
  return INITIAL_SKILL_CANDIDATES.some((candidate: string) => candidate === skillName);
}

function localPathIsInsideRoot(root: string, candidate: string): boolean {
  const relativeCandidate = relative(root, candidate).replaceAll("\\", "/");
  return relativeCandidate === "" || (!relativeCandidate.startsWith("../") && relativeCandidate !== "..");
}

function inspectPath(
  repositoryRoot: string,
  path: string,
  reviewDateUtc: string
): { status: InventoryStatus; isDirectory: boolean; error?: string } {
  const absolutePath = resolve(repositoryRoot, path);
  
  if (!localPathIsInsideRoot(repositoryRoot, absolutePath)) {
    return {
      status: "unknown",
      isDirectory: false,
      error: "path escapes repository root",
    };
  }

  try {
    const stats = lstatSync(absolutePath);
    if (stats.isDirectory()) {
      try {
        readdirSync(absolutePath);
        return { status: "present and readable", isDirectory: true };
      } catch {
        return { status: "present but unreadable", isDirectory: true, error: "directory unreadable" };
      }
    } else {
      try {
        readdirSync(absolutePath);
        return { status: "present and readable", isDirectory: false };
      } catch {
        return { status: "present but unreadable", isDirectory: false, error: "file unreadable" };
      }
    }
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return { status: "absent", isDirectory: false, error: "path not found" };
    }
    return { status: "unknown", isDirectory: false, error: error.message || "unknown error" };
  }
}

function collectArtifactsInDirectory(
  repositoryRoot: string,
  directoryPath: string,
  reviewDateUtc: string,
  inspectedPaths: Set<string>,
  records: ArtifactInventoryRecord[]
): void {
  const inspection = inspectPath(repositoryRoot, directoryPath, reviewDateUtc);
  if (inspection.status !== "present and readable" || !inspection.isDirectory) {
    return;
  }

  const absolutePath = resolve(repositoryRoot, directoryPath);
  let children: string[];
  try {
    children = readdirSync(absolutePath).sort((left: string, right: string) => left.localeCompare(right));
  } catch {
    return;
  }

  for (const child of children) {
    const childPath = `${directoryPath}/${child}`;
    if (inspectedPaths.has(childPath)) continue;
    
    inspectedPaths.add(childPath);
    
    const childInspection = inspectPath(repositoryRoot, childPath, reviewDateUtc);
    const kind = artifactKindFor(childPath);
    const record: ArtifactInventoryRecord = {
      artifactId: identifierFor(childPath, kind),
      kind,
      path: childPath,
      inventoryStatus: childInspection.status,
      owner: REPOSITORY_OWNER,
      configurationScope: configurationScopeFor(childPath),
      activationCondition: activationConditionFor(childPath, kind),
      canonicalSource: canonicalSourceFor(childPath),
      evidenceState: evidenceStateFor(childInspection.status),
      disposition: dispositionFor(childPath, kind, childInspection.status),
      maintenanceRisk: maintenanceRiskFor(childPath, kind),
      evidenceRefs: [DEFAULT_EVIDENCE_REF],
      validationRunRefs: [],
      rollbackPath: rollbackPathFor(childPath, kind, childInspection.status),
    };
    
    records.push(record);

    if (childInspection.isDirectory) {
      collectArtifactsInDirectory(repositoryRoot, childPath, reviewDateUtc, inspectedPaths, records);
    }
  }
}

function validateRequest(input: InventoryRequest): string[] {
  const errors: string[] = [];
  if (!input.repositoryRoot || input.repositoryRoot.trim().length === 0) {
    errors.push("repositoryRoot is required");
  }
  if (!input.reviewDateUtc || input.reviewDateUtc.trim().length === 0) {
    errors.push("reviewDateUtc is required");
  }
  if (input.paths.length === 0) {
    errors.push("at least one path is required");
  }
  return errors;
}

function blockedResult(errors: readonly string[]): StageResult<InventoryResult> {
  return {
    status: "blocked",
    blockers: errors,
    evidenceRefs: [],
  };
}

export class RepositoryInventory implements RepositoryInventoryContract {
  scan(input: InventoryRequest): StageResult<InventoryResult> {
    const requestErrors = validateRequest(input);
    if (requestErrors.length > 0) return blockedResult(requestErrors);

    const repositoryRoot = resolve(input.repositoryRoot);
    const inspectedPaths = new Set<string>();
    const records: ArtifactInventoryRecord[] = [];
    const missingPaths: RepositoryPath[] = [];
    const conflicts: Identifier[] = [];

    for (const requestedPath of input.paths) {
      if (inspectedPaths.has(requestedPath)) {
        conflicts.push(`duplicate-path:${slug(requestedPath)}`);
        continue;
      }

      inspectedPaths.add(requestedPath);
      
      const inspection = inspectPath(repositoryRoot, requestedPath, input.reviewDateUtc);
      
      if (inspection.status === "absent" || inspection.status === "unknown") {
        missingPaths.push(requestedPath);
        continue;
      }

      const kind = artifactKindFor(requestedPath);
      const record: ArtifactInventoryRecord = {
        artifactId: identifierFor(requestedPath, kind),
        kind,
        path: requestedPath,
        inventoryStatus: inspection.status,
        owner: REPOSITORY_OWNER,
        configurationScope: configurationScopeFor(requestedPath),
        activationCondition: activationConditionFor(requestedPath, kind),
        canonicalSource: canonicalSourceFor(requestedPath),
        evidenceState: evidenceStateFor(inspection.status),
        disposition: dispositionFor(requestedPath, kind, inspection.status),
        maintenanceRisk: maintenanceRiskFor(requestedPath, kind),
        evidenceRefs: [DEFAULT_EVIDENCE_REF],
        validationRunRefs: [],
        rollbackPath: rollbackPathFor(requestedPath, kind, inspection.status),
      };
      
      records.push(record);

      if (inspection.isDirectory) {
        collectArtifactsInDirectory(repositoryRoot, requestedPath, input.reviewDateUtc, inspectedPaths, records);
      }
    }

    const canonicalSources = records.filter(record =>
      record.path === "AGENTS.md" ||
      record.path === "START.md" ||
      record.path === "README.md" ||
      record.path === "CONTENTS.md" ||
      record.path === "DOC-MAP.md" ||
      record.path === "HANDOVER.md" ||
      record.path === "Testing-handbook.md" ||
      record.path === "OPERATIONS_RUNBOOK.md" ||
      record.path.startsWith("Agents/") ||
      record.path.startsWith("docs/")
    );

    const kiroArtifacts = records.filter(record =>
      record.path.startsWith(".kiro/") ||
      record.path.startsWith("plans/") ||
      record.path === "package.json" ||
      record.path === "pnpm-workspace.yaml"
    );

    const skillRecords = kiroArtifacts.filter(record =>
      record.kind === "Kiro_Skill" && isSkillCandidate(record.path)
    );

    if (skillRecords.length !== INITIAL_SKILL_CANDIDATES.length) {
      conflicts.push(`skill-count-mismatch:expected-${INITIAL_SKILL_CANDIDATES.length}-found-${skillRecords.length}`);
    }

    for (const candidate of INITIAL_SKILL_CANDIDATES) {
      const skillPath = `.kiro/skills/${candidate}`;
      const found = kiroArtifacts.some(record => record.path === skillPath);
      if (!found) {
        conflicts.push(`missing-initial-skill:${candidate}`);
      }
    }

    return {
      status: "pass",
      blockers: [],
      evidenceRefs: [DEFAULT_EVIDENCE_REF],
      result: {
        canonicalSources,
        kiroArtifacts,
        missingPaths,
        conflicts,
      },
    };
  }
}

export const repositoryInventory = new RepositoryInventory();
export const scanInventory = (input: InventoryRequest): StageResult<InventoryResult> =>
  repositoryInventory.scan(input);