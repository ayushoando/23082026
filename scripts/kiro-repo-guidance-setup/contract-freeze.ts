/**
 * Lane D Shared_Contract_Freeze lifecycle.
 *
 * This module is read-only. It hashes only the known shared contract and
 * ownership-manifest files, validates the completed Lane A/D preparation
 * state, and returns a new freeze record only when every prerequisite passes.
 * A failed attempt never replaces a prior freeze and never authorizes work.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

import {
  FEATURE_NAME,
  FEATURE_WAVE_MAX_ACTIVE_AGENTS,
  PACKAGE_MANAGER,
  REPOSITORY_ROOT,
  type ConcurrentImplementationWaveRecord,
  type FileOwnershipReservation,
  type Identifier,
  type IsoDate,
  type RepositoryPath,
  type SharedContractFreeze,
  type StageResult,
  type ValidationResult,
} from "./contracts";
import {
  OWNERSHIP_MANIFEST,
  OWNERSHIP_MANIFEST_VERSION,
  validateOwnership,
} from "./ownership";
import {
  OD04_APPROVAL_BOUNDARY_REF,
  OD04_CONFLICT_POLICY,
  OD04_FEATURE_SCOPE,
  OD04_ROLLBACK_PATH,
  type GovernedFileOwnershipReservation,
} from "./reservations";

export const SHARED_CONTRACT_PATHS = [
  ".kiro/kiro-repo-guidance-setup/contracts.ts",
] as const satisfies readonly RepositoryPath[];

export const OWNERSHIP_MANIFEST_PATH =
  ".kiro/kiro-repo-guidance-setup/ownership.ts" as const;

export const CONTRACT_FREEZE_VALIDATION_RUN_PREFIX =
  "validation:shared-contract-freeze" as const;

export type ContractHash = {
  readonly path: RepositoryPath;
  readonly hash: string;
};

export type ValidatedSharedContractFreeze = SharedContractFreeze & {
  readonly validationResult: "pass";
  readonly contractHashes: readonly ContractHash[];
  readonly ownershipManifestVersion: typeof OWNERSHIP_MANIFEST_VERSION;
  readonly ownershipManifestHash: string;
};

export interface ContractFreezeRequest {
  readonly wave: ConcurrentImplementationWaveRecord;
  readonly repositoryRoot?: RepositoryPath;
  readonly contractPaths?: readonly RepositoryPath[];
  readonly freezeId?: Identifier;
  readonly owner?: string;
  readonly frozenAtUtc?: IsoDate;
  readonly validationRunRef?: Identifier;
  readonly priorFreeze?: SharedContractFreeze | null;
}

export interface ContractFreezeResult {
  readonly freeze: ValidatedSharedContractFreeze | null;
  readonly priorFreeze: SharedContractFreeze | null;
  readonly frozenContractPaths: readonly RepositoryPath[];
  readonly contractVersionOrHash?: string;
  readonly validationResult: ValidationResult;
  readonly dependentWorkAllowed: boolean;
  readonly preservedPriorState: true;
}

export interface SharedContractFreezeValidationInput {
  readonly wave: ConcurrentImplementationWaveRecord;
  readonly freeze?: SharedContractFreeze | null;
  readonly repositoryRoot?: RepositoryPath;
  readonly contractPaths?: readonly RepositoryPath[];
}

export interface SharedContractFreezeValidationOutput {
  readonly valid: boolean;
  readonly freeze: ValidatedSharedContractFreeze | null;
  readonly currentContractVersionOrHash?: string;
  readonly contractHashes: readonly ContractHash[];
  readonly currentOwnershipManifestHash?: string;
  readonly preservedPriorState: true;
}

interface HashedFiles {
  readonly entries: readonly ContractHash[];
  readonly aggregateHash: string;
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, "");
}

function isRepositoryRelativePath(path: string): boolean {
  const normalized = normalizePath(path);
  return (
    normalized.length > 0 &&
    !isAbsolute(path) &&
    !/^[A-Za-z]:\//.test(normalized) &&
    normalized !== ".." &&
    !normalized.startsWith("../")
  );
}

function pathPatternMatches(pattern: string, candidate: string): boolean {
  const normalizedPattern = normalizePath(pattern);
  const normalizedCandidate = normalizePath(candidate);

  if (normalizedPattern === normalizedCandidate) {
    return true;
  }

  if (normalizedPattern.endsWith("/**")) {
    const base = normalizedPattern.slice(0, -3).replace(/\/$/, "");
    return normalizedCandidate.startsWith(`${base}/`);
  }

  return false;
}

function validIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value);
}

function uniqueSorted(paths: readonly RepositoryPath[]): RepositoryPath[] {
  return [...new Set(paths.map(normalizePath))].sort();
}

function expectedContractPaths(
  paths: readonly RepositoryPath[] | undefined,
): { paths: RepositoryPath[]; blockers: string[] } {
  const candidatePaths = uniqueSorted(paths ?? SHARED_CONTRACT_PATHS);
  const expectedPaths = uniqueSorted(SHARED_CONTRACT_PATHS);
  const blockers: string[] = [];

  if ((paths ?? SHARED_CONTRACT_PATHS).some((path) => !isRepositoryRelativePath(path))) {
    blockers.push("Shared_Contract_Freeze contract paths must be repository-relative and cannot escape the repository root");
  }
  if (candidatePaths.length !== expectedPaths.length || candidatePaths.some((path, index) => path !== expectedPaths[index])) {
    blockers.push(
      `Shared_Contract_Freeze must freeze exactly the shared contract paths: ${expectedPaths.join(", ")}`,
    );
  }

  return { paths: candidatePaths, blockers };
}

function resolveRepositoryFile(repositoryRoot: RepositoryPath, repositoryPath: RepositoryPath): string {
  const root = resolve(repositoryRoot);
  const candidate = resolve(root, repositoryPath);
  const relativeCandidate = normalizePath(relative(root, candidate));

  if (
    relativeCandidate === ".." ||
    relativeCandidate.startsWith("../") ||
    isAbsolute(relativeCandidate)
  ) {
    throw new Error(`path ${repositoryPath} escapes repository root`);
  }

  return candidate;
}

function hashFiles(
  repositoryRoot: RepositoryPath,
  paths: readonly RepositoryPath[],
): { output?: HashedFiles; blockers: string[] } {
  const blockers: string[] = [];
  const entries: ContractHash[] = [];
  const aggregate = createHash("sha256");

  for (const path of uniqueSorted(paths)) {
    try {
      const absolutePath = resolveRepositoryFile(repositoryRoot, path);
      const bytes = readFileSync(absolutePath);
      const fileHash = createHash("sha256").update(bytes).digest("hex");
      entries.push({ path, hash: `sha256:${fileHash}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unreadable file";
      blockers.push(`unable to hash ${path}: ${message}`);
    }
  }

  if (blockers.length > 0) {
    return { blockers };
  }

  for (const entry of entries) {
    aggregate.update(`${entry.path}\n${entry.hash}\n`, "utf8");
  }

  return {
    output: {
      entries,
      aggregateHash: `sha256:${aggregate.digest("hex")}`,
    },
    blockers,
  };
}

function addWavePolicyBlockers(
  wave: ConcurrentImplementationWaveRecord,
  blockers: string[],
): void {
  if (wave.featureName !== FEATURE_NAME) {
    blockers.push("the Shared_Contract_Freeze wave is outside the feature scope");
  }
  if (wave.scope !== "feature_only") {
    blockers.push("the Shared_Contract_Freeze wave must use feature_only scope");
  }
  if (wave.rootWorkingDirectory !== REPOSITORY_ROOT) {
    blockers.push(`the Shared_Contract_Freeze wave must use repository root ${REPOSITORY_ROOT}`);
  }
  if (wave.packageManager !== PACKAGE_MANAGER) {
    blockers.push("the Shared_Contract_Freeze wave must use root-only pnpm");
  }
  if (wave.worktrees !== "prohibited") {
    blockers.push("worktrees are prohibited for the Shared_Contract_Freeze wave");
  }
  if (wave.hiddenSpawning !== "prohibited") {
    blockers.push("hidden spawning is prohibited for the Shared_Contract_Freeze wave");
  }
  if (wave.automaticRetries !== "prohibited") {
    blockers.push("automatic retries are prohibited for the Shared_Contract_Freeze wave");
  }
  if (wave.automaticReplans !== "prohibited") {
    blockers.push("automatic replans are prohibited for the Shared_Contract_Freeze wave");
  }
  if (wave.maxActiveAgents > FEATURE_WAVE_MAX_ACTIVE_AGENTS) {
    blockers.push("the Shared_Contract_Freeze wave may have no more than four active agents");
  }
  if (wave.activeAgentCount > FEATURE_WAVE_MAX_ACTIVE_AGENTS || wave.activeAgentCount > wave.maxActiveAgents) {
    blockers.push("active agents exceed the Shared_Contract_Freeze wave limit");
  }
  if (wave.declaredSharedOutputOwnership !== "none") {
    blockers.push("lane-owned shared generated output is prohibited");
  }
  if (wave.conflictPolicy !== OD04_CONFLICT_POLICY) {
    blockers.push("the Shared_Contract_Freeze wave must fail closed on ownership conflicts");
  }
  if (!wave.approvalBoundaryRefs.some((ref) => ref.toUpperCase().includes("OD-04"))) {
    blockers.push("the Shared_Contract_Freeze wave requires the OD-04 approval boundary");
  }
  if (wave.integrationValidationGateRef.trim().length === 0) {
    blockers.push("the Shared_Contract_Freeze wave must name one integration validation gate");
  }
  if (wave.rollbackPath.trim().length === 0) {
    blockers.push("the Shared_Contract_Freeze wave must record a rollback path");
  }
  if (wave.sharedContractFreezeRef.trim().length === 0) {
    blockers.push("the Shared_Contract_Freeze wave must name its freeze reference");
  }
}

function addReservationBlockers(
  wave: ConcurrentImplementationWaveRecord,
  reservations: readonly FileOwnershipReservation[],
  blockers: string[],
): void {
  const seenIds = new Set<Identifier>();
  const activeReservations = reservations.filter((reservation) => reservation.status === "active");

  for (const reservation of reservations) {
    if (seenIds.has(reservation.reservationId)) {
      blockers.push(`reservation ${reservation.reservationId} is duplicated`);
    }
    seenIds.add(reservation.reservationId);

    if (reservation.waveId !== wave.waveId) {
      blockers.push(`reservation ${reservation.reservationId} belongs to a different wave`);
    }
    if (reservation.status !== "active") {
      blockers.push(`reservation ${reservation.reservationId} is ${reservation.status}`);
    }
    if (!reservation.acquiredBeforeMutation) {
      blockers.push(`reservation ${reservation.reservationId} was not acquired before mutation`);
    }
    if (reservation.conflictRefs.length > 0) {
      blockers.push(`reservation ${reservation.reservationId} contains unresolved conflicts`);
    }
    if (reservation.sharedOutputs.length > 0) {
      blockers.push(`reservation ${reservation.reservationId} owns prohibited shared generated output`);
    }

    const governed = reservation as Partial<GovernedFileOwnershipReservation>;
    if (
      governed.featureName !== FEATURE_NAME ||
      governed.repositoryRoot !== REPOSITORY_ROOT ||
      governed.featureScope !== OD04_FEATURE_SCOPE ||
      !Array.isArray(governed.approvalBoundaryRefs) ||
      !governed.approvalBoundaryRefs.some((ref) => ref.toUpperCase().includes("OD-04")) ||
      typeof governed.rollbackPath !== "string" ||
      governed.rollbackPath.trim().length === 0
    ) {
      blockers.push(`reservation ${reservation.reservationId} is missing complete OD-04 governance metadata`);
    }
  }

  for (let leftIndex = 0; leftIndex < activeReservations.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < activeReservations.length; rightIndex += 1) {
      const left = activeReservations[leftIndex];
      const right = activeReservations[rightIndex];
      const overlaps = left.targetPaths.some((leftPath) =>
        right.targetPaths.some((rightPath) =>
          pathPatternMatches(leftPath, rightPath) || pathPatternMatches(rightPath, leftPath),
        ),
      );
      if (overlaps) {
        blockers.push(`active reservations ${left.reservationId} and ${right.reservationId} overlap`);
      }
    }
  }
}

function addOwnershipBlockers(
  wave: ConcurrentImplementationWaveRecord,
  contractPath: RepositoryPath,
  blockers: string[],
): void {
  const ownershipResult = validateOwnership({
    declarations: wave.implementationAgents,
    ownershipManifestVersion: OWNERSHIP_MANIFEST_VERSION,
  });

  if (ownershipResult.status !== "pass") {
    blockers.push(...ownershipResult.blockers);
  }
  if (OWNERSHIP_MANIFEST.status !== "valid") {
    blockers.push("the current ownership manifest is blocked");
  }

  const laneA = OWNERSHIP_MANIFEST.agents.find((agent) => agent.lane === "Lane A");
  if (!laneA || !laneA.writeScope.writePaths.some((path) => pathPatternMatches(path, contractPath))) {
    blockers.push(`${contractPath} is not owned by Lane A in the current ownership manifest`);
  }
}

function freezeOutput(
  input: ContractFreezeRequest,
  frozenContractPaths: readonly RepositoryPath[],
  blockers: readonly string[],
  contractVersionOrHash?: string,
): ContractFreezeResult {
  return {
    freeze: null,
    priorFreeze: input.priorFreeze ?? null,
    frozenContractPaths,
    contractVersionOrHash,
    validationResult: blockers.length === 0 ? "pass" : "blocked",
    dependentWorkAllowed: false,
    preservedPriorState: true,
  };
}

function blockedValidationOutput(
  contractHashes: readonly ContractHash[],
  currentContractVersionOrHash: string | undefined,
  currentOwnershipManifestHash: string | undefined,
): SharedContractFreezeValidationOutput {
  return {
    valid: false,
    freeze: null,
    currentContractVersionOrHash,
    contractHashes,
    currentOwnershipManifestHash,
    preservedPriorState: true,
  };
}

/**
 * Validate a supplied freeze against current bytes and the current ownership
 * manifest. This is the consumer-facing check used by wave-guard before any
 * dependent mutation.
 */
