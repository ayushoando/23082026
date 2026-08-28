/**
 * Integration-owned post-wave validation gate.
 *
 * This module is deliberately side-effect free. It consumes the frozen Lane D
 * records, validates the complete wave evidence set, and emits one immutable
 * gate projection. It does not repair conflicts, mutate files, run commands,
 * spawn agents, retry, replan, or grant final enablement.
 */

import {
  FEATURE_NAME,
  FEATURE_WAVE_MAX_ACTIVE_AGENTS,
  REPOSITORY_ROOT,
  type AgentOutput,
  type ConcurrentImplementationWaveRecord,
  type FileOwnershipReservation,
  type Identifier,
  type ImplementationAgentDeclaration,
  type IntegrationValidationGate,
  type IntegrationValidationGateRecord,
  type IntegrationValidationRequest,
  type RepositoryPath,
  type SharedContractFreeze,
  type StageResult,
  type ValidationRun,
  type WaveConflict,
} from "./contracts";
import {
  INTEGRATION_OWNER_OWNERSHIP,
  INTEGRATION_SHARED_OUTPUT_PATHS,
  validateOwnership,
} from "./ownership";
import {
  requireActiveReservation,
} from "./reservations";
import { preflightWave, type WavePreflightOutput } from "./wave-guard";

const REVIEWER_STAGES = [
  "EvidenceCompatibilityReviewer",
  "SafetyRollbackReviewer",
] as const;

const DEFAULT_ROLLBACK_PATH =
  "preserve or restore pre-wave state and release all reservations" as const;

export interface ChangedFileManifestEntry {
  readonly path: RepositoryPath;
  readonly agentId: Identifier;
  readonly reservationId: Identifier;
  readonly evidenceRefs: readonly Identifier[];
}

export interface ChangedFileManifest {
  readonly entries: readonly ChangedFileManifestEntry[];
  readonly paths: readonly RepositoryPath[];
  readonly complete: boolean;
}

export interface ChangedFileManifestInput {
  readonly outputs: readonly AgentOutput[];
  readonly reservations: readonly FileOwnershipReservation[];
  readonly declarations?: readonly ImplementationAgentDeclaration[];
  readonly waveId?: Identifier;
}

export interface IntegrationGateCollection {
  readonly wave: ConcurrentImplementationWaveRecord;
  readonly outputs: readonly AgentOutput[];
  readonly reservations: readonly FileOwnershipReservation[];
  readonly changedFileManifest: ChangedFileManifest;
  readonly contractFreeze: SharedContractFreeze | null;
  readonly validationRuns: readonly ValidationRun[];
  readonly conflicts: readonly WaveConflict[];
  readonly preflight?: WavePreflightOutput;
  readonly blockers: readonly string[];
  readonly evidenceRefs: readonly Identifier[];
}

export interface IntegrationGateOutput {
  readonly gate: IntegrationValidationGateRecord;
  readonly collection: IntegrationGateCollection;
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

