/**
 * Lane D fail-closed preflight for the feature-scoped implementation wave.
 *
 * This module validates a proposed wave and consumes reservation/freeze
 * evidence. It does not create a Shared_Contract_Freeze, mutate files, spawn
 * agents, retry work, or resolve ownership conflicts.
 */

import {
  FEATURE_NAME,
  FEATURE_WAVE_MAX_ACTIVE_AGENTS,
  PACKAGE_MANAGER,
  REPOSITORY_ROOT,
  type ConcurrentImplementationWaveRecord,
  type FileOwnershipReservation,
  type Identifier,
  type ImplementationAgentDeclaration,
  type ReadWriteScope,
  type SharedContractFreeze,
  type StageResult,
  type WaveConflict,
} from "./contracts";
import {
  type GovernedFileOwnershipReservation,
  OD04_APPROVAL_BOUNDARY_REF,
  OD04_CONFLICT_POLICY,
  OD04_DECISION_DATE,
  OD04_DECISION_ID,
  OD04_FEATURE_SCOPE,
  OD04_OWNER,
  OD04_ROLLBACK_PATH,
  requireActiveReservation,
  type MutationReservationInput,
} from "./reservations";
import {
  OWNERSHIP_MANIFEST,
  validateOwnership,
} from "./ownership";
import {
  validateSharedContractFreeze,
} from "./contract-freeze";
import { waveManifest } from "./wave-manifest";

export interface WaveExecutionPolicyInput {
  readonly repositoryRoot?: string;
  readonly packageManager?: string;
  readonly worktreeRequested?: boolean;
  readonly hiddenSpawningRequested?: boolean;
  readonly automaticRetryRequested?: boolean;
  readonly automaticReplanRequested?: boolean;
  readonly featureName?: string;
}

export interface WavePreflightInput {
  readonly wave: ConcurrentImplementationWaveRecord;
  readonly declarations?: readonly ImplementationAgentDeclaration[];
  readonly reservations?: readonly FileOwnershipReservation[];
  /**
   * A completed freeze may be supplied by the later Lane D freeze task. This
   * guard only validates it; it never creates or updates one.
   */
  readonly sharedContractFreeze?: SharedContractFreeze;
  readonly mutation?: MutationReservationInput;
  readonly execution?: WaveExecutionPolicyInput;
}

export interface Od04WavePolicyEvidence {
  readonly decisionId: typeof OD04_DECISION_ID;
  readonly approvalBoundaryRefs: readonly Identifier[];
  readonly owner: typeof OD04_OWNER;
  readonly decisionDate: typeof OD04_DECISION_DATE;
  readonly featureScope: typeof OD04_FEATURE_SCOPE;
  readonly explicitReadScopes: readonly ReadWriteScope[];
  readonly explicitWriteScopes: readonly ReadWriteScope[];
  readonly expectedSideEffects: readonly string[];
  readonly conflictPolicy: typeof OD04_CONFLICT_POLICY;
  readonly rollbackPath: string;
  readonly generalRepositoryRulePreserved: true;
}

export interface WavePreflightOutput {
  readonly allowed: boolean;
  readonly wave: ConcurrentImplementationWaveRecord;
  readonly policy: Od04WavePolicyEvidence;
  readonly conflicts: readonly WaveConflict[];
  readonly reservationChecks: readonly MutationReservationInput[];
  readonly sharedContractFreezeValidated: boolean;
  readonly preservedPriorState: true;
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, "");
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

function pathPatternsOverlap(left: string, right: string): boolean {
  return pathPatternMatches(left, right) || pathPatternMatches(right, left);
}

function addConflict(
  conflicts: WaveConflict[],
  kind: string,
  agentIds: readonly Identifier[],
  paths: readonly string[],
  reason: string,
): void {
  const suffix = [...agentIds, ...paths]
    .join("-")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
  const conflictId = `wave-preflight-${kind}-${suffix || "unspecified"}`;
  if (conflicts.some((item) => item.conflictId === conflictId)) {
    return;
  }
  conflicts.push({
    conflictId,
    agentIds,
    paths,
    reason,
    status: "blocking",
  });
}

function hasOd04Reference(refs: readonly Identifier[]): boolean {
  return refs.some((ref) => ref.toUpperCase().includes("OD-04"));
}

