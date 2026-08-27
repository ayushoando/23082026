/**
 * Lane C continuity, graph-impact, specification, task-wave, review-loop, and
 * Crew-compatibility evaluator.
 *
 * This module is a deterministic, side-effect-free evaluator.  It never runs a
 * command, contacts Crew, persists memory, executes a hook, or enables a
 * capability.  It classifies supplied and repository-local metadata into
 * separate records so that:
 *
 *   - local compaction, checkpoints/rewind, CLI session persistence, Crew
 *     memory, Crew knowledge, and LTM capture stay in distinct records with
 *     distinct data boundaries (Requirements 9.4-9.6);
 *   - LTM capture stays isolated to local repository memory and is governed by
 *     the configured Stop hook; Crew memory/knowledge documentation is never
 *     used as local LTM execution evidence (Requirement 9.6);
 *   - the manual graph-impact loop is preserved and any automation is capped at
 *     three iterations (Requirement 10.5, OD-03);
 *   - default/native task graphs and parallel waves keep maximum concurrency
 *     `0 | 1`, and review loops keep an iteration ceiling of `0..3`
 *     (Requirements 9.1-9.2, 10.4, 10.7);
 *   - Crew worktrees, concurrency above one, retries/replans, hidden spawning,
 *     and auto-approval are classified deferred or excluded and can never
 *     become enabled-valid (Requirements 9.3, 10.6, 10.11, 14.5).
 *
 * Continuity/graph-impact evidence is kept isolated per data boundary; a Crew
 * (Cloud) data boundary observation cannot cross into a local record.
 */

import {
  REPOSITORY_ROOT,
  REQUIRED_SURFACE_VERSIONS,
  type CapabilityDisposition,
  type CapabilityDispositionRecord,
  type ConfigurationScope,
  type DefaultTaskConcurrency,
  type EvidenceProvenance,
  type EvidenceState,
  type Identifier,
  type KiroSurface,
  type KnownGap,
  type OwnerDecision,
  type OwnerDecisionId,
  type RepositoryPath,
  type ReviewerIterationCeiling,
  type StageResult,
  type SurfaceVersion,
} from "./contracts";

export const CONTINUITY_OWNER = "repository owner" as const;
export const CONTINUITY_VALIDATION_PREFIX = "validation:continuity" as const;
export const CONTINUITY_ROLLBACK_PREFIX = "rollback:continuity" as const;
export const LTM_CAPTURE_COMMAND = "ltm/bin/ltm.py capture-turn" as const;
export const LTM_HOOK_PATH = ".kiro/hooks/ltm-postturn-capture.json" as const;
export const GRAPH_IMPACT_SCRIPT = "scripts/graph-impact.mjs" as const;
export const GRAPH_IMPACT_MAX_ITERATIONS = 3 as const;

/** Owner decisions that gate each capability family. */
export const OD03_DECISION_ID: OwnerDecisionId = "OD-03";
export const OD04_DECISION_ID: OwnerDecisionId = "OD-04";

/** The nine capability families this evaluator classifies. */
export type ContinuityCapabilityKind =
  // Continuity / data-boundary capabilities.
  | "local_compaction"
  | "checkpoints_rewind"
  | "cli_session_persistence"
  | "crew_memory"
  | "crew_knowledge"
  | "ltm_capture"
  // Execution / workflow capabilities.
  | "graph_impact_automation"
  | "specification_workflow"
  | "native_task_graph"
  | "parallel_task_wave"
  | "subagent_dag"
  | "review_loop"
  | "crew_task_runner";

export const CONTINUITY_CAPABILITY_KINDS = [
  "local_compaction",
  "checkpoints_rewind",
  "cli_session_persistence",
  "crew_memory",
  "crew_knowledge",
  "ltm_capture",
] as const satisfies readonly ContinuityCapabilityKind[];

export const EXECUTION_CAPABILITY_KINDS = [
  "graph_impact_automation",
  "specification_workflow",
  "native_task_graph",
  "parallel_task_wave",
  "subagent_dag",
  "review_loop",
  "crew_task_runner",
] as const satisfies readonly ContinuityCapabilityKind[];

/** A data boundary keeps local, CLI-session, and Crew (Cloud) evidence isolated. */
export type DataBoundary =
  | "local_session"
  | "local_artifact_or_session_state"
  | "cli_version_session_store"
  | "cloud_crew_memory"
  | "cloud_crew_knowledge"
  | "local_repository_capture"
  | "repository_process";

export type ContinuityStatus =
  | "observed"
  | "documented"
  | "deferred"
  | "disabled"
  | "excluded";

/** Behavior flags that make a Cloud/Crew capability repository-incompatible. */
export interface CrewBehaviorFlags {
  readonly worktrees: boolean;
  readonly concurrencyAboveOne: boolean;
  readonly automaticRetries: boolean;
  readonly automaticReplans: boolean;
  readonly hiddenSpawning: boolean;
  readonly autoApproval: boolean;
  readonly usesOd04Exception: boolean;
}

