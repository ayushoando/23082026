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
  | "responsive"
  | "touch"
  | "keyboard"
  | "api"
  | "persistence"
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
  readonly unverifiedBehavior?: string;
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

function normalizeRepositoryPath(path: string): string {
  return path.split("\\").join("/");
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

function isTestFile(path: string): boolean {
  return /\.(?:test|spec)\.tsx?$/.test(path);
}

function isBrowserTestPath(path: string): boolean {
  return path.startsWith("tests/e2e/") && path.endsWith(".spec.ts") ||
    path.startsWith("tests/e2e/") && path.endsWith(".spec.tsx");
}

function selectTestPaths(
  paths: readonly string[],
  predicate: (path: string) => boolean,
  fallback: string,
): string[] {
  const selected = paths.filter(predicate);
  return selected.length > 0 ? selected : [fallback];
}

function vitestCommand(paths: readonly string[]): string {
  return `pnpm exec vitest run --config tests/vitest.config.ts ${paths.map(quotePath).join(" ")}`;
}

function playwrightCommand(
  paths: readonly string[],
  project: string,
  grep?: string,
): string {
  const grepArgument = grep ? ` --grep="${grep}"` : "";
  return `pnpm exec playwright test -c config/build/playwright.config.ts ${paths.map(quotePath).join(" ")}${grepArgument} --project=${project}`;
}

interface ActionDraft {
  readonly baseId: string;
  readonly findingIds: Set<string>;
  readonly kind: ValidationKind;
  readonly target: ValidationTarget;
  readonly exactCommand: string;
  readonly verifies: string;
  readonly hosted: boolean;
}

function addAction(
  drafts: Map<string, ActionDraft>,
  findingId: string,
  input: Omit<ActionDraft, "findingIds">,
): void {
  const key = [
    input.baseId,
    input.kind,
    input.target,
    input.exactCommand,
    input.hosted ? "hosted" : "repository",
  ].join("\u0000");
  const existing = drafts.get(key);
  if (existing) {
    existing.findingIds.add(findingId);
    return;
  }
  drafts.set(key, { ...input, findingIds: new Set([findingId]) });
}

function finalizeActions(drafts: Map<string, ActionDraft>): PlannedValidationAction[] {
  const groups = Array.from(drafts.values()).sort((left, right) =>
    left.baseId.localeCompare(right.baseId) || left.exactCommand.localeCompare(right.exactCommand),
  );
  const occurrences = new Map<string, number>();
  return groups
    .map((draft) => {
      const occurrence = (occurrences.get(draft.baseId) ?? 0) + 1;
      occurrences.set(draft.baseId, occurrence);
      const id = occurrence === 1 ? draft.baseId : `${draft.baseId}-${occurrence}`;
      return action(
        id,
        Array.from(draft.findingIds),
        draft.kind,
        draft.target,
        draft.exactCommand,
        draft.verifies,
        draft.hosted,
      );
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

const FORK_PATH_PATTERN = /^site\/(?:app\/(?:ooplanner|oostudio|api\/(?:Planner|Studio))|(?:features|components|lib|hooks|store|server|platform)\/(?:Planner|Studio)|focss\/(?:planner|studio))(?:\/|$)/;
const FOCSS_PATH_PATTERN = /^site\/focss\/(?:planner|studio)(?:\/|$)/;
const PLANNER_UI_STYLE_PATH_PATTERN = /^site\/(?:app\/ooplanner|features\/Planner|components\/Planner|focss\/planner|app\/oostudio|features\/Studio|components\/Studio|focss\/studio)(?:\/|$)/;

export function derivePlannerValidationManifest(
  findings: readonly PlannerValidationFindingInput[],
): PlannedValidationAction[] {
  const drafts = new Map<string, ActionDraft>();

  for (const finding of findings) {
    const findingId = finding.id;
    const paths = uniqueSorted(finding.changedPaths.map(normalizeRepositoryPath));
    const categories = new Set(finding.categories);
    const targetedTests = uniqueSorted(
      (finding.targetedTestPaths ?? []).map(normalizeRepositoryPath),
    );

    const plannerForkChanged = hasPath(paths, (path) => FORK_PATH_PATTERN.test(path));
    const focssChanged = hasPath(paths, (path) => FOCSS_PATH_PATTERN.test(path));
    const plannerUiStyleChanged = hasPath(paths, (path) => PLANNER_UI_STYLE_PATH_PATTERN.test(path));
    const implementationChanged = hasPath(paths, (path) =>
      /^(?:site|plans)\/.*\.(?:ts|tsx|mts|cts)$/.test(path),
    );
    const testsChanged = hasPath(paths, (path) =>
      /^tests\/.*\.(?:ts|tsx|mts|cts)$/.test(path),
    );
    const apiChanged = hasPath(paths, (path) =>
      /^site\/app\/api\/Planner(?:\/|$)/.test(path) ||
      /^site\/server\/Planner\/.*(?:route|api|request)/i.test(path),
    );
    const persistenceChanged = hasPath(paths, (path) =>
      /^site\/(?:lib|server)\/Planner\/.*(?:persistence|repository|adapter|project(?:Operations|Repository))/i.test(path),
    );
    const adminMigrationChanged = hasPath(paths, (path) =>
      /^site\/platform\/supabase\/migrations\.admin\/.*\.sql$/.test(path),
    );

    const unitTests = selectTestPaths(
      targetedTests,
      (path) => path.includes("/unit/") && path.endsWith(".test.ts") ||
        path.includes("/unit/") && path.endsWith(".test.tsx"),
      "tests/unit/planner",
    );
    const integrationTests = selectTestPaths(
      targetedTests,
      (path) => path.includes("/integration/") && isTestFile(path),
      "tests/integration/planner",
    );
    const browserTests = selectTestPaths(
      targetedTests,
      (path) => isBrowserTestPath(path) && !path.includes("performance"),
      "tests/e2e/planner-comprehensive-audit-regression.spec.ts",
    );
    const accessibilityTests = selectTestPaths(
      targetedTests,
      (path) => isBrowserTestPath(path) && /accessibility|a11y/i.test(path),
      browserTests[0] ?? "tests/e2e/accessibility.spec.ts",
    );
    const apiTests = selectTestPaths(
      targetedTests,
      (path) => isTestFile(path) && /(?:\/api\/|\/server\/Planner\/)/i.test(path),
      integrationTests[0] ?? "tests/integration/planner",
    );
    const persistenceTests = selectTestPaths(
      targetedTests,
      (path) => isTestFile(path) && /(?:persistence|repository|adapter|plannerWorkstream5Regression)/i.test(path),
      integrationTests[0] ?? "tests/integration/planner",
    );

    if (plannerForkChanged || categories.has("fork")) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:fork-boundary",
        kind: "fork-boundary",
        target: "repository",
        exactCommand: "pnpm run scan:boundaries",
        verifies: "Planner and Studio fork imports remain isolated.",
        hosted: false,
      });
    }
    if (focssChanged || plannerUiStyleChanged || categories.has("focss")) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:focss",
        kind: "focss",
        target: "repository",
        exactCommand: "pnpm run verify:focss",
        verifies: "Planner FOCSS structure remains valid.",
        hosted: false,
      });
      addAction(drafts, findingId, {
        baseId: "validation:w5:ui-lint",
        kind: "focss",
        target: "repository",
        exactCommand: "pnpm run lint:ui:strict",
        verifies: "Planner UI contract lint remains valid.",
        hosted: false,
      });
      addAction(drafts, findingId, {
        baseId: "validation:w5:style-tokens",
        kind: "focss",
        target: "repository",
        exactCommand: "pnpm run check:style-tokens",
        verifies: "Planner styles use approved tokens.",
        hosted: false,
      });
    }
    if (implementationChanged || categories.has("type")) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:typecheck",
        kind: "type",
        target: "repository",
        exactCommand: "pnpm run typecheck",
        verifies: "Application TypeScript changes compile.",
        hosted: false,
      });
    }
    if (testsChanged) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:test-typecheck",
        kind: "type",
        target: "repository",
        exactCommand: "pnpm run typecheck:tests",
        verifies: "Authored test TypeScript changes compile.",
        hosted: false,
      });
    }

    if (unitTests.length > 0 && (categories.has("unit") || targetedTests.some((path) => path.includes("/unit/")))) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:unit",
        kind: "unit",
        target: "repository",
        exactCommand: vitestCommand(unitTests),
        verifies: "Targeted Workstream 5 unit regressions.",
        hosted: false,
      });
    }
    if (integrationTests.length > 0 && (categories.has("integration") || targetedTests.some((path) => path.includes("/integration/")))) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:integration",
        kind: "integration",
        target: "integration",
        exactCommand: vitestCommand(integrationTests),
        verifies: "Targeted Planner integration regressions.",
        hosted: false,
      });
    }
    if (categories.has("browser")) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:browser",
        kind: "browser",
        target: "browser",
        exactCommand: playwrightCommand(browserTests, "chromium-desktop"),
        verifies: "Targeted rendered Planner regressions.",
        hosted: false,
      });
    }
    if (categories.has("accessibility") || accessibilityTests.some((path) => /accessibility|a11y/i.test(path))) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:accessibility",
        kind: "accessibility",
        target: "browser",
        exactCommand: playwrightCommand(accessibilityTests, "chromium-desktop", "accessib|a11y|contrast|reflow|WCAG"),
        verifies: "Targeted Planner accessibility and WCAG behavior.",
        hosted: false,
      });
    }
    if (categories.has("responsive")) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:responsive",
        kind: "responsive",
        target: "browser",
        exactCommand: playwrightCommand(browserTests, "chromium-desktop", "resize|orientation|reflow|reduced motion"),
        verifies: "Planner desktop, tablet, and phone layout context survives resize and orientation changes.",
        hosted: false,
      });
    }
    if (categories.has("touch")) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:touch",
        kind: "touch",
        target: "browser",
        exactCommand: playwrightCommand(browserTests, "chromium-mobile", "touch"),
        verifies: "Planner touch controls provide the required workflow outcome.",
        hosted: false,
      });
    }
    if (categories.has("keyboard")) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:keyboard",
        kind: "keyboard",
        target: "browser",
        exactCommand: playwrightCommand(browserTests, "chromium-tablet", "keyboard|focus"),
        verifies: "Planner keyboard traversal, focus movement, and focus restoration remain operable.",
        hosted: false,
      });
    }
    if (categories.has("api") || apiChanged) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:api",
        kind: "api",
        target: "integration",
        exactCommand: vitestCommand(apiTests),
        verifies: "Planner API contracts and request-processing behavior remain valid.",
        hosted: false,
      });
    }
    if (categories.has("persistence") || persistenceChanged) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:persistence",
        kind: "persistence",
        target: "integration",
        exactCommand: vitestCommand(persistenceTests),
        verifies: "Planner persistence selection, revision, idempotency, and adapter behavior remain valid.",
        hosted: false,
      });
    }
    if (categories.has("performance")) {
      const performanceTests = selectTestPaths(
        targetedTests,
        (path) => isBrowserTestPath(path) && path.includes("performance"),
        "tests/e2e/planner-performance-required.spec.ts",
      );
      addAction(drafts, findingId, {
        baseId: "validation:w5:performance",
        kind: "performance",
        target: "browser",
        exactCommand: playwrightCommand(performanceTests, "chromium-desktop"),
        verifies: "Required supported-profile Planner measurements.",
        hosted: false,
      });
    }
    if (adminMigrationChanged || categories.has("migration")) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:migration-dry-run",
        kind: "migration",
        target: "hosted",
        exactCommand: "pnpm run db:apply:admin -- --dry",
        verifies: "Admin migration dry-run.",
        hosted: true,
      });
      addAction(drafts, findingId, {
        baseId: "validation:w5:admin-types",
        kind: "migration",
        target: "hosted",
        exactCommand: "pnpm run db:types:admin",
        verifies: "Admin generated types after separately authorized application.",
        hosted: true,
      });
    }
    if (finding.requiresFullGate || categories.has("full-gate")) {
      addAction(drafts, findingId, {
        baseId: "validation:w5:full-gate",
        kind: "full-gate",
        target: "repository",
        exactCommand: "pnpm run gate",
        verifies: "Final repository ship bar.",
        hosted: false,
      });
    }
  }

  return finalizeActions(drafts);
}

