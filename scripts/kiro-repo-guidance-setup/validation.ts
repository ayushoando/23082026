import {
  REPOSITORY_ROOT,
  type ExecutionLayer,
  type Identifier,
  type KiroSurface,
  type StageResult,
  type ValidationRequest,
  type ValidationResult,
  type ValidationRun,
  type VitestLaneResults,
  type ValidationRunner as ValidationRunnerContract,
} from "./contracts";

export type ValidationGateKind =
  | "artifact"
  | "repository"
  | "focused"
  | "fast"
  | "two-lane test"
  | "ship"
  | "surface"
  | "security"
  | "rollback"
  | "handover";

export const VALIDATION_GATE_KINDS = [
  "artifact",
  "repository",
  "focused",
  "fast",
  "two-lane test",
  "ship",
  "surface",
  "security",
  "rollback",
  "handover",
] as const satisfies readonly ValidationGateKind[];

export const VALIDATION_GATE_ACTIONS = {
  artifact: "artifact",
  repository: "repository",
  focused: "focused",
  fast: "fast",
  "two-lane test": "two-lane test",
  ship: "ship",
  surface: "surface",
  security: "security",
  rollback: "rollback",
  handover: "handover",
} as const satisfies Readonly<Record<ValidationGateKind, string>>;

export type GateAdapterInput<TKind extends ValidationGateKind = ValidationGateKind> =
  Omit<ValidationRequest, "action"> & { readonly gate: TKind };

export interface TypedGateAdapter<TKind extends ValidationGateKind> {
  readonly kind: TKind;
  adapt(input: GateAdapterInput<TKind>): ValidationRequest;
}

export type ValidationGateAdapters = {
  readonly [TKind in ValidationGateKind]: TypedGateAdapter<TKind>;
};

function createGateAdapter<TKind extends ValidationGateKind>(
  kind: TKind,
): TypedGateAdapter<TKind> {
  return {
    kind,
    adapt(input: GateAdapterInput<TKind>): ValidationRequest {
      const { gate: _gate, ...request } = input;
      return {
        ...request,
        action: VALIDATION_GATE_ACTIONS[kind],
      };
    },
  };
}

export const validationGateAdapters: ValidationGateAdapters = {
  artifact: createGateAdapter("artifact"),
  repository: createGateAdapter("repository"),
  focused: createGateAdapter("focused"),
  fast: createGateAdapter("fast"),
  "two-lane test": createGateAdapter("two-lane test"),
  ship: createGateAdapter("ship"),
  surface: createGateAdapter("surface"),
  security: createGateAdapter("security"),
  rollback: createGateAdapter("rollback"),
  handover: createGateAdapter("handover"),
};

export function adaptValidationGate<TKind extends ValidationGateKind>(
  input: GateAdapterInput<TKind>,
): ValidationRequest {
  return validationGateAdapters[input.gate].adapt(input);
}

export interface ValidationExecutionRequest extends ValidationRequest {
  readonly validationId: Identifier;
  readonly startedAtUtc: string;
}

export interface ValidationExecutionResult {
  readonly result: ValidationResult;
  readonly exitCodeOrOutcome: string;
  readonly evidenceRefs?: readonly Identifier[];
  readonly unverifiedItems?: readonly string[];
  readonly blocker?: string;
  readonly laneResults?: VitestLaneResults;
  readonly postChangeArtifactHash?: string;
  readonly limitation?: string;
  readonly interrupted?: boolean;
}

export type ValidationExecutor = (
  input: ValidationExecutionRequest,
) => ValidationExecutionResult;

export interface ValidationRunnerOptions {
  readonly execute: ValidationExecutor;
  readonly now?: () => Date;
  readonly createValidationId?: (input: ValidationRequest) => Identifier;
}

const KNOWN_SURFACES: readonly KiroSurface[] = [
  "IDE",
  "CLI 2.x",
  "CLI 3.x",
  "Web",
  "Mobile",
  "Cloud/Crew",
  "Local_Repository_Surface",
];

const DEFAULT_EXECUTION_LAYER_BY_GATE: Readonly<Record<ValidationGateKind, ExecutionLayer>> = {
  artifact: "default_native_task",
  repository: "default_native_task",
  focused: "default_native_task",
  fast: "default_native_task",
  "two-lane test": "default_native_task",
  ship: "default_native_task",
  surface: "surface_validation",
  security: "surface_validation",
  rollback: "surface_validation",
  handover: "default_native_task",
};