export const CREW_INCOMPATIBLE_BEHAVIORS = [
  "worktrees",
  "concurrencyAboveOne",
  "automaticRetries",
  "automaticReplans",
  "hiddenSpawning",
  "autoApproval",
  "usesOd04Exception",
] as const satisfies readonly (keyof CrewBehaviorFlags)[];

export interface ContinuityCapabilityRecord {
  readonly capabilityId: Identifier;
  readonly kind: ContinuityCapabilityKind;
  readonly name: string;
  readonly surfaces: readonly KiroSurface[];
  readonly surfaceVersionApplicability: readonly SurfaceVersion[];
  readonly dataBoundary: DataBoundary;
  readonly configurationScope: ConfigurationScope;
  readonly documentedBehavior: readonly string[];
  readonly observedBehavior: readonly string[];
  readonly evidenceState: EvidenceState;
  readonly retentionOrContinuityLimit: string;
  /** Default/native task and reviewer execution stay at 0 or 1. */
  readonly maximumConcurrency: DefaultTaskConcurrency;
  /** Review/fix loops stay bounded to three iterations. */
  readonly iterationCeiling: ReviewerIterationCeiling;
  readonly manualFallback: string;
  readonly disposition: CapabilityDisposition;
  readonly status: ContinuityStatus;
  readonly validationAction: string;
  readonly validationRunRefs: readonly Identifier[];
  readonly ownerApprovalRef: string;
  readonly rollbackPath: string;
  readonly provenance: EvidenceProvenance;
  readonly crewBehaviorFlags?: CrewBehaviorFlags;
  readonly incompatibleBehaviors: readonly (keyof CrewBehaviorFlags)[];
  readonly knownGapRefs: readonly Identifier[];
  readonly blockers: readonly string[];
}

export interface ContinuityCapabilityInput {
  readonly kind: ContinuityCapabilityKind;
  readonly name?: string;
  readonly documentedBehavior?: readonly string[];
  readonly observedBehavior?: readonly string[];
  readonly retentionOrContinuityLimit?: string;
  readonly validationRunRefs?: readonly Identifier[];
  readonly ownerApprovalRef?: string;
  readonly rollbackPath?: string;
  readonly provenance?: EvidenceProvenance;
  /** Only meaningful for Crew families; ignored elsewhere. */
  readonly crewBehaviorFlags?: Partial<CrewBehaviorFlags>;
  /** Only meaningful for ltm_capture; defaults to true (stub present). */
  readonly captureCommandIsStub?: boolean;
  /** Proposed automation iteration count for graph_impact_automation. */
  readonly proposedIterations?: number;
  /** Proposed maximum concurrency for native/parallel/subagent execution. */
  readonly proposedMaximumConcurrency?: number;
  /** Proposed iteration ceiling for review loops. */
  readonly proposedIterationCeiling?: number;
}

export interface ContinuityEvaluatorInput {
  readonly repositoryRoot?: RepositoryPath;
  readonly ownerDecisions?: readonly OwnerDecision[];
  readonly capabilities?: readonly ContinuityCapabilityInput[];
  /** When true, ltm_capture is treated as still stubbed even without an entry. */
  readonly ltmCaptureIsStub?: boolean;
}

export interface ContinuityEvaluationResult {
  readonly records: readonly ContinuityCapabilityRecord[];
  readonly continuityRecords: readonly ContinuityCapabilityRecord[];
  readonly executionRecords: readonly ContinuityCapabilityRecord[];
  readonly dispositions: readonly CapabilityDispositionRecord[];
  readonly knownGaps: readonly KnownGap[];
  readonly policyViolations: readonly string[];
  readonly blockers: readonly string[];
  readonly externalRoutingAttempted: false;
}

interface EvaluationContext {
  readonly repositoryRoot: string;
  readonly ownerDecisions: readonly OwnerDecision[];
  readonly knownGaps: KnownGap[];
  readonly policyViolations: string[];
  readonly blockers: string[];
}

interface CapabilityProfile {
  readonly name: string;
  readonly surfaces: readonly KiroSurface[];
  readonly dataBoundary: DataBoundary;
  readonly configurationScope: ConfigurationScope;
  readonly documentedBehavior: readonly string[];
  readonly observedBehavior: readonly string[];
  readonly retentionOrContinuityLimit: string;
  readonly manualFallback: string;
  readonly validationAction: string;
  /** Owner decision that must be approved before enablement, if any. */
  readonly gatingDecision?: OwnerDecisionId;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function uniqueStrings(values: readonly string[]): string[] {
  return unique(values.filter((value) => value.trim().length > 0));
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 140) || "unnamed"
  );
}

function redact(value: string): string {
  return value.replace(
    /((?:api[_-]?key|token|password|secret|credential)\s*[=:]\s*)[^\s,&]+/gi,
    "$1[REDACTED]",
  );
}

function surfaceVersionsFor(surfaces: readonly KiroSurface[]): SurfaceVersion[] {
  return surfaces.flatMap((candidate) => {
    const match = REQUIRED_SURFACE_VERSIONS.find((record) => record.surface === candidate);
    return match ? [match] : [];
  });
}