export function isValidationExecutionEligible(
  userAuthorization: UserAuthorizationState,
  hookPermission: HookPermissionState,
): boolean {
  return userAuthorization === "authorized" && hookPermission === "permitted";
}

function pendingLimitation(action: PlannedValidationAction): string {
  const executionBoundary = action.hosted
    ? "Hosted or separately authorized work remains unexecuted."
    : "Protected validation remains unexecuted.";
  return `${executionBoundary} Unverified behavior: ${action.verifies} No pass or fail is claimed.`;
}

function observedLimitation(observation: ValidationExecutionObservation): string {
  const outputLimitation = observation.outputLimitation.trim() || "Command output was not retained beyond the execution record.";
  const unverifiedBehavior = observation.unverifiedBehavior?.trim() ||
    "Behavior outside the selected command and evidence scope remains unverified.";
  return `${outputLimitation} Unverified behavior: ${unverifiedBehavior}`;
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
      limitation: pendingLimitation(input.action),
      state: "pending",
      exactCommand: input.action.hosted ? null : input.action.exactCommand,
      pendingOwnerAction: input.action.hosted
        ? `Separately authorize and execute: ${input.action.exactCommand}`
        : null,
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
    limitation: observedLimitation(input.observation),
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
    "plans/audit/28-canvas-features-logic/validationEvidence.ts",
    "tests/unit/planner/plannerValidationEvidence.property.test.ts",
  ],
  limitation: "Static inspection does not execute or establish any validation, browser, hosted, or deployment outcome.",
  artifact: { authorship: "authored", path: "plans/audit/28-canvas-features-logic/validationEvidence.ts" },
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
