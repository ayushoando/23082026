import type {
  EvidenceClass,
  EvidenceRecord,
  HookPermissionState,
  RequirementRef,
  UserAuthorizationState,
  ValidationKind,
  ValidationRecord,
  ValidationTarget,
} from "./auditModel";

export const TASK_5_11_REQUIREMENTS = [
  "18.1", "18.2", "18.3", "18.4", "18.5", "18.6", "18.7", "18.8", "18.9",
  "19.4", "19.5", "19.6",
] as const satisfies readonly RequirementRef[];

export type PlannerValidationCategory =
  | "unit"
  | "integration"
  | "browser"
  | "accessibility"
  | "performance"
  | "fork"
  | "focss"
  | "type"
  | "migration"
  | "full-gate";

export interface PlannerValidationFindingInput {
  readonly id: string;
  readonly changedPaths: readonly string[];
  readonly categories: readonly PlannerValidationCategory[];
  readonly targetedTestPaths?: readonly string[];
  readonly requiresFullGate?: boolean;
}

export interface PlannedValidationAction {
  readonly id: string;
  readonly findingIds: readonly string[];
  readonly kind: ValidationKind;
  readonly target: ValidationTarget;
  readonly exactCommand: string;
  readonly hosted: boolean;
  readonly verifies: string;
}

export interface ValidationExecutionObservation {
  readonly exitStatus: number;
  readonly outcome: "acceptable" | "unacceptable";
  readonly evidenceRefs: readonly string[];
  readonly outputLimitation: string;
}

export interface RecordValidationInput {
  readonly action: PlannedValidationAction;
  readonly userAuthorization: UserAuthorizationState;
  readonly hookPermission: HookPermissionState;
  readonly observation?: ValidationExecutionObservation;
}

export const FORBIDDEN_VALIDATION_COMMANDS = ["pnpm run typecheck:scripts"] as const;

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function quotePath(path: string): string {
  if (!/^[A-Za-z0-9_./()\[\]-]+$/.test(path)) {
    throw new Error(`Unsafe validation path: ${path}`);
  }
  return `"${path}"`;
}

function action(
  id: string,
  findingIds: readonly string[],
  kind: ValidationKind,
  target: ValidationTarget,
  exactCommand: string,
  verifies: string,
  hosted = false,
): PlannedValidationAction {
  if (FORBIDDEN_VALIDATION_COMMANDS.some((forbidden) => exactCommand.includes(forbidden))) {
    throw new Error("typecheck:scripts is unavailable and must not enter a validation plan");
  }
  return { id, findingIds: uniqueSorted(findingIds), kind, target, exactCommand, hosted, verifies };
}

function hasPath(paths: readonly string[], predicate: (path: string) => boolean): boolean {
  return paths.some(predicate);
}