function defaultProvenance(
  root: string,
  result: string,
  supplied?: EvidenceProvenance,
): EvidenceProvenance {
  return {
    observer: supplied && nonEmpty(supplied.observer) ? redact(supplied.observer) : CONTINUITY_OWNER,
    cwdOrSurface: supplied && nonEmpty(supplied.cwdOrSurface) ? redact(supplied.cwdOrSurface) : root,
    commandOrPath:
      supplied && nonEmpty(supplied.commandOrPath) ? redact(supplied.commandOrPath) : "static metadata inspection only",
    result: supplied && nonEmpty(supplied.result) ? redact(supplied.result) : redact(result),
    ...(supplied && nonEmpty(supplied.integrityBasis) ? { integrityBasis: redact(supplied.integrityBasis) } : {}),
  };
}

function decisionFor(
  decisions: readonly OwnerDecision[],
  decisionId: OwnerDecisionId,
): OwnerDecision | undefined {
  return decisions.find((decision) => decision.decisionId === decisionId);
}

function decisionApproved(decision: OwnerDecision | undefined): boolean {
  return (
    decision !== undefined &&
    decision.selectedPolicy === "enable after validation" &&
    (decision.approvalStatus === "owner-approved" || decision.approvalStatus === "owner-approved-conditional") &&
    decision.unresolvedStatus !== "unresolved"
  );
}

function makeGap(
  context: EvaluationContext,
  capabilityId: string,
  spec: {
    readonly kind: KnownGap["kind"];
    readonly title: string;
    readonly blockedAction: string;
    readonly disposition: CapabilityDisposition;
    readonly limitation: string;
    readonly evidenceRefs: readonly Identifier[];
  },
): string {
  const gapId = `known-gap:${slug(capabilityId)}:${slug(spec.title)}`;
  const existing = context.knownGaps.find((gap) => gap.gapId === gapId);
  if (existing) return existing.gapId;
  const evidenceState: EvidenceState =
    spec.kind === "policy_conflict" || spec.kind === "unverified" || spec.kind === "missing_prerequisite"
      ? "Unverified"
      : "Approval_Boundary";
  context.knownGaps.push({
    gapId,
    kind: spec.kind,
    title: spec.title,
    evidenceState,
    evidenceRefs: uniqueStrings([...spec.evidenceRefs]),
    owner: CONTINUITY_OWNER,
    nextValidationRun: `${CONTINUITY_VALIDATION_PREFIX}:${slug(capabilityId)}:next`,
    blockedAction: spec.blockedAction,
    disposition: spec.disposition,
    status: "open",
    limitation: spec.limitation,
  });
  return gapId;
}

