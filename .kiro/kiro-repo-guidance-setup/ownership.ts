/**
 * Lane D ownership declarations for the feature-scoped implementation wave.
 *
 * This module is a pure manifest and declaration validator. It does not acquire
 * reservations, guard a wave, freeze contracts, mutate files, or resolve an
 * ownership conflict. A conflict is returned as a blocking record so the
 * caller can stop before any lane mutation.
 */

import {
  FEATURE_NAME,
  REPOSITORY_ROOT,
  type Identifier,
  type ImplementationAgentDeclaration,
  type RepositoryPath,
  type ReadWriteScope,
  type StageResult,
  type WaveConflict,
} from "./contracts";
import { waveManifest, type WaveManifest } from "./wave-manifest";

export type LaneName = "Lane A" | "Lane B" | "Lane C" | "Lane D";
export type SharedGeneratedOutputOwnership = "none" | "named_disjoint_outputs";

export const LANE_AGENT_IDS = {
  "Lane A": "lane-a-implementation-agent",
  "Lane B": "lane-b-implementation-agent",
  "Lane C": "lane-c-implementation-agent",
  "Lane D": "lane-d-implementation-agent",
} as const satisfies Readonly<Record<LaneName, Identifier>>;

export const INTEGRATION_OWNER_ID = "integration-validation-gate-owner" as const;
export const OWNERSHIP_MANIFEST_VERSION = "wave-manifest:roots-frozen-manifest-selected" as const;

const LANE_NAMES = ["Lane A", "Lane B", "Lane C", "Lane D"] as const satisfies readonly LaneName[];

const LANE_TEST_ROOTS = {
  "Lane A": waveManifest.roots.laneTests.laneA,
  "Lane B": waveManifest.roots.laneTests.laneB,
  "Lane C": waveManifest.roots.laneTests.laneC,
  "Lane D": waveManifest.roots.laneTests.laneD,
} as const satisfies Readonly<Record<LaneName, RepositoryPath>>;

const COMMON_READ_PATHS = [
  "AGENTS.md",
  "START.md",
  "README.md",
  "CONTENTS.md",
  "DOC-MAP.md",
  "HANDOVER.md",
  "Agents/**",
  "docs/**",
  "plans/**",
  "config/**",
  "package.json",
  "pnpm-workspace.yaml",
  ".kiro/**",
  "scripts/**",
  "tests/**",
  "site/**",
] as const satisfies readonly RepositoryPath[];

const FEATURE_IMPLEMENTATION_READ_PATH = `${waveManifest.roots.implementation}**` as RepositoryPath;
const FEATURE_TEST_READ_PATH = ".kiro/kiro-repo-guidance-setup/tests/**" as RepositoryPath;

const LANE_WRITE_PATHS = {
  "Lane A": [
    `${waveManifest.roots.implementation}contracts.ts`,
    `${waveManifest.roots.implementation}discovery.ts`,
    `${waveManifest.roots.implementation}inventory.ts`,
    `${waveManifest.roots.implementation}provenance.ts`,
    `${waveManifest.roots.implementation}coverage.ts`,
    `${LANE_TEST_ROOTS["Lane A"]}**`,
  ],
  "Lane B": [
    `${waveManifest.roots.implementation}compatibility.ts`,
    `${waveManifest.roots.implementation}scope.ts`,
    `${waveManifest.roots.implementation}owner-decisions.ts`,
    `${waveManifest.roots.implementation}policy.ts`,
    `${LANE_TEST_ROOTS["Lane B"]}**`,
  ],
  "Lane C": [
    `${waveManifest.roots.implementation}skills.ts`,
    `${waveManifest.roots.implementation}hooks.ts`,
    `${waveManifest.roots.implementation}capabilities.ts`,
    `${waveManifest.roots.implementation}continuity.ts`,
    `${LANE_TEST_ROOTS["Lane C"]}**`,
  ],
  "Lane D": [
    `${waveManifest.roots.implementation}wave-manifest.ts`,
    `${waveManifest.roots.implementation}ownership.ts`,
    `${waveManifest.roots.implementation}contract-freeze.ts`,
    `${waveManifest.roots.implementation}reservations.ts`,
    `${waveManifest.roots.implementation}wave-guard.ts`,
    `${waveManifest.roots.implementation}validation.ts`,
    `${waveManifest.roots.implementation}rollback.ts`,
    `${waveManifest.roots.implementation}handover.ts`,
    `${waveManifest.roots.implementation}reviewers.ts`,
    `${LANE_TEST_ROOTS["Lane D"]}**`,
  ],
} as const satisfies Readonly<Record<LaneName, readonly RepositoryPath[]>>;