function declarationFor(
  declarations: readonly ImplementationAgentDeclaration[],
  agentId: Identifier,
): ImplementationAgentDeclaration | undefined {
  return declarations.find((declaration) => declaration.agentId === agentId);
}

function addOwnershipConflicts(
  conflicts: WaveConflict[],
  ownershipResult: ReturnType<typeof validateOwnership>,
): void {
  for (const item of ownershipResult.output?.conflicts ?? []) {
    if (!conflicts.some((existing) => existing.conflictId === item.conflictId)) {
      conflicts.push(item);
    }
  }
  for (const blocker of ownershipResult.blockers) {
    if (!conflicts.some((item) => item.reason === blocker)) {
      addConflict(conflicts, "ownership", [], [], blocker);
    }
  }
}

function validateWaveIdentity(
  input: WavePreflightInput,
  declarations: readonly ImplementationAgentDeclaration[],
  conflicts: WaveConflict[],
): void {
  const { wave } = input;
  if (wave.featureName !== FEATURE_NAME) {
    addConflict(conflicts, "feature", [], [], "the wave is not scoped to kiro-repo-guidance-setup");
  }
  if (wave.scope !== "feature_only") {
    addConflict(conflicts, "scope", [], [], "the wave must use feature_only scope");
  }
  if (wave.rootWorkingDirectory !== REPOSITORY_ROOT) {
    addConflict(conflicts, "repository-root", [], [], `the wave must run from ${REPOSITORY_ROOT}`);
  }
  if (wave.packageManager !== PACKAGE_MANAGER) {
    addConflict(conflicts, "package-manager", [], [], "repository commands must use root-only pnpm");
  }
  if (wave.worktrees !== "prohibited") {
    addConflict(conflicts, "worktree", [], [], "worktrees are prohibited for this wave");
  }
  if (wave.hiddenSpawning !== "prohibited") {
    addConflict(conflicts, "hidden-spawning", [], [], "hidden agent spawning is prohibited");
  }
  if (wave.automaticRetries !== "prohibited") {
    addConflict(conflicts, "retry", [], [], "automatic retries are prohibited");
  }
  if (wave.automaticReplans !== "prohibited") {
    addConflict(conflicts, "replan", [], [], "automatic replans are prohibited");
  }
  if (wave.maxActiveAgents < 0 || wave.maxActiveAgents > FEATURE_WAVE_MAX_ACTIVE_AGENTS) {
    addConflict(
      conflicts,
      "agent-limit",
      declarations.map((declaration) => declaration.agentId),
      [],
      "the feature wave may have no more than four active Implementation_Agents",
    );
  }
  if (wave.activeAgentCount < 0 || wave.activeAgentCount > FEATURE_WAVE_MAX_ACTIVE_AGENTS) {
    addConflict(
      conflicts,
      "active-agent-limit",
      declarations.map((declaration) => declaration.agentId),
      [],
      "active Implementation_Agents exceed the feature-wave maximum of four",
    );
  }
  if (wave.activeAgentCount > wave.maxActiveAgents) {
    addConflict(
      conflicts,
      "active-agent-cap",
      declarations.map((declaration) => declaration.agentId),
      [],
      "active Implementation_Agents exceed the wave's declared maximum",
    );
  }
  if (declarations.length > FEATURE_WAVE_MAX_ACTIVE_AGENTS) {
    addConflict(
      conflicts,
      "declaration-limit",
      declarations.map((declaration) => declaration.agentId),
      [],
      "the wave declares more than four Implementation_Agents",
    );
  }
  if (wave.declaredSharedOutputOwnership !== "none") {
    addConflict(conflicts, "shared-output", [], [], "lane-owned shared generated output is prohibited");
  }
  if (wave.conflictPolicy !== OD04_CONFLICT_POLICY) {
    addConflict(conflicts, "conflict-policy", [], [], "the wave must stop the affected agent or fail closed");
  }
  if (!hasOd04Reference(wave.approvalBoundaryRefs)) {
    addConflict(
      conflicts,
      "approval-boundary",
      declarations.map((declaration) => declaration.agentId),
      [],
      "the wave must record an OD-04 approval-boundary reference",
    );
  }
  if (wave.integrationValidationGateRef.trim().length === 0) {
    addConflict(conflicts, "integration-gate", [], [], "the wave must name its single post-wave integration gate");
  }
  if (wave.rollbackPath.trim().length === 0) {
    addConflict(conflicts, "rollback", [], [], "the wave must record a rollback path");
  }

  const execution = input.execution;
  if (execution) {
    if (execution.featureName !== undefined && execution.featureName !== FEATURE_NAME) {
      addConflict(conflicts, "execution-feature", [], [], "execution metadata is outside the feature scope");
    }
    if (execution.repositoryRoot !== undefined && execution.repositoryRoot !== REPOSITORY_ROOT) {
      addConflict(conflicts, "execution-root", [], [], "execution must use the repository root");
    }
    if (execution.packageManager !== undefined && execution.packageManager !== PACKAGE_MANAGER) {
      addConflict(conflicts, "execution-package-manager", [], [], "execution must use root-only pnpm");
    }
    if (execution.worktreeRequested === true) {
      addConflict(conflicts, "execution-worktree", [], [], "the execution request attempts to create a worktree");
    }
    if (execution.hiddenSpawningRequested === true) {
      addConflict(conflicts, "execution-hidden-spawning", [], [], "the execution request attempts hidden spawning");
    }
    if (execution.automaticRetryRequested === true) {
      addConflict(conflicts, "execution-retry", [], [], "the execution request attempts an automatic retry");
    }
    if (execution.automaticReplanRequested === true) {
      addConflict(conflicts, "execution-replan", [], [], "the execution request attempts an automatic replan");
    }
  }
}

