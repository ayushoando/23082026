import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

import {
  INITIAL_SKILL_CANDIDATES,
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
} from "./contracts";

const REPOSITORY_OWNER = "repository owner";
const EVIDENCE_REF = "source:repository:inventory";

/** Authority sources that must receive a status even when absent. */
export const REQUIRED_CANONICAL_GUIDANCE_PATHS = [
  "AGENTS.md",
  "START.md",
  "README.md",
  "CONTENTS.md",
  "DOC-MAP.md",
  "HANDOVER.md",
  "Agents",
  "docs",
  "plans",
] as const;

/** Repository-local configuration artifacts named by the feature baseline. */
export const REQUIRED_KIRO_ARTIFACT_PATHS = [
  ".kiro",
  ".kiro/settings",
  ".kiro/settings/permissions.yaml",
  ".kiro/settings/mcp.json",
  ".kiro/settings/installed.json",
  ".kiro/settings/agents.json",
  ".kiro/settings/config.json",
  ".kiroignore",
  ...INITIAL_SKILL_CANDIDATES.map((skill) => `.kiro/skills/${skill}`),
] as const;

interface PathInspection {
  readonly status: InventoryStatus;
  readonly isDirectory: boolean;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function normalizePath(path: string): RepositoryPath {
  return path.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+$/, "");
}

function identifierFor(path: RepositoryPath, kind: ArtifactKind): Identifier {
  return `artifact:${slug(kind)}:${slug(path)}`;
}

function localPathIsInsideRoot(root: string, candidate: string): boolean {
  const relativeCandidate = relative(root, candidate).replaceAll("\\", "/");
  return relativeCandidate === "" || (!relativeCandidate.startsWith("../") && relativeCandidate !== "..");
}

function inspectPath(repositoryRoot: string, path: RepositoryPath): PathInspection {
  const absolutePath = resolve(repositoryRoot, path);
  if (!localPathIsInsideRoot(repositoryRoot, absolutePath)) {
    return { status: "unknown", isDirectory: false };
  }

  try {
    const stats = lstatSync(absolutePath);
    // Inventory only paths owned by this repository. Do not follow a symlink
    // that could point outside the root or expose data from another scope.
    if (stats.isSymbolicLink()) {
      return { status: "unknown", isDirectory: false };
    }
    if (stats.isDirectory()) {
      try {
        readdirSync(absolutePath);
        return { status: "present and readable", isDirectory: true };
      } catch {
        return { status: "present but unreadable", isDirectory: true };
      }
    }

    try {
      readFileSync(absolutePath);
      return { status: "present and readable", isDirectory: false };
    } catch {
      return { status: "present but unreadable", isDirectory: false };
    }
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return { status: "absent", isDirectory: false };
    }
    return { status: "unknown", isDirectory: false };
  }
}

function artifactKindFor(path: RepositoryPath): ArtifactKind {
  if (path === ".kiroignore") return "Ignore_Configuration";
  if (path.startsWith(".kiro/skills/")) return "Kiro_Skill";
  if (path.startsWith(".kiro/steering/")) return "Steering_File";
  if (path.startsWith(".kiro/hooks/")) return "Hook_Manifest";
  if (path.startsWith(".kiro/powers/")) return "Kiro_Power";
  if (path.startsWith(".kiro/agents/") || path === ".kiro/settings/agents.json") return "Custom_Agent";
  if (path === ".kiro/settings/permissions.yaml") return "Permission_Configuration";
  if (path === ".kiro/settings/mcp.json") return "MCP_Service";
  if (path.startsWith(".kiro/settings/")) return "Relevant_Setting";
  if (path.startsWith(".kiro/specs/")) return "Specification";
  if (path.startsWith(".kiro/")) return "Relevant_Setting";
  if (path.startsWith("plans/")) return "Specification";
  return "Steering_File";
}

function scopeFor(path: RepositoryPath): ConfigurationScope {
  if (path.startsWith("docs/")) return "manual";
  return "project";
}