export const INTEGRATION_OWNER_WRITE_PATHS = [
  `${waveManifest.roots.implementation}integration-gate.ts`,
  `${waveManifest.roots.implementation}pipeline.ts`,
  `${waveManifest.roots.implementation}enablement.ts`,
  `${waveManifest.roots.integrationTests}**`,
  `${waveManifest.roots.generatedEvidence}**`,
] as const satisfies readonly RepositoryPath[];

export const INTEGRATION_SHARED_OUTPUT_PATHS = [
  `${waveManifest.roots.integrationTests}**`,
  `${waveManifest.roots.generatedEvidence}**`,
] as const satisfies readonly RepositoryPath[];

function createReadScope(agentId: Identifier, lane: LaneName): ReadWriteScope {
  return {
    scopeId: `${lane.toLowerCase().replace(" ", "-")}-read-scope`,
    agentId,
    readPaths: [
      ...COMMON_READ_PATHS,
      FEATURE_IMPLEMENTATION_READ_PATH,
      FEATURE_TEST_READ_PATH,
    ],
    writePaths: [],
    sharedOutputPaths: [],
  };
}

function createWriteScope(
  agentId: Identifier,
  lane: LaneName,
  writePaths: readonly RepositoryPath[],
): ReadWriteScope {
  return {
    scopeId: `${lane.toLowerCase().replace(" ", "-")}-write-scope`,
    agentId,
    readPaths: [],
    writePaths,
    sharedOutputPaths: [],
  };
}

function createLaneDeclaration(
  lane: LaneName,
  writePaths: readonly RepositoryPath[],
): ImplementationAgentDeclaration {
  const agentId = LANE_AGENT_IDS[lane];

  return {
    agentId,
    lane,
    readScope: createReadScope(agentId, lane),
    writeScope: createWriteScope(agentId, lane, writePaths),
    sharedGeneratedOutputOwnership: "none",
  };
}

export const LANE_OWNERSHIP_DECLARATIONS = LANE_NAMES.map((lane) =>
  createLaneDeclaration(lane, LANE_WRITE_PATHS[lane]),
) as readonly ImplementationAgentDeclaration[];

export const laneOwnershipDeclarations = LANE_OWNERSHIP_DECLARATIONS;

export interface IntegrationOwnerOwnership {
  readonly ownerId: typeof INTEGRATION_OWNER_ID;
  readonly role: "post-wave-integration-validation-gate";
  readonly readScope: ReadWriteScope;
  readonly writeScope: ReadWriteScope;
  readonly sharedGeneratedOutputOwnership: "named_disjoint_outputs";
}

export const INTEGRATION_OWNER_OWNERSHIP: IntegrationOwnerOwnership = {
  ownerId: INTEGRATION_OWNER_ID,
  role: "post-wave-integration-validation-gate",
  readScope: {
    scopeId: "integration-owner-read-scope",
    agentId: INTEGRATION_OWNER_ID,
    readPaths: [
      ...COMMON_READ_PATHS,
      FEATURE_IMPLEMENTATION_READ_PATH,
      FEATURE_TEST_READ_PATH,
    ],
    writePaths: [],
    sharedOutputPaths: [],
  },
  writeScope: {
    scopeId: "integration-owner-write-scope",
    agentId: INTEGRATION_OWNER_ID,
    readPaths: [],
    writePaths: INTEGRATION_OWNER_WRITE_PATHS,
    sharedOutputPaths: INTEGRATION_SHARED_OUTPUT_PATHS,
  },
  sharedGeneratedOutputOwnership: "named_disjoint_outputs",
};

export const integrationOwnerOwnership = INTEGRATION_OWNER_OWNERSHIP;

export type OwnershipConflictKind =
  | "duplicate_agent"
  | "duplicate_path"
  | "overlapping_write"
  | "missing_ownership"
  | "unspecified_ownership"
  | "stale_ownership"
  | "invalid_scope"
  | "shared_output_ownership";

export interface OwnershipConflict extends WaveConflict {
  readonly kind: OwnershipConflictKind;
}

export interface OwnershipValidationOutput {
  readonly valid: boolean;
  readonly declarations: readonly ImplementationAgentDeclaration[];
  readonly integrationOwner: IntegrationOwnerOwnership | null;
  readonly sharedGeneratedOutputOwnership: "none";
  readonly conflicts: readonly OwnershipConflict[];
}