const CAPABILITY_PROFILES: Record<ContinuityCapabilityKind, CapabilityProfile> = {
  local_compaction: {
    name: "local compaction",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Local_Repository_Surface"],
    dataBoundary: "local_session",
    configurationScope: "project",
    documentedBehavior: ["compaction reduces local session context so work can continue"],
    observedBehavior: ["local session context handling is relevant to the observed surface"],
    retentionOrContinuityLimit: "bounded to the current local session context; not memory persistence",
    manualFallback: "manual re-priming of the session with canonical sources",
    validationAction: "validate compaction on the selected local surface; do not equate with memory persistence",
  },
  checkpoints_rewind: {
    name: "checkpoints and rewind",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x", "Local_Repository_Surface"],
    dataBoundary: "local_artifact_or_session_state",
    configurationScope: "project",
    documentedBehavior: ["checkpoints capture local artifact/session state for restore"],
    observedBehavior: ["restore semantics are relevant to local artifact/session state"],
    retentionOrContinuityLimit: "bounded to local artifact/session snapshots",
    manualFallback: "manual snapshot and restore of affected artifacts",
    validationAction: "validate restore semantics and rollback separately on the local surface",
  },
  cli_session_persistence: {
    name: "CLI session persistence",
    surfaces: ["CLI 2.x", "CLI 3.x"],
    dataBoundary: "cli_version_session_store",
    configurationScope: "project",
    documentedBehavior: ["CLI session state persists per CLI version session store"],
    observedBehavior: ["kiro-cli-chat 2.19.1 evidence is CLI 2.x only"],
    retentionOrContinuityLimit: "bounded per CLI version; CLI 2.x evidence does not transfer to CLI 3.x",
    manualFallback: "manual CLI session re-establishment per version",
    validationAction: "validate per CLI version; do not transfer CLI 2.x evidence to CLI 3.x",
  },
  crew_memory: {
    name: "Crew memory",
    surfaces: ["Cloud/Crew"],
    dataBoundary: "cloud_crew_memory",
    configurationScope: "external_service",
    documentedBehavior: ["Crew memory is a Cloud/Crew capability with its own data boundary"],
    observedBehavior: ["Crew was uninstalled; documentation is non-execution evidence"],
    retentionOrContinuityLimit: "Cloud/Crew memory boundary; separate from local records",
    manualFallback: "repository-local notes; no cross-boundary memory",
    validationAction: "requires Cloud/Crew validation and approval; documentation is not local LTM proof",
  },
  crew_knowledge: {
    name: "Crew knowledge",
    surfaces: ["Cloud/Crew"],
    dataBoundary: "cloud_crew_knowledge",
    configurationScope: "external_service",
    documentedBehavior: ["Crew knowledge is a Cloud/Crew capability distinct from Crew memory"],
    observedBehavior: ["Crew was uninstalled; documentation is non-execution evidence"],
    retentionOrContinuityLimit: "Cloud/Crew knowledge boundary; kept separate from memory and local records",
    manualFallback: "repository-local canonical documentation",
    validationAction: "keep separate from memory and local records; requires Cloud/Crew validation and approval",
  },
  ltm_capture: {
    name: "LTM capture",
    surfaces: ["Local_Repository_Surface"],
    dataBoundary: "local_repository_capture",
    configurationScope: "project",
    documentedBehavior: [`the LTM capture hook depends on ${LTM_CAPTURE_COMMAND}`],
    observedBehavior: [`${LTM_CAPTURE_COMMAND} is implemented and the Stop hook is enabled`],
    retentionOrContinuityLimit: "local repository capture boundary with bounded event history",
    manualFallback: "manual notes when automatic capture is unavailable",
    validationAction: "validate the configured command and local event writes; keep capture separate from tests and gates",
    gatingDecision: "OD-02",
  },
  graph_impact_automation: {
    name: "graph-impact workflow",
    surfaces: ["Local_Repository_Surface", "IDE", "CLI 2.x", "CLI 3.x"],
    dataBoundary: "repository_process",
    configurationScope: "manual",
    documentedBehavior: [
      `manual loop: inspect ${GRAPH_IMPACT_SCRIPT} -> report the suggested user-invoked validation command -> apply fixes only when requested`,
    ],
    observedBehavior: [`${GRAPH_IMPACT_SCRIPT} exists with stats/impact/cycle modes; validation remains manual and user-invoked`],
    retentionOrContinuityLimit: "no automatic test or gate execution; user-requested fix/validation loops remain bounded",
    manualFallback: "the reviewed manual graph-impact workflow remains the fallback",
    validationAction:
      "validate reviewed root command, cost, failure behavior, matcher/trigger, side effects, and rollback without automatic test or gate execution",
    gatingDecision: "OD-03",
  },
  specification_workflow: {
    name: "specification and analysis workflows",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x"],
    dataBoundary: "repository_process",
    configurationScope: "project",
    documentedBehavior: ["feature/bugfix/quick specs, plans, correctness, analysis, and best practices are repository-local artifacts"],
    observedBehavior: [".kiro/specs workflow is the current repository-local spec flow"],
    retentionOrContinuityLimit: "repository-local spec artifacts under .kiro/specs",
    manualFallback: "current .kiro/specs workflow and plans/PLAN.md",
    validationAction: "validate surface loading and requirements/design/tasks transitions",
  },
  native_task_graph: {
    name: "native task graph",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x"],
    dataBoundary: "repository_process",
    configurationScope: "project",
    documentedBehavior: ["native task graphs build dependency graphs for execution"],
    observedBehavior: ["default/native task execution stays sequential under the repository rule"],
    retentionOrContinuityLimit: "default/native task execution keeps maximum concurrency 0 or 1",
    manualFallback: "sequential task execution",
    validationAction: "validate maximum concurrency 0/1, no worktrees, and explicit approvals",
  },
  parallel_task_wave: {
    name: "parallel task wave",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x"],
    dataBoundary: "repository_process",
    configurationScope: "project",
    documentedBehavior: ["parallel task waves run time-overlapping work"],
    observedBehavior: ["default/native waves must not create parallel agents; the OD-04 wave is a separate record"],
    retentionOrContinuityLimit: "default/native waves keep maximum concurrency 0 or 1; the OD-04 feature wave is governed separately",
    manualFallback: "manual ordered list of tasks",
    validationAction: "validate that no default/native wave creates parallel agents outside the OD-04 feature wave",
  },
  subagent_dag: {
    name: "subagent DAG",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x"],
    dataBoundary: "repository_process",
    configurationScope: "agent",
    documentedBehavior: ["subagents support DAGs and bounded review loops"],
    observedBehavior: ["single-agent workflow is the default"],
    retentionOrContinuityLimit: "one-agent ceiling for default/native subagent execution",
    manualFallback: "single-agent workflow",
    validationAction: "validate DAG, one-agent ceiling, approval, rollback, and failure behavior",
  },
  review_loop: {
    name: "bounded review loop",
    surfaces: ["IDE", "CLI 2.x", "CLI 3.x"],
    dataBoundary: "repository_process",
    configurationScope: "project",
    documentedBehavior: ["review loops support bounded iteration"],
    observedBehavior: ["manual review with a maximum of three iterations is the fallback"],
    retentionOrContinuityLimit: "iteration ceiling 0 through 3; no hidden replan",
    manualFallback: "manual review with a maximum of three iterations",
    validationAction: "validate iteration ceiling 0-3, explicit approval, and no hidden replan",
  },
  crew_task_runner: {
    name: "Crew Task Runner",
    surfaces: ["Cloud/Crew"],
    dataBoundary: "cloud_crew_knowledge",
    configurationScope: "external_service",
    documentedBehavior: ["Crew Task Runner documents worktrees, up to three concurrent runs, retries/replans, and auto-approval"],
    observedBehavior: ["Crew was uninstalled; documented behavior conflicts with repository rules"],
    retentionOrContinuityLimit: "not repository-compatible without an approved compatible design and fresh Cloud/Crew validation",
    manualFallback: "manual repository workflow",
    validationAction: "scan for worktrees, concurrency, retries/replans, auto-approval; keep deferred or excluded",
  },
};