function canonicalSourceFor(path: RepositoryPath): string {
  if (path === "AGENTS.md") return "AGENTS.md";
  if (path.startsWith("Agents/")) return "Agents/*";
  if (path.startsWith("docs/")) return "docs/*";
  if (path.startsWith("plans/")) return "plans/*";
  if (path.startsWith(".kiro/")) return ".kiro/*";
  return path;
}

function activationConditionFor(kind: ArtifactKind): string {
  switch (kind) {
    case "Kiro_Skill": return "after OD-08 manifest, prerequisite, and activation validation";
    case "Steering_File": return "after canonical-source and inclusion-scope validation";
    case "Hook_Manifest": return "after OD-02 schema, command, safety, and surface validation";
    case "Kiro_Power": return "after repository-answer and OD-05 loading validation";
    case "Custom_Agent": return "after OD-07 resource and surface validation";
    case "MCP_Service": return "after OD-06 named-boundary and target-surface validation";
    case "Permission_Configuration": return "after approval-boundary and precedence validation";
    case "Ignore_Configuration": return "after protected-content and surface validation";
    case "Specification": return "as a repository-local specification artifact";
    default: return "after applicable scope validation";
  }
}

function dispositionFor(path: RepositoryPath, kind: ArtifactKind, status: InventoryStatus): ArtifactInventoryRecord["disposition"] {
  if (status === "present but unreadable") return "defer";
  if (status === "absent" || status === "unknown") return "observe";
  if (kind === "Hook_Manifest" && path.includes("domain-fast-check")) return "update";
  if (kind === "Hook_Manifest" && path.includes("ltm-postturn-capture")) return "disable";
  if (kind === "Kiro_Power" && path.includes("oando-workflow")) return "observe";
  if (kind === "Kiro_Skill" || kind === "Steering_File" || kind === "Specification" || kind === "Ignore_Configuration") return "retain";
  return "observe";
}

function riskFor(path: RepositoryPath, kind: ArtifactKind): MaintenanceRisk {
  if (kind === "Hook_Manifest") return path.includes("domain-fast-check") || path.includes("ltm-postturn-capture") ? "high" : "medium";
  if (kind === "Kiro_Power") return "unknown with reason";
  if (kind === "Custom_Agent" || kind === "MCP_Service") return "high";
  if (kind === "Kiro_Skill") return path.includes("repo-map") ? "low" : "medium";
  return "low";
}

function rollbackFor(kind: ArtifactKind, status: InventoryStatus): RollbackPath {
  if (status === "absent" || status === "unknown") return "no rollback applies";
  if (kind === "Hook_Manifest") return "disable hook and restore pre-change bytes";
  if (kind === "MCP_Service") return "revoke service and remove route";
  if (kind === "Custom_Agent") return "disable agent and restore configuration";
  if (kind === "Permission_Configuration") return "restore prior permission settings";
  if (kind === "Ignore_Configuration") return "restore prior ignore rules";
  return "restore prior artifact bytes";
}

function recordFor(path: RepositoryPath, inspection: PathInspection): ArtifactInventoryRecord {
  const kind = artifactKindFor(path);
  return {
    artifactId: identifierFor(path, kind),
    kind,
    path,
    inventoryStatus: inspection.status,
    owner: REPOSITORY_OWNER,
    configurationScope: scopeFor(path),
    activationCondition: activationConditionFor(kind),
    canonicalSource: canonicalSourceFor(path),
    evidenceState: inspection.status === "present and readable" ? "Observed" : "Unverified",
    disposition: dispositionFor(path, kind, inspection.status),
    maintenanceRisk: riskFor(path, kind),
    evidenceRefs: [EVIDENCE_REF],
    validationRunRefs: [],
    rollbackPath: rollbackFor(kind, inspection.status),
  };
}

