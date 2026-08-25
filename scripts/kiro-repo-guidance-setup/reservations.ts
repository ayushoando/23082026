/**
 * Lane D file-ownership reservations.
 *
 * Reservation operations are deliberately side-effect free. A caller must
 * persist the returned record, if appropriate, and must pass that active
 * record to `requireActiveReservation` immediately before each mutation.
 * Conflicts are recorded and returned as blocking results; this module never
 * releases, replaces, or resolves another agent's reservation.
 */

import {
  FEATURE_NAME,
  REPOSITORY_ROOT,
  type FileOwnershipReservation,
  type Identifier,
  type ImplementationAgentDeclaration,
  type IsoDate,
  type ReadWriteScope,
  type RepositoryPath,
  type RollbackPath,
  type StageResult,
  type WaveConflict,
  type WaveConflictPolicy,
} from "./contracts";
import { waveManifest } from "./wave-manifest";

export const OD04_APPROVAL_BOUNDARY_REF = "approval-boundary:OD-04" as const;
export const OD04_DECISION_ID = "OD-04" as const;
export const OD04_OWNER = "repository owner" as const;
export const OD04_DECISION_DATE = "2026-08-25" as const;
export const OD04_FEATURE_SCOPE = "kiro-repo-guidance-setup-only" as const;
export const OD04_CONFLICT_POLICY: WaveConflictPolicy =
  "stop_affected_agent_or_wave_fail_closed";
export const OD04_ROLLBACK_PATH =
  "release this reservation, disable the feature wave, and restore affected artifacts from pre-change snapshots" as const;

export const DEFAULT_RESERVATION_SIDE_EFFECTS = [
  "only the reserved feature-scoped paths may be mutated",
  "no shared generated output may be mutated by a lane",
  "no external service, global setting, secret, production filesystem, or application path may be changed",
] as const;

export interface ReservationGovernanceRecord {
  readonly decisionId: typeof OD04_DECISION_ID;
  readonly approvalBoundaryRefs: readonly Identifier[];
  readonly owner: string;
  readonly decisionDate: IsoDate;
  readonly featureScope: typeof OD04_FEATURE_SCOPE;
  readonly explicitReadScope: ReadWriteScope;
  readonly explicitWriteScope: ReadWriteScope;
  readonly expectedSideEffects: readonly string[];
  readonly conflictPolicy: WaveConflictPolicy;
  readonly rollbackPath: RollbackPath;
}

/** A FileOwnershipReservation with the governance data required by OD-04. */
export type GovernedFileOwnershipReservation = FileOwnershipReservation &
  ReservationGovernanceRecord & {
    readonly featureName: typeof FEATURE_NAME;
    readonly repositoryRoot: typeof REPOSITORY_ROOT;
    readonly acquiredAtUtc: IsoDate;
  };

export interface ReservationAcquisitionInput {
  readonly waveId: Identifier;
  readonly agent: ImplementationAgentDeclaration;
  readonly targetPaths: readonly RepositoryPath[];
  readonly sharedOutputs?: readonly RepositoryPath[];
  readonly existingReservations?: readonly FileOwnershipReservation[];
  readonly acquiredAtUtc: IsoDate;
  readonly approvalBoundaryRefs: readonly Identifier[];
  readonly owner?: string;
  readonly decisionDate?: IsoDate;
  readonly featureScope?: typeof OD04_FEATURE_SCOPE;
  readonly expectedSideEffects?: readonly string[];
  readonly conflictPolicy?: WaveConflictPolicy;
  readonly rollbackPath?: RollbackPath;
}

export interface ReservationAcquisitionOutput {
  readonly reservation: GovernedFileOwnershipReservation | null;
  readonly conflicts: readonly WaveConflict[];
  readonly governance: ReservationGovernanceRecord;
}

export interface MutationReservationInput {
  readonly waveId: Identifier;
  readonly agentId: Identifier;
  readonly targetPaths: readonly RepositoryPath[];
  readonly sharedOutputs?: readonly RepositoryPath[];
  readonly reservation?: FileOwnershipReservation | null;
}