function isContinuityKind(kind: ContinuityCapabilityKind): boolean {
  return (CONTINUITY_CAPABILITY_KINDS as readonly ContinuityCapabilityKind[]).includes(kind);
}

function isCrewKind(kind: ContinuityCapabilityKind): boolean {
  return kind === "crew_memory" || kind === "crew_knowledge" || kind === "crew_task_runner";
}

function normalizeCrewFlags(supplied: Partial<CrewBehaviorFlags> | undefined): CrewBehaviorFlags {
  return {
    worktrees: supplied?.worktrees === true,
    concurrencyAboveOne: supplied?.concurrencyAboveOne === true,
    automaticRetries: supplied?.automaticRetries === true,
    automaticReplans: supplied?.automaticReplans === true,
    hiddenSpawning: supplied?.hiddenSpawning === true,
    autoApproval: supplied?.autoApproval === true,
    usesOd04Exception: supplied?.usesOd04Exception === true,
  };
}

function incompatibleBehaviorsOf(flags: CrewBehaviorFlags): (keyof CrewBehaviorFlags)[] {
  return CREW_INCOMPATIBLE_BEHAVIORS.filter((behavior) => flags[behavior]);
}

/**
 * Crew Task Runner documentation always describes worktrees, concurrency,
 * retries/replans, and auto-approval; treat those as present by default so a
 * caller cannot silently claim a benign Crew runner.
 */
function crewTaskRunnerDefaults(supplied: Partial<CrewBehaviorFlags> | undefined): CrewBehaviorFlags {
  const base = normalizeCrewFlags(supplied);
  return {
    ...base,
    worktrees: supplied?.worktrees ?? true,
    concurrencyAboveOne: supplied?.concurrencyAboveOne ?? true,
    automaticRetries: supplied?.automaticRetries ?? true,
    automaticReplans: supplied?.automaticReplans ?? true,
    autoApproval: supplied?.autoApproval ?? true,
  };
}

function boundedConcurrency(value: number | undefined): DefaultTaskConcurrency {
  return value === 1 ? 1 : 0;
}

function boundedIterationCeiling(value: number | undefined): ReviewerIterationCeiling {
  if (value === undefined) return 0;
  if (!Number.isInteger(value) || value < 0) return 0;
  return (value > 3 ? 3 : value) as ReviewerIterationCeiling;
}

