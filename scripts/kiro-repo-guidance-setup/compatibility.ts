import {
  REQUIRED_SURFACE_VERSIONS,
  type CompatibilityInput,
  type CompatibilityRecord,
  type CompatibilityStatus,
  type CompatibilityResult,
  type EvidenceFreshness,
  type KiroSurface,
  type StageResult,
  type SurfaceVersion,
  type ValidationRun,
} from "./contracts";
import type { CompatibilityMatrix as CompatibilityMatrixContract } from "./contracts";

export const COMPATIBILITY_REVIEW_DATE = "2026-08-25" as const;
export const OBSERVED_IDE_SESSION = "The active environment is a Kiro IDE session." as const;
export const OBSERVED_CLI_2_VERSION = "A fresh command reported kiro-cli-chat 2.19.1." as const;
export const COMPATIBILITY_ROLLBACK_PREFIX = "rollback:compatibility" as const;

export const COMPATIBILITY_SURFACE_VERSIONS = REQUIRED_SURFACE_VERSIONS;

const ENABLEMENT_GATE_LIMITATION =
  "Compatibility assessment does not grant enabled-valid status; owner approval, schema, repository, security, and rollback gates remain required.";
const EXACT_TARGET_LIMITATION =
  "A fresh Validation_Run for this exact surface/version is required; evidence from another surface or version is not transferable.";

interface BaselineProfile {
  readonly documentedBehavior: readonly string[];
  readonly observedBehavior: readonly string[];
  readonly unsupportedClaims: readonly string[];
  readonly migrationConstraints: readonly string[];
  readonly validationAction: string;
  readonly baselineEvidenceFreshness: EvidenceFreshness;
}

const BASELINE_PROFILES: Readonly<Record<KiroSurface, BaselineProfile>> = {
  IDE: {
    documentedBehavior: [
      "Project-local .kiro guidance is repository-scoped and must be validated on the selected IDE surface.",
    ],
    observedBehavior: [OBSERVED_IDE_SESSION],
    unsupportedClaims: [
      "The observed IDE session does not validate CLI, Web, Mobile, Cloud/Crew, or another IDE version.",
    ],
    migrationConstraints: [
      "A changed IDE artifact requires a fresh post-change IDE Validation_Run before enablement.",
    ],
    validationAction:
      "Run a fresh post-change Validation_Run in the observed Kiro IDE session for version current and record the artifact result.",
    baselineEvidenceFreshness: "historical",
  },
  "CLI 2.x": {
    documentedBehavior: [
      "CLI behavior is version-sensitive; CLI 2.x evidence applies only to the CLI 2.x target.",
    ],
    observedBehavior: [OBSERVED_CLI_2_VERSION],
    unsupportedClaims: [
      "The kiro-cli-chat 2.19.1 observation does not validate CLI 3.x, IDE, Web, Mobile, Cloud/Crew, or Local_Repository_Surface behavior.",
    ],
    migrationConstraints: [
      "A changed CLI 2.x artifact requires a fresh CLI 2.x Validation_Run; a CLI 3.x run cannot substitute for it.",
    ],
    validationAction:
      "Run a fresh Validation_Run with kiro-cli-chat 2.19.1 (or another explicitly identified CLI 2.x version) and record the exact CLI 2.x target.",
    baselineEvidenceFreshness: "historical",
  },
  "CLI 3.x": {
    documentedBehavior: [
      "CLI 3.x behavior and migration requirements are version-sensitive and require a CLI 3.x validation run.",
    ],
    observedBehavior: ["CLI 3.x behavior is not locally validated."],
    unsupportedClaims: [
      "The CLI 2.x 2.19.1 observation cannot satisfy a CLI 3.x compatibility claim.",
    ],
    migrationConstraints: [
      "CLI 3.x migration prerequisites and changed schemas must be validated on CLI 3.x before enablement.",
    ],
    validationAction:
      "Run a fresh post-change Validation_Run on an explicitly identified CLI 3.x target and record its 3.x version; do not reuse CLI 2.x evidence.",
    baselineEvidenceFreshness: "historical",
  },
  Web: {
    documentedBehavior: [
      "Web does not use global configuration and does not support hooks; custom agents are documented as IDE/CLI capabilities.",
    ],
    observedBehavior: [],
    unsupportedClaims: [
      "No local Web surface validation was supplied; documentation alone does not prove repository compatibility.",
      "Global configuration and hook support are not claimed for Web.",
    ],
    migrationConstraints: [
      "Validate project guidance on Web separately; do not infer global configuration, hooks, or custom-agent behavior from IDE or CLI runs.",
    ],
    validationAction:
      "Run a fresh Web surface Validation_Run for the repository guidance target and record any documented non-applicable features explicitly.",
    baselineEvidenceFreshness: "historical",
  },
  Mobile: {
    documentedBehavior: [
      "Mobile does not use global configuration and does not support hooks; surface-specific behavior must be assessed independently.",
    ],
    observedBehavior: [],
    unsupportedClaims: [
      "No local Mobile surface validation was supplied; Web, IDE, and CLI evidence cannot validate Mobile.",
      "Global configuration and hook support are not claimed for Mobile.",
    ],
    migrationConstraints: [
      "Run a Mobile-specific review before making any project-guidance, global-configuration, or hook claim.",
    ],
    validationAction:
      "Run a fresh Mobile surface Validation_Run for the repository guidance target and record the exact Mobile applicability result.",
    baselineEvidenceFreshness: "historical",
  },
  "Cloud/Crew": {
    documentedBehavior: [
      "Cloud/Crew execution documentation describes worktrees, concurrency, retries or replans, and approval behavior that must be checked against repository safeguards.",
    ],
    observedBehavior: ["Crew was uninstalled; no local Cloud/Crew execution validation is available."],
    unsupportedClaims: [
      "Cloud/Crew compatibility is not established by documentation or the local uninstalled state.",
      "Crew worktrees, general multi-agent execution, hidden spawning, automatic retries or replans, and auto-approval remain incompatible or deferred without a separate approved exception.",
      "The feature-only OD-04 implementation wave does not authorize Crew execution.",
    ],
    migrationConstraints: [
      "A Cloud/Crew migration requires a named compatible design or policy exception, an approval boundary, fresh Cloud/Crew validation, and a rollback path.",
    ],
    validationAction:
      "Run a separately approved Cloud/Crew compatibility and repository-policy validation; do not execute Crew behavior from this local matrix.",
    baselineEvidenceFreshness: "historical",
  },
  Local_Repository_Surface: {
    documentedBehavior: [
      "The Local_Repository_Surface contains repository-local .kiro artifacts and root commands; it does not prove that Kiro loads or executes them.",
    ],
    observedBehavior: [
      "Repository-local .kiro files and root commands are observed in D:\\23082026.",
    ],
    unsupportedClaims: [
      "Static repository inspection does not prove Kiro artifact loading, hook execution, or surface compatibility.",
    ],
    migrationConstraints: [
      "Validate artifact schemas and repository gates after changes; keep Kiro loading claims separate from static inventory evidence.",
    ],
    validationAction:
      "Run the local artifact and repository validation gates from D:\\23082026, then record the exact Local_Repository_Surface result.",
    baselineEvidenceFreshness: "historical",
  },
};

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function targetKey(target: SurfaceVersion): string {
  return `${target.surface}::${target.version}`;
}