function validateReservations(
  wave: ConcurrentImplementationWaveRecord,
  declarations: readonly ImplementationAgentDeclaration[],
  reservations: readonly FileOwnershipReservation[],
  conflicts: WaveConflict[],
): void {
  const seenIds = new Set<Identifier>();
  for (const reservation of reservations) {
    if (seenIds.has(reservation.reservationId)) {
      addConflict(
        conflicts,
        "duplicate-reservation",
        [reservation.agentId],
        [...reservation.targetPaths],
        `reservation ${reservation.reservationId} is listed more than once`,
      );
    }
    seenIds.add(reservation.reservationId);

    const declaration = declarationFor(declarations, reservation.agentId);
    if (!declaration) {
      addConflict(
        conflicts,
        "reservation-owner",
        [reservation.agentId],
        [...reservation.targetPaths],
        `reservation ${reservation.reservationId} has no declared Implementation_Agent owner`,
      );
      continue;
    }
    if (reservation.waveId !== wave.waveId) {
      addConflict(
        conflicts,
        "reservation-wave",
        [reservation.agentId],
        [...reservation.targetPaths],
        `reservation ${reservation.reservationId} belongs to a different wave`,
      );
    }
    if (reservation.status !== "active") {
      addConflict(
        conflicts,
        reservation.status === "stale" ? "stale-reservation" : "inactive-reservation",
        [reservation.agentId],
        [...reservation.targetPaths],
        `reservation ${reservation.reservationId} is ${reservation.status} and cannot authorize mutation`,
      );
    }
    if (!reservation.acquiredBeforeMutation) {
      addConflict(
        conflicts,
        "reservation-order",
        [reservation.agentId],
        [...reservation.targetPaths],
        `reservation ${reservation.reservationId} was not acquired before mutation`,
      );
    }
    if (reservation.conflictRefs.length > 0) {
      addConflict(
        conflicts,
        "reservation-conflict",
        [reservation.agentId],
        [...reservation.targetPaths],
        `reservation ${reservation.reservationId} has recorded conflicts`,
      );
    }

    const governed = reservation as Partial<GovernedFileOwnershipReservation>;
    if (
      governed.featureName !== FEATURE_NAME ||
      governed.repositoryRoot !== REPOSITORY_ROOT ||
      governed.decisionId !== OD04_DECISION_ID ||
      governed.featureScope !== OD04_FEATURE_SCOPE ||
      typeof governed.owner !== "string" ||
      governed.owner.trim().length === 0 ||
      typeof governed.decisionDate !== "string" ||
      !hasOd04Reference(governed.approvalBoundaryRefs ?? []) ||
      typeof governed.rollbackPath !== "string" ||
      governed.rollbackPath.trim().length === 0
    ) {
      addConflict(
        conflicts,
        "reservation-governance",
        [reservation.agentId],
        [...reservation.targetPaths],
        `reservation ${reservation.reservationId} is missing complete OD-04 governance metadata`,
      );
    }

    for (const path of reservation.targetPaths) {
      if (!declaration.writeScope.writePaths.some((declaredPath) => pathPatternMatches(declaredPath, path))) {
        addConflict(
          conflicts,
          "reservation-scope",
          [reservation.agentId],
          [path],
          `reservation target ${path} is outside ${reservation.agentId}'s declared write scope`,
        );
      }
    }
    if (reservation.sharedOutputs.length > 0 || declaration.sharedGeneratedOutputOwnership !== "none") {
      addConflict(
        conflicts,
        "shared-output",
        [reservation.agentId],
        [...reservation.sharedOutputs],
        "lane reservations cannot own shared generated output",
      );
    }
  }

  for (let leftIndex = 0; leftIndex < reservations.length; leftIndex += 1) {
    const left = reservations[leftIndex];
    if (left.status !== "active") {
      continue;
    }
    for (let rightIndex = leftIndex + 1; rightIndex < reservations.length; rightIndex += 1) {
      const right = reservations[rightIndex];
      if (right.status !== "active" || left.agentId === right.agentId) {
        continue;
      }
      const leftPaths = [...left.targetPaths, ...left.sharedOutputs];
      const rightPaths = [...right.targetPaths, ...right.sharedOutputs];
      const overlapping = leftPaths.filter((leftPath) =>
        rightPaths.some((rightPath) => pathPatternsOverlap(leftPath, rightPath)),
      );
      if (overlapping.length > 0) {
        addConflict(
          conflicts,
          "reservation-overlap",
          [left.agentId, right.agentId],
          overlapping,
          "active reservations overlap; the conflict is recorded and not resolved",
        );
      }
    }
  }
}