export interface ReservationMutationCheck {
  readonly allowed: boolean;
  readonly reservation: FileOwnershipReservation | null;
  readonly conflicts: readonly WaveConflict[];
  readonly preservedPriorState: true;
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, "");
}

function isRepositoryRelativePath(path: string): boolean {
  const normalized = normalizePath(path);
  return (
    normalized.length > 0 &&
    !normalized.startsWith("/") &&
    !/^[A-Za-z]:\//.test(normalized) &&
    normalized !== ".." &&
    !normalized.startsWith("../")
  );
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
  return (
    pathPatternMatches(left, right) ||
    pathPatternMatches(right, left) ||
    (normalizePath(left).endsWith("/**") && normalizePath(right).endsWith("/**") &&
      (normalizePath(left).startsWith(normalizePath(right).slice(0, -2)) ||
        normalizePath(right).startsWith(normalizePath(left).slice(0, -2))))
  );
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function conflict(
  kind: string,
  agentIds: readonly Identifier[],
  paths: readonly RepositoryPath[],
  reason: string,
): WaveConflict {
  const suffix = [...agentIds, ...paths]
    .join("-")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);

  return {
    conflictId: `reservation-conflict-${kind}-${suffix || "unspecified"}`,
    agentIds,
    paths,
    reason,
    status: "blocking",
  };
}

function addConflict(
  conflicts: WaveConflict[],
  candidate: WaveConflict,
): void {
  if (!conflicts.some((item) => item.conflictId === candidate.conflictId)) {
    conflicts.push(candidate);
  }
}

function hasOd04Reference(refs: readonly Identifier[]): boolean {
  return refs.some((ref) => ref.toUpperCase().includes("OD-04"));
}

function validIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(value);
}

function reservationGovernance(
  input: ReservationAcquisitionInput,
): ReservationGovernanceRecord {
  return {
    decisionId: OD04_DECISION_ID,
    approvalBoundaryRefs: unique(input.approvalBoundaryRefs),
    owner: input.owner ?? OD04_OWNER,
    decisionDate: input.decisionDate ?? OD04_DECISION_DATE,
    featureScope: input.featureScope ?? OD04_FEATURE_SCOPE,
    explicitReadScope: input.agent.readScope,
    explicitWriteScope: input.agent.writeScope,
    expectedSideEffects: unique(
      input.expectedSideEffects ?? [...DEFAULT_RESERVATION_SIDE_EFFECTS],
    ),
    conflictPolicy: input.conflictPolicy ?? OD04_CONFLICT_POLICY,
    rollbackPath: input.rollbackPath ?? OD04_ROLLBACK_PATH,
  };
}

function validateGovernance(
  governance: ReservationGovernanceRecord,
  agentId: Identifier,
  paths: readonly RepositoryPath[],
  conflicts: WaveConflict[],
): void {
  if (!hasOd04Reference(governance.approvalBoundaryRefs)) {
    addConflict(
      conflicts,
      conflict(
        "approval-boundary",
        [agentId],
        paths,
        "an OD-04 approval-boundary reference is required before mutation",
      ),
    );
  }
  if (governance.owner.trim().length === 0 || !validIsoDate(governance.decisionDate)) {
    addConflict(
      conflicts,
      conflict(
        "owner-date",
        [agentId],
        paths,
        "OD-04 reservation governance requires a non-empty owner and ISO decision date",
      ),
    );
  }
  if (governance.featureScope !== OD04_FEATURE_SCOPE) {
    addConflict(
      conflicts,
      conflict(
        "feature-scope",
        [agentId],
        paths,
        "the reservation is outside the feature-only OD-04 scope",
      ),
    );
  }
  if (governance.explicitReadScope.agentId !== agentId || governance.explicitWriteScope.agentId !== agentId) {
    addConflict(
      conflicts,
      conflict(
        "scope-owner",
        [agentId],
        paths,
        "reservation read/write scopes must belong to the reserving agent",
      ),
    );
  }
  if (governance.expectedSideEffects.length === 0) {
    addConflict(
      conflicts,
      conflict(
        "side-effects",
        [agentId],
        paths,
        "reservation governance must record expected side effects",
      ),
    );
  }
  if (governance.conflictPolicy !== OD04_CONFLICT_POLICY) {
    addConflict(
      conflicts,
      conflict(
        "conflict-policy",
        [agentId],
        paths,
        "reservation conflicts must stop the affected agent or fail the wave closed",
      ),
    );
  }
  if (governance.rollbackPath.trim().length === 0) {
    addConflict(
      conflicts,
      conflict(
        "rollback",
        [agentId],
        paths,
        "reservation governance must record a rollback path",
      ),
    );
  }
}