export function validateSharedContractFreeze(
  input: SharedContractFreezeValidationInput,
): StageResult<SharedContractFreezeValidationOutput> {
  const repositoryRoot = input.repositoryRoot ?? REPOSITORY_ROOT;
  const expectedPaths = expectedContractPaths(input.contractPaths);
  const blockers = [...expectedPaths.blockers];

  if (!input.freeze) {
    blockers.push("a Shared_Contract_Freeze is required before dependent mutation");
  }

  const contractHashResult = hashFiles(repositoryRoot, expectedPaths.paths);
  blockers.push(...contractHashResult.blockers);
  const contractHashes = contractHashResult.output?.entries ?? [];
  const currentContractVersionOrHash = contractHashResult.output?.aggregateHash;

  const ownershipHashResult = hashFiles(repositoryRoot, [OWNERSHIP_MANIFEST_PATH]);
  blockers.push(...ownershipHashResult.blockers);
  const currentOwnershipManifestHash = ownershipHashResult.output?.aggregateHash;

  if (input.wave.featureName !== FEATURE_NAME) {
    blockers.push("the Shared_Contract_Freeze wave is outside the feature scope");
  }
  if (input.wave.sharedContractFreezeRef.trim().length === 0) {
    blockers.push("the wave has no Shared_Contract_Freeze reference");
  }

  const ownershipResult = validateOwnership({
    ownershipManifestVersion: OWNERSHIP_MANIFEST_VERSION,
  });
  if (ownershipResult.status !== "pass") {
    blockers.push(...ownershipResult.blockers);
  }
  if (OWNERSHIP_MANIFEST.status !== "valid") {
    blockers.push("the current ownership manifest is blocked");
  }

  const freeze = input.freeze as Partial<ValidatedSharedContractFreeze> | undefined;
  if (freeze) {
    if (freeze.waveId !== input.wave.waveId) {
      blockers.push("the Shared_Contract_Freeze belongs to a different wave");
    }
    if (freeze.freezeId !== input.wave.sharedContractFreezeRef) {
      blockers.push("the wave freeze reference does not match the supplied Shared_Contract_Freeze");
    }
    if (freeze.dependentWorkAllowed !== true) {
      blockers.push("the Shared_Contract_Freeze does not allow dependent work");
    }
    if (freeze.contractVersionOrHash !== currentContractVersionOrHash) {
      blockers.push("the Shared_Contract_Freeze contract hash is stale or inconsistent with current bytes");
    }
    if (freeze.validationResult !== "pass") {
      blockers.push("the Shared_Contract_Freeze does not contain a passing validation result");
    }
    if (typeof freeze.owner !== "string" || freeze.owner.trim().length === 0) {
      blockers.push("the Shared_Contract_Freeze is missing an owner");
    }
    if (typeof freeze.validationRunRef !== "string" || freeze.validationRunRef.trim().length === 0) {
      blockers.push("the Shared_Contract_Freeze is missing validation evidence");
    }
    if (typeof freeze.frozenAtUtc !== "string" || !validIsoDate(freeze.frozenAtUtc)) {
      blockers.push("the Shared_Contract_Freeze timestamp is not a valid ISO UTC timestamp");
    }
    if (freeze.ownershipManifestVersion !== OWNERSHIP_MANIFEST_VERSION) {
      blockers.push("the Shared_Contract_Freeze ownership-manifest version is stale or inconsistent");
    }
    if (
      typeof freeze.ownershipManifestHash !== "string" ||
      freeze.ownershipManifestHash !== currentOwnershipManifestHash
    ) {
      blockers.push("the Shared_Contract_Freeze ownership-manifest hash is stale or inconsistent");
    }

    const freezePaths = Array.isArray(freeze.contracts) ? uniqueSorted(freeze.contracts) : [];
    if (
      freezePaths.length !== expectedPaths.paths.length ||
      freezePaths.some((path, index) => path !== expectedPaths.paths[index])
    ) {
      blockers.push("the Shared_Contract_Freeze paths are stale or inconsistent with the ownership manifest");
    }

    const freezeHashes = Array.isArray(freeze.contractHashes) ? freeze.contractHashes : [];
    if (
      freezeHashes.length !== contractHashes.length ||
      freezeHashes.some((entry, index) =>
        entry.path !== contractHashes[index]?.path || entry.hash !== contractHashes[index]?.hash,
      )
    ) {
      blockers.push("the Shared_Contract_Freeze per-file hashes are stale or incomplete");
    }
  }

  const output = blockedValidationOutput(
    contractHashes,
    currentContractVersionOrHash,
    currentOwnershipManifestHash,
  );

  if (blockers.length > 0 || !input.freeze) {
    return {
      status: "blocked",
      output,
      blockers,
      evidenceRefs: [],
    };
  }

  const validatedFreeze = input.freeze as ValidatedSharedContractFreeze;
  const validatedOutput: SharedContractFreezeValidationOutput = {
    ...output,
    valid: true,
    freeze: validatedFreeze,
  };
  return {
    status: "pass",
    output: validatedOutput,
    blockers: [],
    evidenceRefs: [validatedFreeze.freezeId, validatedFreeze.validationRunRef],
  };
}