function evaluateCapability(
  input: ContinuityCapabilityInput,
  context: EvaluationContext,
): { readonly record: ContinuityCapabilityRecord; readonly disposition: CapabilityDispositionRecord } {
  const profile = CAPABILITY_PROFILES[input.kind];
  const name = redact(input.name ?? profile.name);
  const capabilityId = `capability:continuity:${slug(input.kind)}`;
  const blockers: string[] = [];
  const knownGapRefs: string[] = [];
  const evidenceRefs: Identifier[] = [`evidence:${capabilityId}:provenance`];

  const crew = isCrewKind(input.kind);
  const flags = crew
    ? input.kind === "crew_task_runner"
      ? crewTaskRunnerDefaults(input.crewBehaviorFlags)
      : normalizeCrewFlags(input.crewBehaviorFlags)
    : undefined;
  const incompatibleBehaviors = flags ? incompatibleBehaviorsOf(flags) : [];

  const documentedBehavior = uniqueStrings([
    ...profile.documentedBehavior,
    ...(input.documentedBehavior ?? []),
  ]).map(redact);
  const observedBehavior = uniqueStrings([
    ...profile.observedBehavior,
    ...(input.observedBehavior ?? []),
  ]).map(redact);

  const gatingDecision = profile.gatingDecision;
  const decision = gatingDecision ? decisionFor(context.ownerDecisions, gatingDecision) : undefined;
  const ownerApproved = gatingDecision ? decisionApproved(decision) : true;
  const ownerApprovalRef = nonEmpty(input.ownerApprovalRef)
    ? redact(input.ownerApprovalRef)
    : gatingDecision && ownerApproved
      ? `owner-decision:${gatingDecision}`
      : "none";

  const validationRunRefs = uniqueStrings([...(input.validationRunRefs ?? [])]) as Identifier[];
  const rollbackPath = nonEmpty(input.rollbackPath)
    ? redact(input.rollbackPath)
    : `${CONTINUITY_ROLLBACK_PREFIX}:${slug(input.kind)}:disable and restore prior state`;

  let disposition: CapabilityDisposition;
  let status: ContinuityStatus;
  let evidenceState: EvidenceState;
  let maximumConcurrency: DefaultTaskConcurrency = 0;
  let iterationCeiling: ReviewerIterationCeiling = 0;

  if (input.kind === "ltm_capture") {
    // LTM stays disabled while the capture command is a stub; Crew docs are
    // never LTM execution evidence.
    const isStub = input.captureCommandIsStub ?? true;
    disposition = "disable";
    status = "disabled";
    evidenceState = "Unverified";
    blockers.push(`LTM capture stays disabled: ${LTM_CAPTURE_COMMAND} is a documented stub`);
    knownGapRefs.push(
      makeGap(context, capabilityId, {
        kind: "missing_prerequisite",
        title: "LTM capture command is a stub",
        blockedAction: "LTM hook enablement",
        disposition: "disable",
        limitation: `${LTM_CAPTURE_COMMAND} must be implemented and a fresh execution Validation_Run must pass before enablement`,
        evidenceRefs,
      }),
    );
    if (!isStub) {
      // Even if a caller claims the stub is gone, enablement still needs a fresh
      // execution run; without validation refs it stays disabled.
      if (validationRunRefs.length === 0) {
        blockers.push("LTM enablement requires a fresh execution Validation_Run for the exact local surface");
      }
    }
  } else if (crew) {
    // Any incompatible Crew behavior defers/excludes; OD-04 can never enable it.
    const hasIncompatible = incompatibleBehaviors.length > 0;
    disposition = hasIncompatible || input.kind === "crew_task_runner" ? "exclude" : "defer";
    status = disposition === "exclude" ? "excluded" : "deferred";
    evidenceState = "Documented";
    if (hasIncompatible) {
      const behaviorList = incompatibleBehaviors.join(", ");
      blockers.push(`incompatible Crew behavior detected: ${behaviorList}`);
      context.policyViolations.push(
        `${name}: incompatible Crew behavior (${behaviorList}) cannot become enabled-valid through OD-04`,
      );
      knownGapRefs.push(
        makeGap(context, capabilityId, {
          kind: "policy_conflict",
          title: "incompatible Crew behavior is deferred or excluded",
          blockedAction: "Cloud/Crew execution",
          disposition,
          limitation:
            "worktrees, concurrency above one, retries/replans, hidden spawning, and auto-approval conflict with repository rules; OD-04 does not authorize Crew",
          evidenceRefs,
        }),
      );
    }
    if (flags?.usesOd04Exception) {
      blockers.push("Crew cannot use the feature-only OD-04 Concurrent_Implementation_Wave exception");
      context.policyViolations.push(`${name}: Crew attempted to use the OD-04 exception, which is feature-only`);
    }
    knownGapRefs.push(
      makeGap(context, capabilityId, {
        kind: "unverified",
        title: "Crew capability requires separate approval and fresh Cloud/Crew validation",
        blockedAction: "Cloud/Crew enablement",
        disposition,
        limitation: "Crew documentation is non-execution evidence and cannot satisfy local LTM or repository compatibility",
        evidenceRefs,
      }),
    );
  } else if (input.kind === "graph_impact_automation") {
    // Manual loop preserved; automation capped at three iterations.
    iterationCeiling = boundedIterationCeiling(input.proposedIterations ?? GRAPH_IMPACT_MAX_ITERATIONS);
    if (
      input.proposedIterations !== undefined &&
      (input.proposedIterations > GRAPH_IMPACT_MAX_ITERATIONS ||
        input.proposedIterations < 0 ||
        !Number.isInteger(input.proposedIterations))
    ) {
      const exceedsCeiling = input.proposedIterations > GRAPH_IMPACT_MAX_ITERATIONS;
      const violation = exceedsCeiling
        ? `proposed ${input.proposedIterations} iterations exceeds the ceiling of three`
        : `proposed ${input.proposedIterations} iterations is not a whole number between zero and three`;
      blockers.push(
        exceedsCeiling
          ? `graph-impact automation exceeds the ${GRAPH_IMPACT_MAX_ITERATIONS}-iteration ceiling`
          : "graph-impact automation iteration count must be a whole number between zero and three",
      );
      context.policyViolations.push(`${name}: ${violation}`);
    }
    if (!ownerApproved) {
      disposition = "defer";
      status = "deferred";
      blockers.push(`owner approval ${gatingDecision} is missing or unresolved`);
      knownGapRefs.push(
        makeGap(context, capabilityId, {
          kind: "missing_prerequisite",
          title: `owner approval ${gatingDecision} is missing or unresolved`,
          blockedAction: "graph-impact automation",
          disposition: "defer",
          limitation: "the manual graph-impact loop remains the fallback until OD-03 is approved and validated",
          evidenceRefs,
        }),
      );
    } else if (validationRunRefs.length === 0 || blockers.length > 0) {
      disposition = "defer";
      status = "deferred";
      if (validationRunRefs.length === 0) {
        knownGapRefs.push(
          makeGap(context, capabilityId, {
            kind: "unverified",
            title: "graph-impact automation lacks a fresh Validation_Run",
            blockedAction: "graph-impact automation",
            disposition: "defer",
            limitation: "validate the reviewed command, cost, failure behavior, and bounded loop; keep the manual loop as fallback",
            evidenceRefs,
          }),
        );
      }
    } else {
      disposition = "observe";
      status = "observed";
    }
    evidenceState = "Observed";
  } else if (
    input.kind === "native_task_graph" ||
    input.kind === "parallel_task_wave" ||
    input.kind === "subagent_dag"
  ) {
    // Default/native execution keeps maximum concurrency 0 or 1.
    const proposed = input.proposedMaximumConcurrency;
    maximumConcurrency = boundedConcurrency(proposed);
    if (proposed !== undefined && (proposed > 1 || proposed < 0 || !Number.isInteger(proposed))) {
      blockers.push("default/native task execution may not exceed maximum concurrency one");
      context.policyViolations.push(`${name}: proposed maximum concurrency ${proposed} exceeds the default one-agent ceiling`);
    }
    disposition = "defer";
    status = "deferred";
    evidenceState = "Documented";
    knownGapRefs.push(
      makeGap(context, capabilityId, {
        kind: "unverified",
        title: "native execution capability is deferred pending validation",
        blockedAction: `adoption of ${name}`,
        disposition: "defer",
        limitation: "requires bounded concurrency, no worktrees, explicit approval, and fresh validation before adoption",
        evidenceRefs,
      }),
    );
  } else if (input.kind === "review_loop") {
    iterationCeiling = boundedIterationCeiling(input.proposedIterationCeiling ?? 3);
    if (
      input.proposedIterationCeiling !== undefined &&
      (input.proposedIterationCeiling > 3 || input.proposedIterationCeiling < 0 || !Number.isInteger(input.proposedIterationCeiling))
    ) {
      blockers.push("review loop iteration ceiling must be between zero and three");
      context.policyViolations.push(`${name}: proposed iteration ceiling ${input.proposedIterationCeiling} is out of the 0-3 range`);
    }
    disposition = "defer";
    status = "deferred";
    evidenceState = "Documented";
  } else if (input.kind === "specification_workflow") {
    disposition = "retain";
    status = "observed";
    evidenceState = "Observed";
  } else {
    // Local continuity families (compaction, checkpoints, CLI session).
    disposition = "observe";
    status = "observed";
    evidenceState = "Observed";
    if (validationRunRefs.length === 0) {
      knownGapRefs.push(
        makeGap(context, capabilityId, {
          kind: "unverified",
          title: "continuity capability lacks fresh surface validation",
          blockedAction: `enablement of ${name}`,
          disposition: "observe",
          limitation: "record surface, data boundary, retention limit, and a fresh Validation_Run before enablement",
          evidenceRefs,
        }),
      );
    }
  }

  const provenance = defaultProvenance(
    context.repositoryRoot,
    `${name} classified as ${disposition} with data boundary ${profile.dataBoundary}`,
    input.provenance,
  );

  const record: ContinuityCapabilityRecord = {
    capabilityId,
    kind: input.kind,
    name,
    surfaces: [...profile.surfaces],
    surfaceVersionApplicability: surfaceVersionsFor(profile.surfaces),
    dataBoundary: profile.dataBoundary,
    configurationScope: profile.configurationScope,
    documentedBehavior,
    observedBehavior,
    evidenceState,
    retentionOrContinuityLimit: nonEmpty(input.retentionOrContinuityLimit)
      ? redact(input.retentionOrContinuityLimit)
      : profile.retentionOrContinuityLimit,
    maximumConcurrency,
    iterationCeiling,
    manualFallback: profile.manualFallback,
    disposition,
    status,
    validationAction: profile.validationAction,
    validationRunRefs,
    ownerApprovalRef,
    rollbackPath,
    provenance,
    ...(flags ? { crewBehaviorFlags: flags } : {}),
    incompatibleBehaviors,
    knownGapRefs: unique(knownGapRefs),
    blockers: unique(blockers),
  };

  const disp = dispositionRecordFor(record, profile, knownGapRefs);
  return { record, disposition: disp };
}