function validatePathList(
  paths: readonly RepositoryPath[],
  kind: string,
  agentId: Identifier,
  conflicts: WaveConflict[],
): void {
  for (const path of paths) {
    if (!isRepositoryRelativePath(path)) {
      addConflict(
        conflicts,
        conflict(
          kind,
          [agentId],
          [path],
          "reservation paths must be repository-relative and cannot escape the repository root",
        ),
      );
    }
  }

  const seen = new Set<string>();
  for (const path of paths) {
    const normalized = normalizePath(path);
    if (seen.has(normalized)) {
      addConflict(
        conflicts,
        conflict(
          "duplicate-path",
          [agentId],
          [path],
          "a reservation cannot list the same target path more than once",
        ),
      );
    }
    seen.add(normalized);
  }
}

function pathIsOwned(
  path: RepositoryPath,
  declaredPaths: readonly RepositoryPath[],
): boolean {
  return declaredPaths.some((declaredPath) => pathPatternMatches(declaredPath, path));
}

function reservationTouches(
  reservation: FileOwnershipReservation,
  paths: readonly RepositoryPath[],
): boolean {
  return [...reservation.targetPaths, ...reservation.sharedOutputs].some((heldPath) =>
    paths.some((requestedPath) => pathPatternsOverlap(heldPath, requestedPath)),
  );
}