function validateFreeze(
  wave: ConcurrentImplementationWaveRecord,
  freeze: SharedContractFreeze | undefined,
  conflicts: WaveConflict[],
): boolean {
  if (!freeze) {
    addConflict(
      conflicts,
      "missing-contract-freeze",
      wave.implementationAgents.map((agent) => agent.agentId),
      [],
      "dependent mutation is blocked until a validated Shared_Contract_Freeze is supplied",
    );
    return false;
  }

  const validation = validateSharedContractFreeze({
    wave,
    freeze,
    repositoryRoot: REPOSITORY_ROOT,
  });

  for (const blocker of validation.blockers) {
    addConflict(
      conflicts,
      "freeze-validation",
      wave.implementationAgents.map((agent) => agent.agentId),
      [...freeze.contracts],
      blocker,
    );
  }

  return validation.status === "pass" && validation.output?.valid === true;
}

function validateMutation(
  input: WavePreflightInput,
  reservations: readonly FileOwnershipReservation[],
  conflicts: WaveConflict[],
): void {
  if (!input.mutation) {
    return;
  }

  const mutationReservationId = input.mutation.reservation?.reservationId;
  if (
    mutationReservationId !== undefined &&
    !reservations.some((reservation) => reservation.reservationId === mutationReservationId)
  ) {
    addConflict(
      conflicts,
      "unlisted-reservation",
      [input.mutation.agentId],
      [...input.mutation.targetPaths],
      "the mutation reservation is not present in the wave reservation manifest",
    );
  }

  const result = requireActiveReservation(input.mutation);
  for (const item of result.output?.conflicts ?? []) {
    if (!conflicts.some((existing) => existing.conflictId === item.conflictId)) {
      conflicts.push(item);
    }
  }
  for (const blocker of result.blockers) {
    if (!conflicts.some((item) => item.reason === blocker)) {
      addConflict(conflicts, "mutation", [input.mutation.agentId], [...input.mutation.targetPaths], blocker);
    }
  }
}