/**
 * Create the freeze record only after contract, ownership, reservation, and
 * wave-policy prerequisites pass. No filesystem or configuration is written.
 */
export function createSharedContractFreeze(
  input: ContractFreezeRequest,
): StageResult<ContractFreezeResult> {
  const repositoryRoot = input.repositoryRoot ?? REPOSITORY_ROOT;
  const expectedPaths = expectedContractPaths(input.contractPaths);
  const blockers = [...expectedPaths.blockers];
  const wave = input.wave;
  const freezeId = input.freezeId ?? wave.sharedContractFreezeRef;
  const frozenAtUtc = input.frozenAtUtc ?? new Date().toISOString();
  const validationRunRef =
    input.validationRunRef ?? `${CONTRACT_FREEZE_VALIDATION_RUN_PREFIX}:${wave.waveId}`;

  addWavePolicyBlockers(wave, blockers);
  if (freezeId.trim().length === 0 || freezeId !== wave.sharedContractFreezeRef) {
    blockers.push("the freeze ID must match the wave Shared_Contract_Freeze reference");
  }
  if (!validIsoDate(frozenAtUtc)) {
    blockers.push("the Shared_Contract_Freeze timestamp must be a valid ISO UTC timestamp");
  }
  if ((input.owner ?? "repository owner").trim().length === 0) {
    blockers.push("the Shared_Contract_Freeze owner is required");
  }
  if (validationRunRef.trim().length === 0) {
    blockers.push("the Shared_Contract_Freeze validation run reference is required");
  }

  const contractHashResult = hashFiles(repositoryRoot, expectedPaths.paths);
  blockers.push(...contractHashResult.blockers);
  const contractHashes = contractHashResult.output?.entries ?? [];
  const contractVersionOrHash = contractHashResult.output?.aggregateHash;
  const ownershipHashResult = hashFiles(repositoryRoot, [OWNERSHIP_MANIFEST_PATH]);
  blockers.push(...ownershipHashResult.blockers);
  const ownershipManifestHash = ownershipHashResult.output?.aggregateHash;

  if (expectedPaths.paths.length > 0) {
    addOwnershipBlockers(wave, expectedPaths.paths[0], blockers);
  }
  addReservationBlockers(wave, wave.fileOwnershipReservations, blockers);

  if (blockers.length > 0 || !contractVersionOrHash || !ownershipManifestHash) {
    const output = freezeOutput(input, expectedPaths.paths, blockers, contractVersionOrHash);
    return {
      status: "blocked",
      output,
      blockers,
      evidenceRefs: [],
    };
  }

  const candidate: ValidatedSharedContractFreeze = {
    freezeId,
    waveId: wave.waveId,
    contracts: expectedPaths.paths,
    contractVersionOrHash,
    frozenAtUtc,
    dependentWorkAllowed: true,
    owner: input.owner ?? "repository owner",
    validationRunRef,
    validationResult: "pass",
    contractHashes,
    ownershipManifestVersion: OWNERSHIP_MANIFEST_VERSION,
    ownershipManifestHash,
  };

  const validation = validateSharedContractFreeze({
    wave,
    freeze: candidate,
    repositoryRoot,
    contractPaths: expectedPaths.paths,
  });

  if (validation.status !== "pass") {
    const output = freezeOutput(input, expectedPaths.paths, validation.blockers, contractVersionOrHash);
    return {
      status: "blocked",
      output,
      blockers: validation.blockers,
      evidenceRefs: validation.evidenceRefs,
    };
  }

  const output: ContractFreezeResult = {
    freeze: candidate,
    priorFreeze: input.priorFreeze ?? null,
    frozenContractPaths: expectedPaths.paths,
    contractVersionOrHash,
    validationResult: "pass",
    dependentWorkAllowed: true,
    preservedPriorState: true,
  };

  return {
    status: "pass",
    output,
    blockers: [],
    evidenceRefs: [candidate.freezeId, candidate.validationRunRef, candidate.contractVersionOrHash],
  };
}

export const buildSharedContractFreeze = createSharedContractFreeze;
export const validateContractFreeze = validateSharedContractFreeze;

export class ContractFreezeCoordinator {
  create(input: ContractFreezeRequest): StageResult<ContractFreezeResult> {
    return createSharedContractFreeze(input);
  }

  validate(input: SharedContractFreezeValidationInput): StageResult<SharedContractFreezeValidationOutput> {
    return validateSharedContractFreeze(input);
  }
}

export const contractFreezeCoordinator = new ContractFreezeCoordinator();

export default contractFreezeCoordinator;

// Keep the rollback contract explicit: this module never mutates a prior state.
export const CONTRACT_FREEZE_ROLLBACK_PATH = OD04_ROLLBACK_PATH;
export const CONTRACT_FREEZE_APPROVAL_BOUNDARY_REF = OD04_APPROVAL_BOUNDARY_REF;