function reservationId(input: ReservationAcquisitionInput): Identifier {
  const suffix = [...input.targetPaths]
    .map(normalizePath)
    .join("|")
    .replace(/[^A-Za-z0-9|]+/g, "-")
    .replace(/\|/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
  return `reservation-${input.waveId}-${input.agent.agentId}-${suffix || "no-target"}`;
}

/**
 * Acquire a new reservation record without mutating a store. The caller must
 * persist the result only after this stage returns `pass`.
 */
export function acquireFileOwnershipReservation(
  input: ReservationAcquisitionInput,
): StageResult<ReservationAcquisitionOutput> {
  const conflicts: WaveConflict[] = [];
  const governance = reservationGovernance(input);
  const sharedOutputs = input.sharedOutputs ?? [];
  const existingReservations = input.existingReservations ?? [];
  const targetPaths = unique(input.targetPaths.map(normalizePath));
  const normalizedSharedOutputs = unique(sharedOutputs.map(normalizePath));

  if (input.waveId.trim().length === 0) {
    addConflict(conflicts, conflict("wave", [input.agent.agentId], [], "a wave ID is required"));
  }
  if (input.agent.agentId.trim().length === 0) {
    addConflict(conflicts, conflict("agent", [], targetPaths, "an agent ID is required"));
  }
  if (targetPaths.length === 0) {
    addConflict(
      conflicts,
      conflict("missing", [input.agent.agentId], [], "at least one target path is required for a mutation reservation"),
    );
  }

  validatePathList(targetPaths, "path", input.agent.agentId, conflicts);
  validatePathList(normalizedSharedOutputs, "shared-output", input.agent.agentId, conflicts);
  validateGovernance(governance, input.agent.agentId, targetPaths, conflicts);

  if (governance.explicitWriteScope.writePaths.length === 0) {
    addConflict(
      conflicts,
      conflict("write-scope", [input.agent.agentId], targetPaths, "the agent has no explicit write scope"),
    );
  }

  for (const path of targetPaths) {
    if (!pathIsOwned(path, governance.explicitWriteScope.writePaths)) {
      addConflict(
        conflicts,
        conflict(
          "out-of-scope",
          [input.agent.agentId],
          [path],
          `target path ${path} is outside the agent's declared write scope`,
        ),
      );
    }
  }

  if (normalizedSharedOutputs.length > 0) {
    addConflict(
      conflicts,
      conflict(
        "shared-output",
        [input.agent.agentId],
        normalizedSharedOutputs,
        "Lane-owned reservations cannot mutate shared generated output",
      ),
    );
  }

  const requestedPaths = [...targetPaths, ...normalizedSharedOutputs];
  for (const existing of existingReservations) {
    if (!reservationTouches(existing, requestedPaths)) {
      continue;
    }

    if (existing.status === "active") {
      addConflict(
        conflicts,
        conflict(
          existing.agentId === input.agent.agentId ? "duplicate" : "conflicting",
          [existing.agentId, input.agent.agentId],
          requestedPaths,
          `an active reservation already holds one or more requested paths (${existing.reservationId})`,
        ),
      );
    } else if (existing.status === "stale" || existing.status === "conflicting" || existing.status === "missing") {
      addConflict(
        conflicts,
        conflict(
          "stale",
          [existing.agentId, input.agent.agentId],
          requestedPaths,
          `a stale, conflicting, or missing reservation still covers one or more requested paths (${existing.reservationId})`,
        ),
      );
    }
  }

  const outputReservation: GovernedFileOwnershipReservation = {
    reservationId: reservationId({ ...input, targetPaths }),
    waveId: input.waveId,
    agentId: input.agent.agentId,
    targetPaths,
    sharedOutputs: normalizedSharedOutputs,
    readScope: [...governance.explicitReadScope.readPaths],
    writeScope: [...governance.explicitWriteScope.writePaths],
    acquiredBeforeMutation: true,
    status: "active",
    conflictRefs: conflicts.map((item) => item.conflictId),
    featureName: FEATURE_NAME,
    repositoryRoot: REPOSITORY_ROOT,
    acquiredAtUtc: input.acquiredAtUtc,
    ...governance,
  };

  const output: ReservationAcquisitionOutput = {
    reservation: conflicts.length === 0 ? outputReservation : null,
    conflicts,
    governance,
  };

  if (conflicts.length > 0) {
    return {
      status: "blocked",
      output,
      blockers: conflicts.map((item) => item.reason),
      evidenceRefs: conflicts.map((item) => item.conflictId),
    };
  }

  return {
    status: "pass",
    output,
    blockers: [],
    evidenceRefs: [outputReservation.reservationId, OD04_APPROVAL_BOUNDARY_REF],
  };
}

/**
 * Validate the reservation immediately before a write. A missing, stale,
 * conflicting, duplicate, or out-of-scope reservation is never repaired here.
 */
export function requireActiveReservation(
  input: MutationReservationInput,
): StageResult<ReservationMutationCheck> {
  const conflicts: WaveConflict[] = [];
  const requestedPaths = input.targetPaths.map(normalizePath);
  const requestedSharedOutputs = (input.sharedOutputs ?? []).map(normalizePath);
  const reservation = input.reservation ?? null;

  validatePathList(requestedPaths, "mutation-path", input.agentId, conflicts);
  validatePathList(requestedSharedOutputs, "mutation-shared-output", input.agentId, conflicts);

  if (!reservation) {
    addConflict(
      conflicts,
      conflict(
        "missing",
        [input.agentId],
        [...requestedPaths, ...requestedSharedOutputs],
        "every mutation requires an active File_Ownership_Reservation",
      ),
    );
  } else {
    if (reservation.status !== "active") {
      addConflict(
        conflicts,
        conflict(
          reservation.status === "stale" ? "stale" : reservation.status,
          [reservation.agentId, input.agentId],
          [...requestedPaths, ...requestedSharedOutputs],
          `reservation ${reservation.reservationId} is ${reservation.status}, not active`,
        ),
      );
    }
    if (reservation.waveId !== input.waveId || reservation.agentId !== input.agentId) {
      addConflict(
        conflicts,
        conflict(
          "owner",
          [reservation.agentId, input.agentId],
          [...requestedPaths, ...requestedSharedOutputs],
          "reservation wave and agent must match the requested mutation",
        ),
      );
    }
    if (!reservation.acquiredBeforeMutation) {
      addConflict(
        conflicts,
        conflict(
          "ordering",
          [input.agentId],
          [...requestedPaths, ...requestedSharedOutputs],
          "the reservation was not acquired before mutation",
        ),
      );
    }
    if (reservation.conflictRefs.length > 0) {
      addConflict(
        conflicts,
        conflict(
          "conflicting",
          [reservation.agentId, input.agentId],
          [...requestedPaths, ...requestedSharedOutputs],
          "the reservation contains recorded conflicts and cannot authorize mutation",
        ),
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
      !validIsoDate(governed.decisionDate) ||
      !Array.isArray(governed.approvalBoundaryRefs) ||
      !hasOd04Reference(governed.approvalBoundaryRefs) ||
      typeof governed.rollbackPath !== "string" ||
      governed.rollbackPath.trim().length === 0
    ) {
      addConflict(
        conflicts,
        conflict(
          "governance",
          [input.agentId],
          [...requestedPaths, ...requestedSharedOutputs],
          "the reservation is missing complete OD-04 governance metadata",
        ),
      );
    }

    for (const path of requestedPaths) {
      if (!pathIsOwned(path, reservation.targetPaths) || !pathIsOwned(path, reservation.writeScope)) {
        addConflict(
          conflicts,
          conflict(
            "out-of-scope",
            [input.agentId],
            [path],
            `mutation path ${path} is not covered by the active reservation and its write scope`,
          ),
        );
      }
    }
    for (const path of requestedSharedOutputs) {
      if (!pathIsOwned(path, reservation.sharedOutputs)) {
        addConflict(
          conflicts,
          conflict(
            "shared-output",
            [input.agentId],
            [path],
            `shared output ${path} is not covered by the active reservation`,
          ),
        );
      }
    }
  }

  const output: ReservationMutationCheck = {
    allowed: conflicts.length === 0,
    reservation,
    conflicts,
    preservedPriorState: true,
  };

  if (conflicts.length > 0) {
    return {
      status: "blocked",
      output,
      blockers: conflicts.map((item) => item.reason),
      evidenceRefs: conflicts.map((item) => item.conflictId),
    };
  }

  return {
    status: "pass",
    output,
    blockers: [],
    evidenceRefs: [reservation?.reservationId ?? "reservation-missing"],
  };
}

export const acquireReservation = acquireFileOwnershipReservation;
export const validateMutationReservation = requireActiveReservation;
export const reserveMutation = requireActiveReservation;

export class ReservationCoordinator {
  acquire(input: ReservationAcquisitionInput): StageResult<ReservationAcquisitionOutput> {
    return acquireFileOwnershipReservation(input);
  }

  requireActive(input: MutationReservationInput): StageResult<ReservationMutationCheck> {
    return requireActiveReservation(input);
  }
}

export const reservationCoordinator = new ReservationCoordinator();

export default reservationCoordinator;

// Keep the repository-root invariant visible in this module's public evidence.
export const RESERVATION_REPOSITORY_ROOT = REPOSITORY_ROOT;
export const RESERVATION_PACKAGE_MANAGER = waveManifest.rootExecution.packageManager;