function collectVisibleChildren(
  repositoryRoot: string,
  directoryPath: RepositoryPath,
  inspected: Set<RepositoryPath>,
  records: ArtifactInventoryRecord[],
): void {
  const inspection = inspectPath(repositoryRoot, directoryPath);
  if (inspection.status !== "present and readable" || !inspection.isDirectory) return;

  let children: string[];
  try {
    children = readdirSync(resolve(repositoryRoot, directoryPath)).sort((left, right) => left.localeCompare(right));
  } catch {
    return;
  }

  for (const child of children) {
    const childPath = normalizePath(`${directoryPath}/${child}`);
    if (inspected.has(childPath)) continue;
    inspected.add(childPath);
    const childInspection = inspectPath(repositoryRoot, childPath);
    records.push(recordFor(childPath, childInspection));
    if (childInspection.isDirectory) collectVisibleChildren(repositoryRoot, childPath, inspected, records);
  }
}

function isCanonicalGuidance(path: RepositoryPath): boolean {
  return REQUIRED_CANONICAL_GUIDANCE_PATHS.includes(path as (typeof REQUIRED_CANONICAL_GUIDANCE_PATHS)[number]) ||
    path.startsWith("Agents/") || path.startsWith("docs/") || path.startsWith("plans/");
}

function validateRequest(input: InventoryRequest): string[] {
  const blockers: string[] = [];
  if (!input.repositoryRoot.trim()) blockers.push("repositoryRoot is required");
  if (!input.reviewDateUtc.trim()) blockers.push("reviewDateUtc is required");
  return blockers;
}

export class RepositoryInventory implements RepositoryInventoryContract {
  scan(input: InventoryRequest): StageResult<InventoryResult> {
    const requestBlockers = validateRequest(input);
    if (requestBlockers.length > 0) return { status: "blocked", blockers: requestBlockers, evidenceRefs: [] };

    const root = resolve(input.repositoryRoot);
    const inspected = new Set<RepositoryPath>();
    const records: ArtifactInventoryRecord[] = [];
    const conflicts: Identifier[] = [];
    const requiredPaths = [...REQUIRED_CANONICAL_GUIDANCE_PATHS, ...REQUIRED_KIRO_ARTIFACT_PATHS, ...input.paths]
      .map(normalizePath);

    for (const path of requiredPaths) {
      if (inspected.has(path)) continue;
      inspected.add(path);
      const inspection = inspectPath(root, path);
      records.push(recordFor(path, inspection));
      if (inspection.isDirectory) collectVisibleChildren(root, path, inspected, records);
    }

    const skillRecords = records.filter((record) =>
      INITIAL_SKILL_CANDIDATES.some((skill) => record.path === `.kiro/skills/${skill}`),
    );
    if (skillRecords.length !== INITIAL_SKILL_CANDIDATES.length) {
      conflicts.push(`skill-candidate-inventory-mismatch:${skillRecords.length}`);
    }

    const paths = new Set(records.map((record) => record.path));
    for (const skill of INITIAL_SKILL_CANDIDATES) {
      if (!paths.has(`.kiro/skills/${skill}`)) conflicts.push(`missing-initial-skill:${skill}`);
    }

    const canonicalSources = records.filter((record) => isCanonicalGuidance(record.path));
    const kiroArtifacts = records.filter((record) =>
      record.path.startsWith(".kiro/") || record.path === ".kiro" || record.path === ".kiroignore",
    );
    const missingPaths = records
      .filter((record) => record.inventoryStatus === "absent" || record.inventoryStatus === "unknown")
      .map((record) => record.path);

    return {
      status: "pass",
      output: { canonicalSources, kiroArtifacts, missingPaths, conflicts },
      blockers: [],
      evidenceRefs: [EVIDENCE_REF],
    };
  }
}

export const repositoryInventory = new RepositoryInventory();
export const scanInventory = (input: InventoryRequest): StageResult<InventoryResult> => repositoryInventory.scan(input);