function rollbackPathFor(target: SurfaceVersion): string {
  return `${COMPATIBILITY_ROLLBACK_PREFIX}:${target.surface.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}:${target.version}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function targetForUnknown(value: unknown): SurfaceVersion | null {
  if (!isObject(value) || typeof value.surface !== "string" || typeof value.version !== "string") {
    return null;
  }

  return (
    REQUIRED_SURFACE_VERSIONS.find(
      (target) => target.surface === value.surface && target.version === value.version,
    ) ?? null
  );
}

function stringValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function validationRunId(value: unknown): string | null {
  if (!isObject(value) || typeof value.validationId !== "string" || value.validationId.trim().length === 0) {
    return null;
  }
  return value.validationId;
}

function targetMatchesValidationRun(target: SurfaceVersion, run: ValidationRun): boolean {
  if (run.surface !== target.surface) return false;

  if (target.version === "2.x") {
    return run.version === "2.x" || /^2(?:\.\d+){1,2}(?:[-+].*)?$/.test(run.version);
  }
  if (target.version === "3.x") {
    return run.version === "3.x" || /^3(?:\.\d+){1,2}(?:[-+].*)?$/.test(run.version);
  }

  return run.version === target.version;
}

function isPassingValidationRun(run: ValidationRun): boolean {
  return run.result === "pass" && run.blocker === "none" && run.unverifiedItems.length === 0;
}

function isKnownSurfaceEvidenceTransfer(target: SurfaceVersion, value: string): boolean {
  if (target.surface !== "CLI 2.x" && /kiro-cli-chat\s+2(?:\.\d+){1,2}/i.test(value)) {
    return true;
  }
  if (target.surface !== "IDE" && /kiro\s+ide\s+session/i.test(value)) {
    return true;
  }
  if (target.surface !== "Cloud/Crew" && /crew\s+was\s+uninstalled/i.test(value)) {
    return true;
  }
  return false;
}

function createBaselineRecord(target: SurfaceVersion): CompatibilityRecord {
  const profile = BASELINE_PROFILES[target.surface];

  return {
    ...target,
    status: "Unverified",
    documentedBehavior: [...profile.documentedBehavior],
    observedBehavior: [...profile.observedBehavior],
    evidenceFreshness: profile.baselineEvidenceFreshness,
    versionSensitiveClaim: true,
    validationAction: profile.validationAction,
    validationRunRefs: [],
    enablementStatus: target.surface === "Cloud/Crew" ? "deferred" : "blocked",
    unsupportedClaims: [
      ...profile.unsupportedClaims,
      EXACT_TARGET_LIMITATION,
      ENABLEMENT_GATE_LIMITATION,
    ],
    migrationConstraints: [...profile.migrationConstraints],
    rollbackPathRef: rollbackPathFor(target),
  };
}

function asCandidateRecord(value: unknown): CompatibilityRecord | null {
  if (!targetForUnknown(value)) return null;
  return value as CompatibilityRecord;
}

function validateRequestedTargets(input: CompatibilityInput): string[] {
  const blockers: string[] = [];
  const seen = new Set<string>();

  for (const value of input.requestedSurfaces as readonly unknown[]) {
    const target = targetForUnknown(value);
    if (!target) {
      blockers.push("requestedSurfaces contains an unknown surface/version target");
      continue;
    }

    const key = targetKey(target);
    if (seen.has(key)) {
      blockers.push(`requestedSurfaces contains duplicate target ${key}`);
    }
    seen.add(key);
  }

  if (input.requestedSurfaces.length === 0) {
    blockers.push("at least one requested surface/version target is required");
  }

  return blockers;
}

function collectCandidateRecords(
  input: CompatibilityInput,
  transferViolations: string[],
): Map<string, CompatibilityRecord> {
  const candidates = new Map<string, CompatibilityRecord>();

  for (const value of input.records as readonly unknown[]) {
    const target = targetForUnknown(value);
    const candidate = asCandidateRecord(value);
    if (!target || !candidate) {
      transferViolations.push("a compatibility record has an unknown or malformed surface/version target");
      continue;
    }

    const key = targetKey(target);
    if (candidates.has(key)) {
      transferViolations.push(`duplicate compatibility records were supplied for ${key}`);
      continue;
    }

    candidates.set(key, candidate);
  }

  return candidates;
}

function collectValidationRuns(
  input: CompatibilityInput,
  transferViolations: string[],
): Map<string, ValidationRun> {
  const runs = new Map<string, ValidationRun>();

  for (const value of input.validationRuns as readonly unknown[]) {
    if (!isObject(value)) {
      transferViolations.push("a validation run is malformed and cannot be used as compatibility evidence");
      continue;
    }

    const id = validationRunId(value);
    if (!id) {
      transferViolations.push("a validation run is missing a stable validationId");
      continue;
    }

    const run = value as unknown as ValidationRun;
    if (runs.has(id)) {
      transferViolations.push(`validation run ${id} is duplicated and cannot be transferred between targets`);
      continue;
    }

    runs.set(id, run);
  }

  return runs;
}

function targetValidationRuns(
  target: SurfaceVersion,
  runs: readonly ValidationRun[],
): ValidationRun[] {
  return runs.filter((run) => targetMatchesValidationRun(target, run));
}

function mergeRecord(
  target: SurfaceVersion,
  candidate: CompatibilityRecord | undefined,
  exactRuns: readonly ValidationRun[],
  requested: boolean,
  transferViolations: string[],
): CompatibilityRecord {
  const profile = BASELINE_PROFILES[target.surface];
  const record = createBaselineRecord(target);
  const candidateDocumented = stringValues(candidate?.documentedBehavior);
  const candidateObserved = stringValues(candidate?.observedBehavior).filter((value) => {
    const transferred = isKnownSurfaceEvidenceTransfer(target, value);
    if (transferred) {
      transferViolations.push(
        `observed evidence was supplied for the wrong target and was not transferred to ${targetKey(target)}`,
      );
    }
    return !transferred;
  });
  const candidateUnsupported = stringValues(candidate?.unsupportedClaims);
  const candidateMigrationConstraints = stringValues(candidate?.migrationConstraints);
  const exactRunRefs = exactRuns.map((run) => run.validationId);
  const hasPassingRun = exactRuns.some(isPassingValidationRun);
  const hasExactRun = exactRuns.length > 0;

  const unsupportedClaims = unique([
    ...record.unsupportedClaims,
    ...candidateUnsupported,
    ...(requested ? [] : [`${targetKey(target)} was not selected as an Active_Surface for this run.`]),
    ...(hasExactRun && !hasPassingRun
      ? [`The exact ${targetKey(target)} Validation_Run did not pass; compatibility remains Unverified.`]
      : []),
    ...(!hasExactRun
      ? [`No fresh passing Validation_Run exists for exact target ${targetKey(target)}.`]
      : []),
    ...(candidate?.evidenceFreshness === "fresh" && !hasPassingRun
      ? ["Supplied fresh evidence was not backed by a fresh passing exact-target Validation_Run."]
      : []),
  ]);

  const status: CompatibilityStatus =
    target.surface !== "Cloud/Crew" && hasPassingRun ? "applicable" : "Unverified";
  const evidenceFreshness: EvidenceFreshness = hasExactRun
    ? "fresh"
    : profile.baselineEvidenceFreshness;

  return {
    ...record,
    status,
    documentedBehavior: unique([...record.documentedBehavior, ...candidateDocumented]),
    observedBehavior: unique([...record.observedBehavior, ...candidateObserved]),
    evidenceFreshness,
    versionSensitiveClaim: true,
    validationRunRefs: exactRunRefs,
    unsupportedClaims,
    migrationConstraints: unique([
      ...record.migrationConstraints,
      ...candidateMigrationConstraints,
    ]),
    rollbackPathRef:
      typeof candidate?.rollbackPathRef === "string" && candidate.rollbackPathRef.trim().length > 0
        ? candidate.rollbackPathRef
        : record.rollbackPathRef,
    enablementStatus: target.surface === "Cloud/Crew" ? "deferred" : "blocked",
  };
}

function targetEvidenceReferences(records: readonly CompatibilityRecord[]): string[] {
  return records.flatMap((record) => [
    ...record.validationRunRefs,
    record.rollbackPathRef,
  ]);
}

export function assessCompatibilityRecords(
  input: CompatibilityInput,
): StageResult<CompatibilityResult> {
  const inputBlockers = validateRequestedTargets(input);
  const transferViolations: string[] = [];
  const candidates = collectCandidateRecords(input, transferViolations);
  const validationRunsById = collectValidationRuns(input, transferViolations);
  const validationRuns = [...validationRunsById.values()];
  const requestedKeys = new Set(
    (input.requestedSurfaces as readonly unknown[])
      .map(targetForUnknown)
      .filter((target): target is SurfaceVersion => target !== null)
      .map(targetKey),
  );

  const records = REQUIRED_SURFACE_VERSIONS.map((target) => {
    const key = targetKey(target);
    const candidate = candidates.get(key);
    const candidateRefs = stringValues(candidate?.validationRunRefs);

    for (const reference of candidateRefs) {
      const referencedRun = validationRunsById.get(reference);
      if (!referencedRun) {
        transferViolations.push(
          `${key} references unavailable validation run ${reference}; evidence was not transferred`,
        );
        continue;
      }
      if (!targetMatchesValidationRun(target, referencedRun)) {
        transferViolations.push(
          `validation run ${reference} targets ${referencedRun.surface} ${referencedRun.version} and cannot satisfy ${key}`,
        );
      }
    }

    const exactRuns = targetValidationRuns(target, validationRuns);
    return mergeRecord(
      target,
      candidate,
      exactRuns,
      requestedKeys.has(key),
      transferViolations,
    );
  });

  const missingTargetEvidence = records
    .filter((record) => record.status === "Unverified")
    .map(
      (record) =>
        `${targetKey(record)} is ${record.status}; enablement remains ${record.enablementStatus} until exact target validation and policy checks pass`,
    );
  const blockers = unique([
    ...inputBlockers,
    ...transferViolations,
    ...missingTargetEvidence,
  ]);
  const output: CompatibilityResult = {
    records,
    transferViolations: unique(transferViolations),
    blockers,
  };

  if (blockers.length > 0) {
    return {
      status: "partial",
      output,
      blockers,
      evidenceRefs: targetEvidenceReferences(records),
    };
  }

  return {
    status: "pass",
    output,
    blockers: [],
    evidenceRefs: targetEvidenceReferences(records),
  };
}

export class CompatibilityMatrix implements CompatibilityMatrixContract {
  assess(input: CompatibilityInput): StageResult<CompatibilityResult> {
    return assessCompatibilityRecords(input);
  }
}

export const compatibilityMatrix = new CompatibilityMatrix();
export const assessCompatibility = (input: CompatibilityInput): StageResult<CompatibilityResult> =>
  compatibilityMatrix.assess(input);

export default compatibilityMatrix;