function approvalBoundaryFor(record: ContinuityCapabilityRecord, profile: CapabilityProfile): Identifier | "no_boundary" {
  if (isCrewKind(record.kind)) return "approval-boundary:OD-04";
  if (profile.gatingDecision) return `approval-boundary:${profile.gatingDecision}`;
  return "no_boundary";
}

function dispositionRecordFor(
  record: ContinuityCapabilityRecord,
  profile: CapabilityProfile,
  knownGapRefs: readonly string[],
): CapabilityDispositionRecord {
  const noChange = record.disposition === "retain" || record.disposition === "observe";
  return {
    capabilityId: record.capabilityId,
    kind: record.kind === "subagent_dag" ? "Subagent" : "Tool_Surface",
    name: record.name,
    disposition: record.disposition,
    configurationScope: record.configurationScope,
    canonicalSource: canonicalSourceFor(record.kind),
    surfaceVersionApplicability: record.surfaceVersionApplicability,
    activationCondition: record.validationAction,
    owner: CONTINUITY_OWNER,
    approvalBoundaryRef: approvalBoundaryFor(record, profile),
    evidenceRefs: unique([`evidence:${record.capabilityId}:provenance`, ...record.validationRunRefs, ...knownGapRefs]),
    validationAction: record.validationAction,
    expectedSideEffects: expectedSideEffectsFor(record),
    rollbackPath: noChange && record.validationRunRefs.length === 0 && record.disposition === "retain"
      ? "no rollback applies"
      : record.rollbackPath,
    reason: record.blockers.length > 0 ? record.blockers.join("; ") : `${record.name} recorded as ${record.disposition}`,
    knownGapRefs: unique(knownGapRefs),
  };
}