  if (normalizedPattern === normalizedCandidate) return true;
  if (normalizedPattern.endsWith("/**")) {
    const base = normalizedPattern.slice(0, -3).replace(/\/$/, "");
    return normalizedCandidate.startsWith(`${base}/`);
  }
  return false;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function sortedUniquePaths(paths: readonly RepositoryPath[]): RepositoryPath[] {
  return [...new Set(paths.map(normalizePath))].sort();
}

function makeConflict(
  conflictId: Identifier,
  agentIds: readonly Identifier[],
  paths: readonly RepositoryPath[],
  reason: string,
): WaveConflict {
  return {
    conflictId,
    agentIds: unique(agentIds),
    paths: sortedUniquePaths(paths),
    reason,
    status: "blocking",
  };
}

function outputStatusBlockers(outputs: readonly AgentOutput[]): string[] {
  const blockers: string[] = [];
  for (const output of outputs) {
    if (output.status !== "completed") {
      blockers.push(`agent ${output.agentId} returned ${output.status} output`);
    }
    if (output.blocker !== "none" && output.blocker.trim().length > 0) {
      blockers.push(`agent ${output.agentId} reported blocker: ${output.blocker}`);
    }
    if (output.status === "completed" && output.evidenceRefs.length === 0) {
      blockers.push(`agent ${output.agentId} completed without evidence references`);
    }
  }
  return blockers;
}

function validateOutputs(
  wave: ConcurrentImplementationWaveRecord,
  outputs: readonly AgentOutput[],
  declarations: readonly ImplementationAgentDeclaration[],
): { readonly blockers: readonly string[]; readonly conflicts: readonly WaveConflict[] } {
  const blockers: string[] = [];
  const conflicts: WaveConflict[] = [];
  const declarationByAgent = new Map(
    declarations.map((declaration) => [declaration.agentId, declaration]),
  );
  const seenAgents = new Set<Identifier>();
  const activeCount = wave.activeAgentCount as number;

  if (outputs.length !== activeCount) {
    blockers.push(
      `integration gate expected exactly ${activeCount} agent outputs but collected ${outputs.length}`,
    );
  }

  for (const output of outputs) {
    if (seenAgents.has(output.agentId)) {
      conflicts.push(
        makeConflict(
          `integration-output-duplicate-${output.agentId}`,
          [output.agentId],
          output.changedPaths,
          `agent ${output.agentId} produced more than one wave output`,
        ),
      );
    }
    seenAgents.add(output.agentId);

    const declaration = declarationByAgent.get(output.agentId);
    if (!declaration) {
      conflicts.push(
        makeConflict(
          `integration-output-owner-${output.agentId}`,
          [output.agentId],
          output.changedPaths,
          `agent ${output.agentId} is not declared in the frozen ownership manifest`,
        ),
      );
      continue;
    }

    for (const path of output.changedPaths) {
      if (!isRepositoryRelativePath(path)) {
        conflicts.push(
          makeConflict(
            `integration-output-path-${output.agentId}-${normalizePath(path)}`,
            [output.agentId],
            [path],
            `agent ${output.agentId} reported a changed path outside the repository root`,
          ),
        );
        continue;
      }

      if (
        INTEGRATION_OWNER_OWNERSHIP.writeScope.writePaths.some((declaredPath) =>
          pathPatternMatches(declaredPath, path),
        )
      ) {
        conflicts.push(
          makeConflict(
            `integration-output-boundary-${output.agentId}-${normalizePath(path)}`,
            [output.agentId],
            [path],
            `agent ${output.agentId} reported a change inside an integration-owned path`,
          ),
        );
      }

      if (
        INTEGRATION_SHARED_OUTPUT_PATHS.some((sharedPath) =>
          pathPatternMatches(sharedPath, path),
        )
      ) {
        conflicts.push(
          makeConflict(
            `integration-output-shared-${output.agentId}-${normalizePath(path)}`,
            [output.agentId],
            [path],
            `agent ${output.agentId} reported a change to shared generated output`,
          ),
        );
      }

      if (
        !declaration.writeScope.writePaths.some((declaredPath) =>
          pathPatternMatches(declaredPath, path),
        )
      ) {
        conflicts.push(
          makeConflict(
            `integration-output-scope-${output.agentId}-${normalizePath(path)}`,
            [output.agentId],
            [path],
            `changed path ${path} is outside ${output.agentId}'s declared write scope`,
          ),
        );
      }
    }
  }

  blockers.push(...outputStatusBlockers(outputs));
  return { blockers, conflicts };
}

function validateConflicts(conflicts: readonly WaveConflict[]): string[] {
  return conflicts
    .filter((conflict) => conflict.status !== "resolved")
    .map((conflict) =>
      `integration conflict ${conflict.conflictId} is ${conflict.status} and remains unresolved: ${conflict.reason}`,
    );
}

function validateValidationRuns(
  wave: ConcurrentImplementationWaveRecord,
  validationRuns: readonly ValidationRun[],
): string[] {
  const blockers: string[] = [];
  const seenIds = new Set<Identifier>();

  if (validationRuns.length === 0) {
    blockers.push("the integration gate requires at least one repository Validation_Run");
  }

  for (const run of validationRuns) {
    if (seenIds.has(run.validationId)) {
      blockers.push(`Validation_Run ${run.validationId} is duplicated`);
    }
    seenIds.add(run.validationId);

    if (run.result !== "pass") {
      blockers.push(`Validation_Run ${run.validationId} has result ${run.result}`);
    }
    if (run.blocker !== "none" && run.blocker.trim().length > 0) {
      blockers.push(`Validation_Run ${run.validationId} has blocker: ${run.blocker}`);
    }
    if (run.unverifiedItems.length > 0) {
      blockers.push(
        `Validation_Run ${run.validationId} contains Unverified items and cannot authorize dependent work`,
      );
    }
    if (run.repositoryRootOrActiveSurface !== REPOSITORY_ROOT) {
      blockers.push(
        `Validation_Run ${run.validationId} did not run from repository root ${REPOSITORY_ROOT}`,
      );
    }
  }

  const declaredRefs = new Set(wave.validationRunRefs);
  for (const ref of declaredRefs) {
    if (!seenIds.has(ref)) {
      blockers.push(`wave validation reference ${ref} was not collected by the integration gate`);
    }
  }

  return blockers;
}

function reservationForPath(
  reservations: readonly FileOwnershipReservation[],
  agentId: Identifier,
  path: RepositoryPath,
): FileOwnershipReservation | undefined {
  return reservations.find(
    (reservation) =>
      reservation.agentId === agentId &&
      reservation.targetPaths.some((targetPath) => pathPatternMatches(targetPath, path)),
  );
}

export function buildChangedFileManifest(
  input: ChangedFileManifestInput,
): StageResult<ChangedFileManifest> {
  const declarations = input.declarations ?? [];
  const blockers: string[] = [];
  const entries: ChangedFileManifestEntry[] = [];
  const seenPaths = new Map<RepositoryPath, Identifier>();

  for (const output of input.outputs) {
    for (const rawPath of output.changedPaths) {
      const path = normalizePath(rawPath);
      const priorAgent = seenPaths.get(path);
      if (priorAgent !== undefined) {
        blockers.push(`changed path ${path} was reported by both ${priorAgent} and ${output.agentId}`);
      }
      seenPaths.set(path, output.agentId);

      const reservation = reservationForPath(input.reservations, output.agentId, path);
      const reservationCheck = requireActiveReservation({
        waveId: input.waveId ?? "integration-wave-unknown",
        agentId: output.agentId,
        targetPaths: [path],
        reservation,
      });
      if (reservationCheck.status !== "pass") {
        blockers.push(...reservationCheck.blockers);
      }

      const declaration = declarations.find((item) => item.agentId === output.agentId);
      if (
        declaration !== undefined &&
        !declaration.writeScope.writePaths.some((declaredPath) =>
          pathPatternMatches(declaredPath, path),
        )
      ) {
        blockers.push(`changed path ${path} is outside ${output.agentId}'s declared write scope`);
      }

      entries.push({
        path,
        agentId: output.agentId,
        reservationId: reservation?.reservationId ?? "reservation-missing",
        evidenceRefs: [...output.evidenceRefs],
      });
    }
  }

  const manifest: ChangedFileManifest = {
    entries,
    paths: sortedUniquePaths(entries.map((entry) => entry.path)),
    complete: blockers.length === 0,
  };

  if (blockers.length > 0) {
    return {
      status: "blocked",
      output: manifest,
      blockers: unique(blockers),
      evidenceRefs: entries.flatMap((entry) => entry.evidenceRefs),
    };
  }

  return {
    status: "pass",
    output: manifest,
    blockers: [],
    evidenceRefs: entries.flatMap((entry) => [entry.reservationId, ...entry.evidenceRefs]),
  };
}

function gateStatus(
  blockers: readonly string[],
  outputs: readonly AgentOutput[],
  validationRuns: readonly ValidationRun[],
): IntegrationValidationGateRecord["status"] {
  if (outputs.some((output) => output.status === "partial" || output.status === "abandoned")) {
    return "partial";
  }
  if (validationRuns.some((run) => run.result === "fail")) return "fail";
  if (blockers.length > 0) return "blocked";
  return "pass";
}

function gateEvidenceRefs(input: IntegrationValidationRequest, extra: readonly string[]): string[] {
  return unique([
    input.wave.waveId,
    input.wave.integrationValidationGateRef,
    input.contractFreeze?.freezeId ?? "shared-contract-freeze-missing",
    input.contractFreeze?.validationRunRef ?? "shared-contract-freeze-validation-missing",
    ...input.outputs.flatMap((output) => output.evidenceRefs),
    ...input.reservations.map((reservation) => reservation.reservationId),
    ...input.validationRuns.flatMap((run) => [run.validationId, ...run.evidenceRefs]),
    ...input.conflicts.map((conflict) => conflict.conflictId),
    ...extra,
  ]);
}

function createGateRecord(
  input: IntegrationValidationRequest,
  blockers: readonly string[],
  handoffRefs: readonly Identifier[] = [],
  conflicts: readonly WaveConflict[] = input.conflicts,
): IntegrationValidationGateRecord {
  return {
    gateId:
      input.wave.integrationValidationGateRef.trim() || "integration-gate-invalid-reference",
    waveId: input.wave.waveId,
    collectedAgentOutputs: [...input.outputs],
    conflictResolutions: [...conflicts],
    repositoryValidationRuns: input.validationRuns.map((run) => run.validationId),
    reviewerStages: REVIEWER_STAGES,
    sequentialReviewerHandoffRefs: [...handoffRefs],
    status: gateStatus(blockers, input.outputs, input.validationRuns),
    enablementAllowed: false,
    rollbackPath: input.wave.rollbackPath.trim() || DEFAULT_ROLLBACK_PATH,
  };
}

export function collectIntegrationGateEvidence(
  input: IntegrationValidationRequest,
): StageResult<IntegrationGateCollection> {
  const blockers: string[] = [];
  const derivedConflicts: WaveConflict[] = [];
  let preflight: WavePreflightOutput | undefined;

  try {
    const preflightResult = preflightWave({
      wave: input.wave,
      declarations: input.wave.implementationAgents,
      reservations: input.reservations,
      sharedContractFreeze: input.contractFreeze,
    });
    preflight = preflightResult.output;
    if (preflightResult.status !== "pass") blockers.push(...preflightResult.blockers);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "unknown preflight failure";
    blockers.push(`integration preflight failed closed: ${detail}`);
  }

  const ownershipResult = validateOwnership({ declarations: input.wave.implementationAgents });
  if (ownershipResult.status !== "pass") blockers.push(...ownershipResult.blockers);

  const outputValidation = validateOutputs(
    input.wave,
    input.outputs,
    input.wave.implementationAgents,
  );
  blockers.push(...outputValidation.blockers);
  derivedConflicts.push(...outputValidation.conflicts);

  const manifestResult = buildChangedFileManifest({
    outputs: input.outputs,
    reservations: input.reservations,
    declarations: input.wave.implementationAgents,
    waveId: input.wave.waveId,
  });
  if (manifestResult.status !== "pass") blockers.push(...manifestResult.blockers);

  blockers.push(...validateConflicts(input.conflicts));
  blockers.push(...validateConflicts(derivedConflicts));
  blockers.push(...validateValidationRuns(input.wave, input.validationRuns));

  if (input.wave.status !== "completed") {
    blockers.push(`implementation wave status is ${input.wave.status}; dependent work remains blocked`);
  }
  if (input.wave.integrationValidationGateRef.trim().length === 0) {
    blockers.push("the wave must name exactly one Integration_Validation_Gate reference");
  }
  if (input.wave.activeAgentCount > FEATURE_WAVE_MAX_ACTIVE_AGENTS) {
    blockers.push("the integration wave may have no more than four active agents");
  }
  if (input.wave.featureName !== FEATURE_NAME) {
    blockers.push("the integration wave is outside the feature scope");
  }

  const changedFileManifest = manifestResult.output ?? {
    entries: [],
    paths: [],
    complete: false,
  };
  const allConflicts = [...input.conflicts, ...derivedConflicts];
  const evidenceRefs = gateEvidenceRefs(
    { ...input, conflicts: allConflicts },
    preflight ? preflight.conflicts.map((conflict) => conflict.conflictId) : [],
  );
  const collection: IntegrationGateCollection = {
    wave: input.wave,
    outputs: [...input.outputs],
    reservations: [...input.reservations],
    changedFileManifest,
    contractFreeze: input.contractFreeze ?? null,
    validationRuns: [...input.validationRuns],
    conflicts: allConflicts,
    preflight,
    blockers: unique(blockers),
    evidenceRefs,
  };

  if (collection.blockers.length > 0) {
    return {
      status: "blocked",
      output: collection,
      blockers: collection.blockers,
      evidenceRefs,
    };
  }

  return {
    status: "pass",
    output: collection,
    blockers: [],
    evidenceRefs,
  };
}

export class IntegrationValidationGateService implements IntegrationValidationGate {
  public run(input: IntegrationValidationRequest): StageResult<IntegrationValidationGateRecord> {
    const collectionResult = collectIntegrationGateEvidence(input);
    const collection = collectionResult.output;
    const record = createGateRecord(
      input,
      collectionResult.status === "pass" ? [] : collection?.blockers ?? collectionResult.blockers,
      [],
      collection?.conflicts ?? input.conflicts,
    );

    if (collectionResult.status !== "pass") {
      return {
        status: record.status === "partial" ? "partial" : record.status === "fail" ? "fail" : "blocked",
        output: record,
        blockers: collectionResult.blockers,
        evidenceRefs: collectionResult.evidenceRefs,
      };
    }

    return {
      status: "pass",
      output: record,
      blockers: [],
      evidenceRefs: collectionResult.evidenceRefs,
    };
  }
}

export const integrationValidationGate = new IntegrationValidationGateService();
export const runIntegrationValidationGate = (
  input: IntegrationValidationRequest,
): StageResult<IntegrationValidationGateRecord> => integrationValidationGate.run(input);
export const createIntegrationValidationGate = (): IntegrationValidationGateService =>
  new IntegrationValidationGateService();

export default integrationValidationGate;