export interface OwnershipValidationInput {
  readonly declarations?: readonly ImplementationAgentDeclaration[] | null;
  readonly integrationOwner?: IntegrationOwnerOwnership | null;
  readonly waveManifest?: WaveManifest;
  readonly ownershipManifestVersion?: string;
}

export interface OwnershipManifest {
  readonly featureName: typeof FEATURE_NAME;
  readonly repositoryRoot: typeof REPOSITORY_ROOT;
  readonly ownershipManifestVersion: typeof OWNERSHIP_MANIFEST_VERSION;
  readonly waveManifestStatus: WaveManifest["status"];
  readonly agents: readonly ImplementationAgentDeclaration[];
  readonly integrationOwner: IntegrationOwnerOwnership;
  readonly sharedGeneratedOutputOwnership: "none";
  readonly integrationOwnerPaths: readonly RepositoryPath[];
  readonly conflicts: readonly OwnershipConflict[];
  readonly status: "valid" | "blocked";
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function isRepositoryRelativePath(path: string): boolean {
  const normalized = normalizePath(path);
  return normalized.length > 0 && !normalized.startsWith("/") && !/^[A-Za-z]:\//.test(normalized);
}

function pathPatternMatches(pattern: RepositoryPath, candidate: RepositoryPath): boolean {
  const normalizedPattern = normalizePath(pattern);
  const normalizedCandidate = normalizePath(candidate);

  if (normalizedPattern === normalizedCandidate) {
    return true;
  }

  if (normalizedPattern.endsWith("/**")) {
    const basePath = normalizedPattern.slice(0, -3).replace(/\/$/, "");
    return normalizedCandidate.startsWith(`${basePath}/`);
  }

  return false;
}

function pathPatternsOverlap(left: RepositoryPath, right: RepositoryPath): boolean {
  return pathPatternMatches(left, right) || pathPatternMatches(right, left);
}

function conflictId(
  kind: OwnershipConflictKind,
  agentIds: readonly Identifier[],
  paths: readonly RepositoryPath[],
): Identifier {
  const suffix = [...agentIds, ...paths]
    .join("-")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `ownership-conflict-${kind}-${suffix || "unspecified"}`;
}

function addConflict(
  conflicts: OwnershipConflict[],
  kind: OwnershipConflictKind,
  agentIds: readonly Identifier[],
  paths: readonly RepositoryPath[],
  reason: string,
): void {
  const id = conflictId(kind, agentIds, paths);
  if (conflicts.some((conflict) => conflict.conflictId === id)) {
    return;
  }

  conflicts.push({
    conflictId: id,
    kind,
    agentIds,
    paths,
    reason,
    status: "blocking",
  });
}

function validateFrozenManifest(
  candidate: WaveManifest,
  conflicts: OwnershipConflict[],
): void {
  if (candidate.featureName !== waveManifest.featureName || candidate.repositoryRoot !== waveManifest.repositoryRoot) {
    addConflict(
      conflicts,
      "stale_ownership",
      [],
      [],
      "ownership declarations do not target the frozen feature name and repository root",
    );
  }

  if (
    candidate.status !== waveManifest.status ||
    candidate.roots.implementation !== waveManifest.roots.implementation ||
    candidate.roots.integrationTests !== waveManifest.roots.integrationTests ||
    candidate.roots.generatedEvidence !== waveManifest.roots.generatedEvidence ||
    candidate.rootExecution.packageManager !== waveManifest.rootExecution.packageManager ||
    candidate.rootExecution.workingDirectory !== waveManifest.rootExecution.workingDirectory
  ) {
    addConflict(
      conflicts,
      "stale_ownership",
      [],
      [],
      "ownership declarations are stale or inconsistent with the frozen wave-manifest.ts",
    );
  }

  if (
    candidate.generatedOutputOwnership.laneSharedGeneratedOutputOwnership !== "none" ||
    candidate.generatedOutputOwnership.integrationOwner !== waveManifest.generatedOutputOwnership.integrationOwner
  ) {
    addConflict(
      conflicts,
      "shared_output_ownership",
      [],
      INTEGRATION_OWNER_WRITE_PATHS,
      "the frozen wave manifest does not permit lane-owned shared generated output",
    );
  }
}

function validateScope(
  declaration: ImplementationAgentDeclaration,
  conflicts: OwnershipConflict[],
): void {
  const readScope = declaration?.readScope;
  const writeScope = declaration?.writeScope;
  const agentId = typeof declaration?.agentId === "string" ? declaration.agentId : "unspecified-agent";

  if (!readScope || !writeScope) {
    addConflict(
      conflicts,
      "invalid_scope",
      [agentId],
      [],
      `agent ${agentId} has a missing read or write scope`,
    );
    return;
  }

  const scopes: readonly ReadWriteScope[] = [readScope, writeScope];
  for (const scope of scopes) {
    const scopeReadPaths = scope.readPaths ?? [];
    const scopeWritePaths = scope.writePaths ?? [];
    const scopeSharedOutputPaths = scope.sharedOutputPaths ?? [];

    if (scope.agentId !== declaration.agentId || typeof scope.scopeId !== "string" || scope.scopeId.trim().length === 0) {
      addConflict(
        conflicts,
        "invalid_scope",
        [agentId],
        [],
        `agent ${agentId} has a missing or mismatched read/write scope`,
      );
      continue;
    }

    const allPaths = [...scopeReadPaths, ...scopeWritePaths, ...scopeSharedOutputPaths];
    for (const path of allPaths) {
      if (typeof path !== "string" || !isRepositoryRelativePath(path)) {
        addConflict(
          conflicts,
          "invalid_scope",
          [agentId],
          typeof path === "string" ? [path] : [],
          `agent ${agentId} declares an absolute or empty repository path`,
        );
      }
    }
  }

  const readPaths = readScope.readPaths ?? [];
  const writePaths = writeScope.writePaths ?? [];
  const sharedReadPaths = readScope.sharedOutputPaths ?? [];
  const sharedWritePaths = writeScope.sharedOutputPaths ?? [];

  if (readPaths.length === 0) {
    addConflict(
      conflicts,
      "missing_ownership",
      [agentId],
      [],
      `agent ${agentId} has no explicit read scope`,
    );
  }

  if (writePaths.length === 0) {
    addConflict(
      conflicts,
      "missing_ownership",
      [agentId],
      [],
      `agent ${agentId} has no explicit write scope`,
    );
  }

  if (
    declaration.sharedGeneratedOutputOwnership !== "none" ||
    sharedWritePaths.length > 0 ||
    sharedReadPaths.length > 0
  ) {
    addConflict(
      conflicts,
      "shared_output_ownership",
      [agentId],
      [...sharedReadPaths, ...sharedWritePaths],
      `lane ${declaration.lane} must not own shared generated output`,
    );
  }
}

function validateExpectedWritePaths(
  declaration: ImplementationAgentDeclaration,
  expectedPaths: readonly RepositoryPath[],
  conflicts: OwnershipConflict[],
): void {
  const declaredPaths = declaration.writeScope?.writePaths ?? [];
  const declaredCounts = new Map<RepositoryPath, number>();

  for (const path of declaredPaths) {
    declaredCounts.set(path, (declaredCounts.get(path) ?? 0) + 1);
  }

  for (const [path, count] of declaredCounts) {
    if (count > 1) {
      addConflict(
        conflicts,
        "duplicate_path",
        [declaration.agentId],
        [path],
        `agent ${declaration.agentId} declares the write path more than once`,
      );
    }
  }

  const expectedSet = new Set(expectedPaths);
  const declaredSet = new Set(declaredPaths);

  for (const path of expectedSet) {
    if (!declaredSet.has(path)) {
      addConflict(
        conflicts,
        "missing_ownership",
        [declaration.agentId],
        [path],
        `agent ${declaration.agentId} does not declare ownership of required path ${path}`,
      );
    }
  }

  for (const path of declaredSet) {
    if (!expectedSet.has(path)) {
      addConflict(
        conflicts,
        "unspecified_ownership",
        [declaration.agentId],
        [path],
        `agent ${declaration.agentId} declares out-of-contract write path ${path}`,
      );
    }
  }
}

function validateLaneDeclarations(
  declarations: readonly ImplementationAgentDeclaration[],
  conflicts: OwnershipConflict[],
): void {
  const seenAgentIds = new Set<Identifier>();
  const seenLanes = new Set<LaneName>();

  for (const declaration of declarations) {
    const agentId = typeof declaration?.agentId === "string" ? declaration.agentId : "";

    if (agentId.trim().length === 0) {
      addConflict(
        conflicts,
        "missing_ownership",
        ["unspecified-agent"],
        [],
        "an implementation lane is missing an agent identifier",
      );
      continue;
    }

    if (seenAgentIds.has(agentId)) {
      addConflict(
        conflicts,
        "duplicate_agent",
        [agentId],
        declaration.writeScope?.writePaths ?? [],
        `agent identifier ${agentId} is declared more than once`,
      );
    }
    seenAgentIds.add(agentId);

    if (!LANE_NAMES.includes(declaration.lane)) {
      addConflict(
        conflicts,
        "unspecified_ownership",
        [agentId],
        declaration.writeScope?.writePaths ?? [],
        `agent ${agentId} does not declare one of the four known lanes`,
      );
      continue;
    }

    if (seenLanes.has(declaration.lane)) {
      addConflict(
        conflicts,
        "duplicate_agent",
        [agentId],
        declaration.writeScope?.writePaths ?? [],
        `${declaration.lane} is declared more than once`,
      );
    }
    seenLanes.add(declaration.lane);

    if (agentId !== LANE_AGENT_IDS[declaration.lane]) {
      addConflict(
        conflicts,
        "unspecified_ownership",
        [agentId],
        declaration.writeScope?.writePaths ?? [],
        `${declaration.lane} has an unexpected agent identifier`,
      );
    }

    validateScope(declaration, conflicts);
    validateExpectedWritePaths(declaration, LANE_WRITE_PATHS[declaration.lane], conflicts);
  }

  for (const lane of LANE_NAMES) {
    if (!seenLanes.has(lane)) {
      addConflict(
        conflicts,
        "missing_ownership",
        [LANE_AGENT_IDS[lane]],
        LANE_WRITE_PATHS[lane],
        `${lane} has no ownership declaration`,
      );
    }
  }
}

function validateIntegrationOwner(
  integrationOwner: IntegrationOwnerOwnership | null,
  conflicts: OwnershipConflict[],
): void {
  if (!integrationOwner) {
    addConflict(
      conflicts,
      "missing_ownership",
      [INTEGRATION_OWNER_ID],
      INTEGRATION_OWNER_WRITE_PATHS,
      "the post-wave integration owner has no ownership declaration",
    );
    return;
  }

  if (integrationOwner.ownerId !== INTEGRATION_OWNER_ID) {
    addConflict(
      conflicts,
      "unspecified_ownership",
      [integrationOwner.ownerId],
      integrationOwner.writeScope?.writePaths ?? [],
      "the integration owner identifier is not the declared post-wave owner",
    );
  }

  if (integrationOwner.sharedGeneratedOutputOwnership !== "named_disjoint_outputs") {
    addConflict(
      conflicts,
      "shared_output_ownership",
      [integrationOwner.ownerId],
      integrationOwner.writeScope?.sharedOutputPaths ?? [],
      "the integration owner must explicitly own named disjoint generated outputs",
    );
  }

  const writeScope = integrationOwner.writeScope;
  if (!writeScope || writeScope.agentId !== integrationOwner.ownerId || writeScope.scopeId.trim().length === 0) {
    addConflict(
      conflicts,
      "invalid_scope",
      [integrationOwner.ownerId],
      [],
      "the integration owner has a missing or mismatched write scope",
    );
    return;
  }

  const readScope = integrationOwner.readScope;
  if (!readScope || readScope.agentId !== integrationOwner.ownerId || typeof readScope.scopeId !== "string" || readScope.scopeId.trim().length === 0) {
    addConflict(
      conflicts,
      "invalid_scope",
      [integrationOwner.ownerId],
      [],
      "the integration owner has a missing or mismatched read scope",
    );
    return;
  }

  if (readScope.readPaths.length === 0) {
    addConflict(
      conflicts,
      "missing_ownership",
      [integrationOwner.ownerId],
      [],
      "the integration owner has no explicit read scope",
    );
  }

  validateExpectedWritePaths(
    {
      agentId: integrationOwner.ownerId,
      lane: "Lane D",
      readScope,
      writeScope,
      sharedGeneratedOutputOwnership: "none",
    },
    INTEGRATION_OWNER_WRITE_PATHS,
    conflicts,
  );

  const declaredSharedOutputPaths = new Set(writeScope.sharedOutputPaths);
  for (const path of INTEGRATION_SHARED_OUTPUT_PATHS) {
    if (!declaredSharedOutputPaths.has(path)) {
      addConflict(
        conflicts,
        "missing_ownership",
        [integrationOwner.ownerId],
        [path],
        `integration owner does not declare shared generated output ${path}`,
      );
    }
  }
}

function validateWriteDisjointness(
  declarations: readonly ImplementationAgentDeclaration[],
  integrationOwner: IntegrationOwnerOwnership | null,
  conflicts: OwnershipConflict[],
): void {
  const owners = declarations.map((declaration) => ({
    agentId: declaration.agentId,
    paths: declaration.writeScope?.writePaths ?? [],
  }));

  if (integrationOwner) {
    owners.push({
      agentId: integrationOwner.ownerId,
      paths: integrationOwner.writeScope?.writePaths ?? [],
    });
  }

  for (let leftIndex = 0; leftIndex < owners.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < owners.length; rightIndex += 1) {
      const left = owners[leftIndex];
      const right = owners[rightIndex];

      for (const leftPath of left.paths) {
        for (const rightPath of right.paths) {
          if (pathPatternsOverlap(leftPath, rightPath)) {
            addConflict(
              conflicts,
              leftPath === rightPath ? "duplicate_path" : "overlapping_write",
              [left.agentId, right.agentId],
              [leftPath, rightPath],
              `write ownership overlaps between ${left.agentId} and ${right.agentId}`,
            );
          }
        }
      }
    }
  }
}