function canonicalSourceFor(kind: ContinuityCapabilityKind): RepositoryPath {
  if (kind === "ltm_capture") return LTM_HOOK_PATH;
  if (kind === "graph_impact_automation") return GRAPH_IMPACT_SCRIPT;
  if (kind === "specification_workflow") return ".kiro/specs";
  return "docs/architecture/product-map.md";
}

function expectedSideEffectsFor(record: ContinuityCapabilityRecord): readonly string[] {
  if (isCrewKind(record.kind)) {
    return ["no Cloud/Crew execution; documentation is non-execution evidence"];
  }
  if (record.kind === "ltm_capture") {
    return ["no capture while the command is a stub; the hook stays disabled"];
  }
  if (record.kind === "graph_impact_automation") {
    return [`automation is bounded to ${GRAPH_IMPACT_MAX_ITERATIONS} iterations; the manual loop is the fallback`];
  }
  return ["no capability activation or external routing from static classification"];
}

/**
 * Ensure every continuity family is present exactly once, seeding defaults for
 * any the caller did not supply.  This keeps local, CLI-session, and Crew
 * records separate and always emits the disabled LTM record.
 */
function withRequiredContinuityFamilies(
  supplied: readonly ContinuityCapabilityInput[],
  ltmCaptureIsStub: boolean | undefined,
): ContinuityCapabilityInput[] {
  const byKind = new Map<ContinuityCapabilityKind, ContinuityCapabilityInput>();
  for (const entry of supplied) {
    if (!byKind.has(entry.kind)) byKind.set(entry.kind, entry);
  }
  for (const kind of CONTINUITY_CAPABILITY_KINDS) {
    if (byKind.has(kind)) continue;
    const seed: ContinuityCapabilityInput = { kind };
    if (kind === "ltm_capture") {
      byKind.set(kind, { ...seed, captureCommandIsStub: ltmCaptureIsStub ?? true });
    } else {
      byKind.set(kind, seed);
    }
  }
  // Preserve the canonical continuity order, then append any extra execution
  // capabilities the caller supplied.
  const ordered: ContinuityCapabilityInput[] = CONTINUITY_CAPABILITY_KINDS.map((kind) => {
    const entry = byKind.get(kind);
    if (entry) return entry;
    return { kind } satisfies ContinuityCapabilityInput;
  });
  for (const entry of supplied) {
    if (isContinuityKind(entry.kind)) continue;
    ordered.push(entry);
  }
  return ordered;
}

function evaluateInternal(input: ContinuityEvaluatorInput = {}): StageResult<ContinuityEvaluationResult> {
  const root = input.repositoryRoot ?? REPOSITORY_ROOT;
  const context: EvaluationContext = {
    repositoryRoot: root,
    ownerDecisions: input.ownerDecisions ?? [],
    knownGaps: [],
    policyViolations: [],
    blockers: [],
  };

  const capabilities = withRequiredContinuityFamilies(input.capabilities ?? [], input.ltmCaptureIsStub);
  const records: ContinuityCapabilityRecord[] = [];
  const dispositions: CapabilityDispositionRecord[] = [];
  const seen = new Set<string>();

  for (const capability of capabilities) {
    const capabilityId = `capability:continuity:${slug(capability.kind)}`;
    if (seen.has(capabilityId)) continue;
    seen.add(capabilityId);
    const { record, disposition } = evaluateCapability(capability, context);
    records.push(record);
    dispositions.push(disposition);
    context.blockers.push(...record.blockers.map((blocker) => `${record.name}: ${blocker}`));
  }

  const continuityRecords = records.filter((record) => isContinuityKind(record.kind));
  const executionRecords = records.filter((record) => !isContinuityKind(record.kind));

  const output: ContinuityEvaluationResult = {
    records,
    continuityRecords,
    executionRecords,
    dispositions,
    knownGaps: context.knownGaps,
    policyViolations: uniqueStrings(context.policyViolations),
    blockers: uniqueStrings(context.blockers),
    externalRoutingAttempted: false,
  };

  const allBlockers = uniqueStrings([...context.blockers, ...context.policyViolations]);
  const evidenceRefs = unique([
    ...records.map((record) => `evidence:${record.capabilityId}:provenance`),
    ...context.knownGaps.map((gap) => gap.gapId),
  ]);

  if (allBlockers.length === 0) {
    return { status: "pass", output, blockers: [], evidenceRefs };
  }
  return { status: "partial", output, blockers: allBlockers, evidenceRefs };
}

export function evaluateContinuity(input: ContinuityEvaluatorInput = {}): StageResult<ContinuityEvaluationResult> {
  return evaluateInternal(input);
}

export class ContinuityEvaluator {
  evaluate(input: ContinuityEvaluatorInput = {}): StageResult<ContinuityEvaluationResult> {
    return evaluateInternal(input);
  }
}

export const continuityEvaluator = new ContinuityEvaluator();
export const assessContinuity = evaluateContinuity;
export default continuityEvaluator;