export function derivePlannerValidationManifest(
  findings: readonly PlannerValidationFindingInput[],
): PlannedValidationAction[] {
  const findingIds = uniqueSorted(findings.map((finding) => finding.id));
  const paths = uniqueSorted(findings.flatMap((finding) => finding.changedPaths));
  const categories = new Set(findings.flatMap((finding) => finding.categories));
  const targetedTests = uniqueSorted(
    findings.flatMap((finding) => finding.targetedTestPaths ?? []),
  );
  const actions: PlannedValidationAction[] = [];

  const plannerForkChanged = hasPath(paths, (path) =>
    /^site\/(?:app\/ooplanner|(?:components|lib|hooks|store|server)\/Planner)(?:\/|$)/.test(path),
  );
  const focssChanged = hasPath(paths, (path) => /^site\/focss\/planner(?:\/|$)/.test(path));
  const implementationChanged = hasPath(paths, (path) =>
    /^(?:site|plans)\/.*\.(?:ts|tsx)$/.test(path),
  );
  const testsChanged = hasPath(paths, (path) => /^tests\/.*\.(?:ts|tsx)$/.test(path));
  const adminMigrationChanged = hasPath(paths, (path) =>
    /^site\/platform\/supabase\/migrations\.admin\/.*\.sql$/.test(path),
  );

  if (plannerForkChanged || categories.has("fork")) {
    actions.push(action("validation:w5:fork-boundary", findingIds, "fork-boundary", "repository", "pnpm run scan:boundaries", "Planner and Studio fork imports remain isolated."));
  }
  if (focssChanged || categories.has("focss")) {
    actions.push(action("validation:w5:focss", findingIds, "focss", "repository", "pnpm run verify:focss", "Planner FOCSS structure remains valid."));
    actions.push(action("validation:w5:ui-lint", findingIds, "focss", "repository", "pnpm run lint:ui:strict", "Planner UI contract lint remains valid."));
    actions.push(action("validation:w5:style-tokens", findingIds, "focss", "repository", "pnpm run check:style-tokens", "Planner styles use approved tokens."));
  }
  if (implementationChanged || categories.has("type")) {
    actions.push(action("validation:w5:typecheck", findingIds, "type", "repository", "pnpm run typecheck", "Application TypeScript changes compile."));
  }
  if (testsChanged) {
    actions.push(action("validation:w5:test-typecheck", findingIds, "type", "repository", "pnpm run typecheck:tests", "Authored test TypeScript changes compile."));
  }

  const unitTests = targetedTests.filter((path) => path.includes("/unit/") && path.endsWith(".test.ts"));
  const integrationTests = targetedTests.filter((path) => path.includes("/integration/") && path.endsWith(".test.ts"));
  const browserTests = targetedTests.filter((path) =>
    path.includes("/e2e/") &&
    path.endsWith(".spec.ts") &&
    !path.includes("performance"),
  );
  if (unitTests.length > 0 || categories.has("unit")) {
    const selected = unitTests.length > 0 ? unitTests : ["tests/unit/planner"];
    actions.push(action("validation:w5:unit", findingIds, "unit", "repository", `pnpm exec vitest run --config tests/vitest.config.ts ${selected.map(quotePath).join(" ")}`, "Targeted Workstream 5 unit regressions."));
  }
  if (integrationTests.length > 0 || categories.has("integration")) {
    const selected = integrationTests.length > 0 ? integrationTests : ["tests/integration/planner"];
    actions.push(action("validation:w5:integration", findingIds, "integration", "integration", `pnpm exec vitest run --config tests/vitest.config.ts ${selected.map(quotePath).join(" ")}`, "Targeted Planner integration regressions."));
  }
  if (browserTests.length > 0 || categories.has("browser")) {
    const selected = browserTests.length > 0 ? browserTests : ["tests/e2e/planner-comprehensive-audit-regression.spec.ts"];
    actions.push(action("validation:w5:browser", findingIds, "browser", "browser", `pnpm exec playwright test -c config/build/playwright.config.ts ${selected.map(quotePath).join(" ")} --project=chromium-desktop`, "Targeted rendered Planner regressions."));
  }
  if (categories.has("accessibility")) {
    actions.push(action("validation:w5:accessibility", findingIds, "accessibility", "browser", "pnpm run test:a11y", "Planner accessibility behavior."));
  }
  if (categories.has("performance")) {
    actions.push(action("validation:w5:performance", findingIds, "performance", "browser", "pnpm exec playwright test -c config/build/playwright.config.ts \"tests/e2e/planner-performance-required.spec.ts\" --project=chromium-desktop", "Required supported-profile Planner measurements."));
  }
  if (adminMigrationChanged || categories.has("migration")) {
    actions.push(action("validation:w5:migration-dry-run", findingIds, "migration", "hosted", "pnpm run db:apply:admin -- --dry", "Admin migration dry-run.", true));
    actions.push(action("validation:w5:admin-types", findingIds, "migration", "hosted", "pnpm run db:types:admin", "Admin generated types after separately authorized application.", true));
  }
  if (findings.some((finding) => finding.requiresFullGate) || categories.has("full-gate")) {
    actions.push(action("validation:w5:full-gate", findingIds, "full-gate", "repository", "pnpm run gate", "Final repository ship bar."));
  }

  return actions.sort((left, right) => left.id.localeCompare(right.id));
}

export function isValidationExecutionEligible(
  userAuthorization: UserAuthorizationState,
  hookPermission: HookPermissionState,
): boolean {
  return userAuthorization === "authorized" && hookPermission === "permitted";
}