export function validateOwnership(
  input: OwnershipValidationInput = {},
): StageResult<OwnershipValidationOutput> {
  const declarations = input.declarations === undefined ? LANE_OWNERSHIP_DECLARATIONS : input.declarations;
  const integrationOwner =
    input.integrationOwner === undefined ? INTEGRATION_OWNER_OWNERSHIP : input.integrationOwner;
  const conflicts: OwnershipConflict[] = [];
  const candidateManifest = input.waveManifest ?? waveManifest;

  validateFrozenManifest(candidateManifest, conflicts);

  if (
    input.ownershipManifestVersion !== undefined &&
    input.ownershipManifestVersion !== OWNERSHIP_MANIFEST_VERSION
  ) {
    addConflict(
      conflicts,
      "stale_ownership",
      [],
      [],
      "ownership declarations use a stale ownership manifest version",
    );
  }

  validateLaneDeclarations(declarations ?? [], conflicts);
  validateIntegrationOwner(integrationOwner, conflicts);
  validateWriteDisjointness(declarations ?? [], integrationOwner, conflicts);

  const output: OwnershipValidationOutput = {
    valid: conflicts.length === 0,
    declarations: declarations ?? [],
    integrationOwner,
    sharedGeneratedOutputOwnership: "none",
    conflicts,
  };

  if (conflicts.length > 0) {
    return {
      status: "blocked",
      output,
      blockers: conflicts.map((conflict) => conflict.reason),
      evidenceRefs: [],
    };
  }

  return {
    status: "pass",
    output,
    blockers: [],
    evidenceRefs: [],
  };
}