function policyEvidence(
  wave: ConcurrentImplementationWaveRecord,
  declarations: readonly ImplementationAgentDeclaration[],
): Od04WavePolicyEvidence {
  return {
    decisionId: OD04_DECISION_ID,
    approvalBoundaryRefs: [...wave.approvalBoundaryRefs],
    owner: OD04_OWNER,
    decisionDate: OD04_DECISION_DATE,
    featureScope: OD04_FEATURE_SCOPE,
    explicitReadScopes: declarations.map((declaration) => declaration.readScope),
    explicitWriteScopes: declarations.map((declaration) => declaration.writeScope),
    expectedSideEffects: [
      "mutations are limited to the declared feature-owned files",
      "conflicts stop the affected agent or fail the wave closed",
      "unrelated prior state is preserved or restored",
    ],
    conflictPolicy: OD04_CONFLICT_POLICY,
    rollbackPath: wave.rollbackPath || OD04_ROLLBACK_PATH,
    generalRepositoryRulePreserved: true,
  };
}

/**
 * Run all reservation and repository-policy checks before a requested write.
 * A preflight with no mutation request may inspect the wave, but only a
 * supplied, valid freeze can authorize dependent mutation.
 */
export function preflightWave(
  input: WavePreflightInput,
): StageResult<WavePreflightOutput> {
  const conflicts: WaveConflict[] = [];
  const declarations = input.declarations ?? input.wave.implementationAgents;
  const reservations = input.reservations ?? input.wave.fileOwnershipReservations;

  validateWaveIdentity(input, declarations, conflicts);
  const ownershipResult = validateOwnership({
    declarations,
    ownershipManifestVersion: OWNERSHIP_MANIFEST.ownershipManifestVersion,
  });
  addOwnershipConflicts(conflicts, ownershipResult);
  validateReservations(input.wave, declarations, reservations, conflicts);

  const freezeRequired = input.mutation !== undefined || input.wave.activeAgentCount > 0;
  const freezeValidated = freezeRequired
    ? validateFreeze(input.wave, input.sharedContractFreeze, conflicts)
    : input.sharedContractFreeze !== undefined
      ? validateFreeze(input.wave, input.sharedContractFreeze, conflicts)
      : false;
  validateMutation(input, reservations, conflicts);

  if (input.mutation) {
    const declaration = declarationFor(declarations, input.mutation.agentId);
    if (!declaration) {
      addConflict(
        conflicts,
        "mutation-agent",
        [input.mutation.agentId],
        [...input.mutation.targetPaths],
        "the mutation agent is not declared in the ownership manifest",
      );
    } else {
      for (const path of input.mutation.targetPaths) {
        if (!declaration.writeScope.writePaths.some((declaredPath) => pathPatternMatches(declaredPath, path))) {
          addConflict(
            conflicts,
            "mutation-scope",
            [input.mutation.agentId],
            [path],
            `mutation path ${path} is outside the agent's declared write scope`,
          );
        }
      }
    }
  }

  const output: WavePreflightOutput = {
    allowed: conflicts.length === 0,
    wave: input.wave,
    policy: policyEvidence(input.wave, declarations),
    conflicts,
    reservationChecks: input.mutation ? [input.mutation] : [],
    sharedContractFreezeValidated: freezeValidated && conflicts.length === 0,
    preservedPriorState: true,
  };

  if (conflicts.length > 0) {
    return {
      status: "blocked",
      output,
      blockers: conflicts.map((item) => item.reason),
      evidenceRefs: [OD04_APPROVAL_BOUNDARY_REF, ...conflicts.map((item) => item.conflictId)],
    };
  }

  return {
    status: "pass",
    output,
    blockers: [],
    evidenceRefs: [OD04_APPROVAL_BOUNDARY_REF, input.wave.waveId],
  };
}

export const preflight = preflightWave;
export const guardWave = preflightWave;
export const checkWaveBeforeMutation = preflightWave;

export class WaveGuard {
  preflight(input: WavePreflightInput): StageResult<WavePreflightOutput> {
    return preflightWave(input);
  }
}

/** RepositoryPolicyGuard is intentionally an alias for this Lane D preflight. */
export class RepositoryPolicyGuard extends WaveGuard {}

export const waveGuard = new WaveGuard();
export const repositoryPolicyGuard = new RepositoryPolicyGuard();

export default waveGuard;

// These exports make the no-worktree/root-only invariants discoverable to
// later validation stages without changing the repository policy itself.
export const WAVE_REPOSITORY_ROOT = waveManifest.rootExecution.workingDirectory;
export const WAVE_PACKAGE_MANAGER = waveManifest.rootExecution.packageManager;
export const WAVE_MAX_ACTIVE_AGENTS = waveManifest.concurrency.featureWaveMaximumActiveAgents;