export function recordValidationEvidence(input: RecordValidationInput): ValidationRecord {
  const eligible = isValidationExecutionEligible(input.userAuthorization, input.hookPermission);
  if (!eligible || !input.observation) {
    return {
      id: input.action.id,
      findingIds: [...input.action.findingIds],
      kind: input.action.kind,
      target: input.action.target,
      repositoryRoot: ".",
      requirementRefs: [...TASK_5_11_REQUIREMENTS],
      verifies: input.action.verifies,
      limitation: input.action.hosted
        ? "Hosted action remains separately authorized and unexecuted; no result is claimed."
        : "Protected validation remains unexecuted; no pass or fail is claimed.",
      state: "pending",
      exactCommand: input.action.hosted ? null : input.action.exactCommand,
      pendingOwnerAction: input.action.hosted ? input.action.exactCommand : null,
      userAuthorization: input.userAuthorization,
      hookPermission: input.hookPermission,
      exitStatus: null,
      outcome: null,
      evidenceRefs: [],
    };
  }
  return {
    id: input.action.id,
    findingIds: [...input.action.findingIds],
    kind: input.action.kind,
    target: input.action.target,
    repositoryRoot: ".",
    requirementRefs: [...TASK_5_11_REQUIREMENTS],
    verifies: input.action.verifies,
    limitation: input.observation.outputLimitation,
    state: "observed",
    exactCommand: input.action.exactCommand,
    pendingOwnerAction: null,
    userAuthorization: "authorized",
    hookPermission: "permitted",
    exitStatus: input.observation.exitStatus,
    outcome: input.observation.outcome,
    evidenceRefs: [...input.observation.evidenceRefs],
  };
}

export type EvidenceOrigin = "static-inspection" | "browser-run" | "integration-run" | "hosted-inspection" | "deployment-smoke";

const ORIGIN_CLASS: Readonly<Record<EvidenceOrigin, EvidenceClass>> = {
  "static-inspection": "repository",
  "browser-run": "browser",
  "integration-run": "integration",
  "hosted-inspection": "hosted",
  "deployment-smoke": "deployment",
};

export function evidenceClassForOrigin(origin: EvidenceOrigin): EvidenceClass {
  return ORIGIN_CLASS[origin];
}

export function hasSeparatedEvidenceClass(
  record: EvidenceRecord,
  origin: EvidenceOrigin,
): boolean {
  return record.class === evidenceClassForOrigin(origin);
}

export const TASK_5_11_REPOSITORY_EVIDENCE: EvidenceRecord = {
  id: "evidence:task-5.11-validation-manifest-recorder",
  class: "repository",
  summary: "Pure authored code derives narrow checks from changed paths and records only permission-backed observed outcomes.",
  sourceRefs: [
    "plans/planner-comprehensive-audit/validationEvidence.ts",
    "tests/unit/planner/plannerValidationEvidence.property.test.ts",
  ],
  limitation: "Static inspection does not execute or establish any validation, browser, hosted, or deployment outcome.",
  artifact: { authorship: "authored", path: "plans/planner-comprehensive-audit/validationEvidence.ts" },
};

export const TASK_5_12_5_14_PENDING_VALIDATION: ValidationRecord = {
  id: "validation:tasks-5.12-5.14-validation-evidence-properties",
  findingIds: ["finding:workstream-5-authored-deliverables"],
  kind: "unit",
  target: "repository",
  repositoryRoot: ".",
  requirementRefs: [...TASK_5_11_REQUIREMENTS, "14.10", "17.7"],
  verifies:
    "Properties 27-29 enforce authorization gating, change-derived checks, unavailable-command exclusion, and exclusive evidence classes.",
  limitation:
    "The property specification is authored but unexecuted; no validation or evidence result is claimed.",
  state: "pending",
  exactCommand:
    "pnpm exec vitest run --config tests/vitest.config.ts tests/unit/planner/plannerValidationEvidence.property.test.ts",
  pendingOwnerAction: null,
  userAuthorization: "not-authorized",
  hookPermission: "not-observed",
  exitStatus: null,
  outcome: null,
  evidenceRefs: [],
};