function isKnownSurface(value: string): value is KiroSurface {
  return KNOWN_SURFACES.includes(value as KiroSurface);
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(nonEmpty))];
}

function stableId(input: ValidationRequest): Identifier {
  const action = input.action.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
  const scope = input.scope.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
  return `validation-${action || "run"}-${scope || "scope"}`;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && nonEmpty(error.message)) return error.message;
  if (typeof error === "string" && nonEmpty(error)) return error;
  return "validation executor failed without a readable error";
}

function validateRequest(input: ValidationRequest): string[] {
  const blockers: string[] = [];

  if (!nonEmpty(input.action)) blockers.push("validation action is required");
  if (!nonEmpty(input.version)) blockers.push("validation version is required");
  if (!nonEmpty(input.scope)) blockers.push("validation scope is required");
  if (!nonEmpty(input.commandOrInteraction)) blockers.push("command or interaction is required");
  if (!isKnownSurface(input.surface)) blockers.push("validation surface is unknown");
  if (!nonEmpty(input.executionLayer)) blockers.push("validation execution layer is required");

  const target = input.repositoryRootOrActiveSurface;
  if (isKnownSurface(target)) {
    if (target !== input.surface) {
      blockers.push("repositoryRootOrActiveSurface and surface identify different targets");
    }
  } else if (target !== REPOSITORY_ROOT) {
    blockers.push(`validation must run from repository root ${REPOSITORY_ROOT}`);
  }

  return blockers;
}

function normalizedLaneResults(
  action: string,
  result: ValidationExecutionResult,
): { laneResults?: VitestLaneResults; missingLanes: string[] } {
  if (action !== VALIDATION_GATE_ACTIONS["two-lane test"]) {
    return { laneResults: result.laneResults, missingLanes: [] };
  }

  const laneResults = result.laneResults;
  const missingLanes: string[] = [];
  if (!laneResults?.defaultVitest) missingLanes.push("default Vitest lane");
  if (!laneResults?.techDocsVitest) missingLanes.push("tech-docs Vitest lane");
  return { laneResults, missingLanes };
}

function laneResultStatus(laneResults: VitestLaneResults | undefined): ValidationResult | null {
  if (!laneResults?.defaultVitest || !laneResults.techDocsVitest) return null;

  const lanes = [laneResults.defaultVitest, laneResults.techDocsVitest];
  if (lanes.some((lane) => lane.result === "fail")) return "fail";
  if (lanes.some((lane) => lane.result === "blocked" || lane.result === "not_run")) {
    return "blocked";
  }
  if (lanes.some((lane) => lane.result === "partial")) return "partial";
  return "pass";
}

function normalizeExecution(
  request: ValidationRequest,
  execution: ValidationExecutionResult,
  laneResults: VitestLaneResults | undefined,
  missingLanes: readonly string[],
): {
  result: ValidationResult;
  blocker: string;
  unverifiedItems: readonly string[];
} {
  const unverifiedItems = unique(execution.unverifiedItems ?? []);
  const blockers: string[] = [];
  let result = execution.result;

  if (missingLanes.length > 0) {
    result = "blocked";
    blockers.push(`two-lane test is incomplete; missing ${missingLanes.join(" and ")}`);
  }

  const laneStatus = laneResultStatus(laneResults);
  if (request.action === VALIDATION_GATE_ACTIONS["two-lane test"] && laneStatus) {
    result = laneStatus;
    if (laneStatus !== "pass") blockers.push("at least one Vitest lane did not pass");
  }

  if (execution.interrupted) {
    result = "partial";
    blockers.push("validation was interrupted before completion");
  }

  if (execution.blocker && execution.blocker !== "none") {
    blockers.push(execution.blocker);
    if (result === "pass") result = "blocked";
  }
  if (unverifiedItems.length > 0 && result === "pass") result = "blocked";
  if (result === "fail") blockers.push("validation command failed");
  if (result === "blocked") blockers.push("validation was blocked");
  if (result === "partial") blockers.push("validation completed only partially");
  if (result === "not_run") blockers.push("validation was not run");
  if (unverifiedItems.length > 0) blockers.push("validation has unverified items");

  return {
    result,
    blocker: unique(blockers).join("; ") || "none",
    unverifiedItems,
  };
}