export const OWNERSHIP_VALIDATION = validateOwnership({
  ownershipManifestVersion: OWNERSHIP_MANIFEST_VERSION,
});

const ownershipOutput = OWNERSHIP_VALIDATION.output ?? {
  valid: false,
  declarations: LANE_OWNERSHIP_DECLARATIONS,
  integrationOwner: INTEGRATION_OWNER_OWNERSHIP,
  sharedGeneratedOutputOwnership: "none" as const,
  conflicts: [
    {
      conflictId: "ownership-conflict-missing-validation-output",
      kind: "missing_ownership" as const,
      agentIds: [],
      paths: [],
      reason: "ownership validation did not produce an output record",
      status: "blocking" as const,
    },
  ],
};

export const OWNERSHIP_MANIFEST: OwnershipManifest = {
  featureName: FEATURE_NAME,
  repositoryRoot: REPOSITORY_ROOT,
  ownershipManifestVersion: OWNERSHIP_MANIFEST_VERSION,
  waveManifestStatus: waveManifest.status,
  agents: LANE_OWNERSHIP_DECLARATIONS,
  integrationOwner: INTEGRATION_OWNER_OWNERSHIP,
  sharedGeneratedOutputOwnership: "none",
  integrationOwnerPaths: INTEGRATION_OWNER_WRITE_PATHS,
  conflicts: ownershipOutput.conflicts,
  status: ownershipOutput.valid ? "valid" : "blocked",
};

export const ownershipManifest = OWNERSHIP_MANIFEST;