export class ValidationRunnerService implements ValidationRunnerContract {
  private readonly execute: ValidationExecutor;
  private readonly now: () => Date;
  private readonly createValidationId: (input: ValidationRequest) => Identifier;

  public constructor(options: ValidationRunnerOptions) {
    this.execute = options.execute;
    this.now = options.now ?? (() => new Date());
    this.createValidationId = options.createValidationId ?? stableId;
  }

  public run(input: ValidationRequest): StageResult<ValidationRun> {
    const requestBlockers = validateRequest(input);
    if (requestBlockers.length > 0) {
      return {
        status: "blocked",
        blockers: requestBlockers,
        evidenceRefs: [],
      };
    }

    const startedAt = this.now();
    if (Number.isNaN(startedAt.getTime())) {
      return {
        status: "blocked",
        blockers: ["validation clock returned an invalid UTC date"],
        evidenceRefs: [],
      };
    }

    const validationId = this.createValidationId(input);
    if (!nonEmpty(validationId)) {
      return {
        status: "blocked",
        blockers: ["validation runner could not create a stable validationId"],
        evidenceRefs: [],
      };
    }

    const executionInput: ValidationExecutionRequest = {
      ...input,
      validationId,
      startedAtUtc: startedAt.toISOString(),
    };

    let execution: ValidationExecutionResult;
    try {
      execution = this.execute(executionInput);
    } catch (error: unknown) {
      const message = errorMessage(error);
      const evidenceRef = `validation:${validationId}`;
      const run: ValidationRun = {
        ...input,
        validationId,
        startedAtUtc: executionInput.startedAtUtc,
        result: "partial",
        exitCodeOrOutcome: message,
        evidenceRefs: [evidenceRef],
        unverifiedItems: ["the validation executor did not return a completed result"],
        blocker: `validation executor failed: ${message}`,
        limitation: "The run was interrupted or failed before a complete result was available.",
      };
      return {
        status: "partial",
        output: run,
        blockers: [run.blocker],
        evidenceRefs: run.evidenceRefs,
      };
    }

    const { laneResults, missingLanes } = normalizedLaneResults(input.action, execution);
    const normalized = normalizeExecution(input, execution, laneResults, missingLanes);
    const evidenceRefs = unique([
      `validation:${validationId}`,
      ...(execution.evidenceRefs ?? []),
    ]);
    const run: ValidationRun = {
      ...input,
      validationId,
      startedAtUtc: executionInput.startedAtUtc,
      result: normalized.result,
      exitCodeOrOutcome: nonEmpty(execution.exitCodeOrOutcome)
        ? execution.exitCodeOrOutcome
        : "no execution outcome was returned",
      evidenceRefs,
      unverifiedItems: normalized.unverifiedItems,
      blocker: normalized.blocker,
      ...(execution.laneResults ? { laneResults } : {}),
      ...(execution.postChangeArtifactHash
        ? { postChangeArtifactHash: execution.postChangeArtifactHash }
        : {}),
      ...(execution.limitation ? { limitation: execution.limitation } : {}),
    };

    if (normalized.result === "pass") {
      return {
        status: "pass",
        output: run,
        blockers: [],
        evidenceRefs,
      };
    }

    return {
      status: normalized.result,
      output: run,
      blockers: [run.blocker],
      evidenceRefs,
    };
  }
}

export function createValidationRunner(
  options: ValidationRunnerOptions,
): ValidationRunnerContract {
  return new ValidationRunnerService(options);
}

export function createDefaultGateRequest<TKind extends ValidationGateKind>(
  input: Omit<GateAdapterInput<TKind>, "executionLayer"> & {
    readonly gate: TKind;
    readonly executionLayer?: ExecutionLayer;
  },
): ValidationRequest {
  const adapted = adaptValidationGate({
    ...input,
    executionLayer:
      input.executionLayer ?? DEFAULT_EXECUTION_LAYER_BY_GATE[input.gate],
  });
  return adapted;
}

export const DEFAULT_VALIDATION_RUNNER = {
  gateKinds: VALIDATION_GATE_KINDS,
  adapters: validationGateAdapters,
  create: createValidationRunner,
} as const;
