// @vitest-environment node
//
// Feature: kiro-repo-guidance-setup, Property 15: Repository policy invariants
// survive every plan.
//
// Property 15 (design.md): "For all proposed commands, hooks, default/native
// task graphs, powers, agents, reviewers, and handover actions, the plan uses
// root-only `pnpm`, creates no worktree, activates at most one agent by
// default, does not write the production filesystem, uses mode-aware
// persistence without dual-write, preserves Admin/Products database routing,
// preserves Studio/Planner fork isolation, records both Vitest lanes, and
// includes the required repository gates. A plan may use more than one agent
// only when it is the exact OD-04 `Concurrent_Implementation_Wave` and
// satisfies Property 16; Crew and unrelated features never inherit that
// exception."
//
// Validates: Requirements 9.2, 11.6, 14.2, 14.5; Design: Correctness Property 15.
//
// SCOPE NOTE (Lane D ownership, test-authoring only): this file writes only
// under .kiro/kiro-repo-guidance-setup/tests/lane-d/**. It reads the frozen Lane B
// policy source (policy.ts) and shared contracts.ts (read-only). It mutates no
// source module, package.json, or results/. No filesystem, network, command,
// or configuration side effect occurs: `assessRepositoryPolicy` is a pure
// evaluator over an in-memory RepositoryPolicyRequest plus the frozen
// OWNER_DECISIONS ledger. Every plan is generated in memory; the assertions
// confirm the policy guard never allows a plan that violates an invariant.
//
// The invariant proof is driven over the plan inputs a Lane D coordinator
// hands to the policy guard (command working directory, package manager, agent
// count, feature-wave flag, worktree/hidden-spawn/retry/replan/auto-approval
// requests, Crew-execution request, production-filesystem write request,
// persistence mode, database route, Studio/Planner import request, explicit
// approval, required/completed gates, and the two Vitest lanes). fast-check
// drives >= 100 runs per property (numRuns: 200+).

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAX_ACTIVE_AGENTS,
  FEATURE_NAME,
  FEATURE_WAVE_MAX_ACTIVE_AGENTS,
  OWNER_DECISIONS,
  PACKAGE_MANAGER,
  REPOSITORY_ROOT,
  type OwnerDecision,
} from "../../contracts.ts";
import {
  assessRepositoryPolicy,
  REQUIRED_REPOSITORY_GATES,
  type DatabaseRoute,
  type PersistenceMode,
  type RepositoryPolicyRequest,
} from "../../policy.ts";

// The frozen OD-04 decision is owner-approved-conditional and resolved, so the
// ledger clears owner-decision validation and only the plan fields under test
// drive the outcome. A defensive copy keeps each run's input pristine.
function baseDecisions(): OwnerDecision[] {
  return OWNER_DECISIONS.map((decision) => ({ ...decision }));
}

// ---------------------------------------------------------------------------
// A "clean" plan: every repository invariant is satisfied. This is the only
// shape the guard is ever allowed to pass. All violation generators below are
// this clean base with exactly one invariant flipped.
// ---------------------------------------------------------------------------
function cleanPlan(overrides: Partial<RepositoryPolicyRequest> = {}): RepositoryPolicyRequest {
  return {
    workingDirectory: REPOSITORY_ROOT,
    packageManager: PACKAGE_MANAGER,
    activeAgentCount: DEFAULT_MAX_ACTIVE_AGENTS,
    explicitApprovalRecorded: true,
    persistenceMode: "mode-aware",
    databaseRoute: "Admin",
    requiredGates: [...REQUIRED_REPOSITORY_GATES],
    completedGates: [...REQUIRED_REPOSITORY_GATES],
    vitestLanes: { default: true, techDocs: true },
    ...overrides,
  };
}

const persistenceModeArb = fc.constantFrom<PersistenceMode>(
  "mode-aware",
  "raw-disk",
  "dual-write",
);
const databaseRouteArb = fc.constantFrom<DatabaseRoute>("Admin", "Products", "unknown");

// ---------------------------------------------------------------------------
// Property 15a: the guard NEVER passes a plan that violates any single
// invariant. Each generated plan is clean except for one flipped invariant,
// and the guard must report `blocked` with a matching blocker.
// ---------------------------------------------------------------------------

interface ViolationCase {
  readonly label: string;
  readonly overrides: Partial<RepositoryPolicyRequest>;
  readonly matcher: RegExp;
}

const singleViolationArb: fc.Arbitrary<ViolationCase> = fc.oneof(
  // Root-only command working directory.
  fc
    .string({ minLength: 1, maxLength: 12 })
    .filter((dir) => dir !== REPOSITORY_ROOT)
    .map((dir) => ({
      label: "non-root working directory",
      overrides: { workingDirectory: dir },
      matcher: /must run from/i,
    })),
  // Root-only pnpm.
  fc
    .constantFrom("npm", "yarn", "bun", "pnpx", "corepack")
    .map((pm) => ({
      label: "non-pnpm package manager",
      overrides: { packageManager: pm },
      matcher: /root-only pnpm/i,
    })),
  // No worktree.
  fc.constant({
    label: "worktree requested",
    overrides: { worktreeRequested: true } as Partial<RepositoryPolicyRequest>,
    matcher: /worktree/i,
  }),
  // No hidden spawning.
  fc.constant({
    label: "hidden spawning requested",
    overrides: { hiddenSpawningRequested: true } as Partial<RepositoryPolicyRequest>,
    matcher: /hidden spawning/i,
  }),
  // No automatic retry.
  fc.constant({
    label: "automatic retry requested",
    overrides: { automaticRetryRequested: true } as Partial<RepositoryPolicyRequest>,
    matcher: /automatic retr/i,
  }),
  // No automatic replan.
  fc.constant({
    label: "automatic replan requested",
    overrides: { automaticReplanRequested: true } as Partial<RepositoryPolicyRequest>,
    matcher: /automatic replan/i,
  }),
  // No auto-approval.
  fc.constant({
    label: "auto-approval requested",
    overrides: { autoApprovalRequested: true } as Partial<RepositoryPolicyRequest>,
    matcher: /auto-approval/i,
  }),
  // Production filesystem is read-only.
  fc.constant({
    label: "production filesystem write requested",
    overrides: { productionFilesystemWriteRequested: true } as Partial<RepositoryPolicyRequest>,
    matcher: /production filesystem/i,
  }),
  // Mode-aware persistence without raw disk.
  fc.constant({
    label: "raw-disk persistence",
    overrides: { persistenceMode: "raw-disk" } as Partial<RepositoryPolicyRequest>,
    matcher: /mode-aware wrappers/i,
  }),
  // No dual-write persistence.
  fc.constant({
    label: "dual-write persistence",
    overrides: { persistenceMode: "dual-write" } as Partial<RepositoryPolicyRequest>,
    matcher: /dual-write/i,
  }),
  // Two-database routing must be explicit.
  fc.constant({
    label: "unknown database route",
    overrides: { databaseRoute: "unknown" } as Partial<RepositoryPolicyRequest>,
    matcher: /Admin or Products/i,
  }),
  // Studio/Planner fork isolation.
  fc.constant({
    label: "Studio/Planner import requested",
    overrides: { studioPlannerImportRequested: true } as Partial<RepositoryPolicyRequest>,
    matcher: /Studio and Planner/i,
  }),
  // Explicit approval required.
  fc.constant({
    label: "explicit approval missing",
    overrides: { explicitApprovalRecorded: false } as Partial<RepositoryPolicyRequest>,
    matcher: /explicit approval/i,
  }),
  // Crew execution can never use the OD-04 exception.
  fc.constant({
    label: "Crew execution requested",
    overrides: { crewExecutionRequested: true } as Partial<RepositoryPolicyRequest>,
    matcher: /Crew execution/i,
  }),
  // Default one-agent ceiling: more than one agent outside the OD-04 wave.
  fc
    .integer({ min: DEFAULT_MAX_ACTIVE_AGENTS + 1, max: 12 })
    .map((count) => ({
      label: "more than one agent without OD-04 wave",
      overrides: { activeAgentCount: count },
      matcher: /no more than one active agent/i,
    })),
  // A feature wave under the wrong feature name never inherits the exception.
  fc
    .string({ minLength: 1, maxLength: 12 })
    .filter((name) => name !== FEATURE_NAME)
    .map((name) => ({
      label: "feature wave for an unrelated feature",
      overrides: { featureWaveRequested: true, featureName: name, activeAgentCount: 3 },
      matcher: /OD-04 exception is limited/i,
    })),
  // Both Vitest lanes must be recorded when Vitest is used.
  fc.constant({
    label: "only the default Vitest lane recorded",
    overrides: { vitestLanes: { default: true, techDocs: false } } as Partial<RepositoryPolicyRequest>,
    matcher: /both default and tech-docs/i,
  }),
  fc.constant({
    label: "only the tech-docs Vitest lane recorded",
    overrides: { vitestLanes: { default: false, techDocs: true } } as Partial<RepositoryPolicyRequest>,
    matcher: /both default and tech-docs/i,
  }),
  // Required repository gates must be completed.
  fc.constant({
    label: "required gate not completed",
    overrides: { completedGates: ["gate:fast"] } as Partial<RepositoryPolicyRequest>,
    matcher: /required repository gate check:layout/i,
  }),
);

describe("Property 15: a single invariant violation is never allowed by any plan", () => {
  it("blocks the plan, surfaces the matching blocker, and preserves prior state", () => {
    fc.assert(
      fc.property(singleViolationArb, (violation) => {
        const decisions = baseDecisions();
        const before = JSON.stringify(decisions);
        const request = cleanPlan(violation.overrides);

        const result = assessRepositoryPolicy(request, decisions);

        // The invariant can never be violated by a passing plan.
        expect(result.status).toBe("blocked");
        expect(result.output?.allowed).toBe(false);
        expect(result.blockers.length).toBeGreaterThan(0);
        expect(result.blockers.some((b) => violation.matcher.test(b))).toBe(true);

        // The general repository rule and prior state are always preserved.
        expect(result.output?.generalRepositoryRulePreserved).toBe(true);
        expect(result.output?.preservedPriorState).toBe(true);

        // Side-effect-free: the owner-decision ledger is never mutated.
        expect(JSON.stringify(decisions)).toBe(before);
        return true;
      }),
      { numRuns: 300 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15b: an arbitrary combination of violations is still blocked, and
// every distinct violation present is reported. This proves invariants hold
// jointly, not just one at a time.
// ---------------------------------------------------------------------------

describe("Property 15: any combination of violations stays blocked", () => {
  it("never yields an allowed plan while at least one invariant is violated", () => {
    fc.assert(
      fc.property(
        fc.record({
          worktreeRequested: fc.boolean(),
          hiddenSpawningRequested: fc.boolean(),
          automaticRetryRequested: fc.boolean(),
          automaticReplanRequested: fc.boolean(),
          autoApprovalRequested: fc.boolean(),
          crewExecutionRequested: fc.boolean(),
          productionFilesystemWriteRequested: fc.boolean(),
          studioPlannerImportRequested: fc.boolean(),
          explicitApprovalRecorded: fc.boolean(),
          persistenceMode: persistenceModeArb,
          databaseRoute: databaseRouteArb,
          packageManager: fc.constantFrom(PACKAGE_MANAGER, "npm", "yarn"),
          activeAgentCount: fc.integer({ min: 0, max: 6 }),
        }),
        (flags) => {
          const decisions = baseDecisions();
          const request = cleanPlan(flags);
          const result = assessRepositoryPolicy(request, decisions);

          const violates =
            flags.worktreeRequested ||
            flags.hiddenSpawningRequested ||
            flags.automaticRetryRequested ||
            flags.automaticReplanRequested ||
            flags.autoApprovalRequested ||
            flags.crewExecutionRequested ||
            flags.productionFilesystemWriteRequested ||
            flags.studioPlannerImportRequested ||
            !flags.explicitApprovalRecorded ||
            flags.persistenceMode !== "mode-aware" ||
            flags.databaseRoute === "unknown" ||
            flags.packageManager !== PACKAGE_MANAGER ||
            flags.activeAgentCount > DEFAULT_MAX_ACTIVE_AGENTS;

          if (violates) {
            expect(result.status).toBe("blocked");
            expect(result.output?.allowed).toBe(false);
          } else {
            expect(result.status).toBe("pass");
            expect(result.output?.allowed).toBe(true);
          }
          // Whatever the outcome, invariants of the assessment hold.
          expect(result.output?.generalRepositoryRulePreserved).toBe(true);
          expect(result.output?.preservedPriorState).toBe(true);
          return true;
        },
      ),
      { numRuns: 300 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15c: the default one-agent ceiling. Outside the exact OD-04 wave,
// only 0 or 1 active agents are allowed; 2+ is always blocked. The exact OD-04
// wave allows up to four, but never five or more, and never applies its
// exception to any other feature name.
// ---------------------------------------------------------------------------

describe("Property 15: the agent ceiling depends only on the exact OD-04 wave", () => {
  it("allows more than one agent only for the exact OD-04 wave within the four-agent bound", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 8 }),
        fc.boolean(),
        fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
        (agentCount, featureWaveRequested, rawName) => {
          // When a wave is requested we sometimes use the exact feature name and
          // sometimes an unrelated one; when no wave is requested the name is
          // irrelevant to the ceiling.
          const featureName = rawName === undefined ? undefined : rawName;
          const decisions = baseDecisions();
          const request = cleanPlan({
            activeAgentCount: agentCount,
            featureWaveRequested,
            featureName,
          });
          const result = assessRepositoryPolicy(request, decisions);

          const isExactOd04Wave =
            featureWaveRequested && featureName === FEATURE_NAME;

          if (isExactOd04Wave) {
            // Exact OD-04 wave: allowed iff within the four-agent bound.
            if (agentCount <= FEATURE_WAVE_MAX_ACTIVE_AGENTS) {
              expect(result.status).toBe("pass");
              expect(result.output?.od04ExceptionApplied).toBe(true);
            } else {
              expect(result.status).toBe("blocked");
              expect(
                result.blockers.some((b) => /no more than four/i.test(b)),
              ).toBe(true);
            }
          } else if (featureWaveRequested) {
            // A wave for any other feature never inherits the exception.
            expect(result.status).toBe("blocked");
            expect(result.output?.od04ExceptionApplied).toBe(false);
            expect(
              result.blockers.some((b) => /OD-04 exception is limited/i.test(b)),
            ).toBe(true);
          } else {
            // No wave: the default one-agent ceiling governs.
            expect(result.output?.od04ExceptionApplied).toBe(false);
            if (agentCount <= DEFAULT_MAX_ACTIVE_AGENTS) {
              expect(result.status).toBe("pass");
            } else {
              expect(result.status).toBe("blocked");
              expect(
                result.blockers.some((b) => /no more than one active agent/i.test(b)),
              ).toBe(true);
            }
          }
          return true;
        },
      ),
      { numRuns: 400 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15d: a fully clean default plan always passes. This anchors the
// property so the blocked-cases above are meaningful (the guard is not simply
// blocking everything).
// ---------------------------------------------------------------------------

describe("Property 15: a fully clean default plan passes", () => {
  it("passes with no blockers and no OD-04 exception for the default one-agent plan", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: DEFAULT_MAX_ACTIVE_AGENTS }),
        databaseRouteArb.filter((route) => route !== "unknown"),
        (agentCount, databaseRoute) => {
          const decisions = baseDecisions();
          const result = assessRepositoryPolicy(
            cleanPlan({ activeAgentCount: agentCount, databaseRoute }),
            decisions,
          );
          expect(result.status).toBe("pass");
          expect(result.blockers).toEqual([]);
          expect(result.output?.allowed).toBe(true);
          expect(result.output?.od04ExceptionApplied).toBe(false);
          return true;
        },
      ),
      { numRuns: 200 },
    );
  });
});


// The additional generated-plan model below deliberately spans every plan kind
// named by Property 15. It keeps the plan in memory and delegates repository
// policy, ownership, reservation, freeze, and wave decisions to the existing
// pure surfaces; reviewer/gate shape is checked against the frozen Lane D
// contract because the integration-owned gate is not implemented yet.
import {
  FEATURE_NAME as PROPERTY_15_FEATURE_NAME,
  REVIEWER_MAXIMUM_CONCURRENCY,
  REVIEWER_ORDER,
  REVIEWER_ITERATION_CEILING,
  type ConcurrentImplementationWaveRecord,
  type FeatureWaveAgentCount,
  type FileOwnershipReservation,
  type ImplementationAgentDeclaration,
  type ReviewerName,
  type SharedContractFreeze,
} from "../../contracts.ts";
import { createSharedContractFreeze } from "../../contract-freeze.ts";
import {
  INTEGRATION_OWNER_OWNERSHIP,
  LANE_OWNERSHIP_DECLARATIONS,
  validateOwnership,
} from "../../ownership.ts";
import {
  acquireFileOwnershipReservation,
  OD04_APPROVAL_BOUNDARY_REF,
} from "../../reservations.ts";
import {
  preflightWave,
  type WaveExecutionPolicyInput,
} from "../../wave-guard.ts";
import { waveManifest } from "../../wave-manifest.ts";

const PROPERTY_15_WAVE_ID = "wave-property-15";
const PROPERTY_15_FREEZE_ID = "freeze-property-15";
const PROPERTY_15_GATE_ID = "integration-gate-property-15";
const PROPERTY_15_TARGET_PATHS = LANE_OWNERSHIP_DECLARATIONS.map(
  (agent) => agent.writeScope.writePaths[0],
);
type PolicyPlanKind =
  | "command"
  | "hook"
  | "default-native-task-graph"
  | "power"
  | "agent"
  | "reviewer"
  | "handover";

const POLICY_PLAN_KINDS: readonly PolicyPlanKind[] = [
  "command",
  "hook",
  "default-native-task-graph",
  "power",
  "agent",
  "reviewer",
  "handover",
];

type ReservationCase = "valid" | "missing" | "stale" | "conflicting" | "after-mutation" | "overlapping";
type FreezeCase = "valid" | "missing" | "stale" | "dependent-work-disallowed";

interface PolicyPlanSeed {
  readonly kind: PolicyPlanKind;
  readonly workingDirectoryValid: boolean;
  readonly packageManagerValid: boolean;
  readonly worktreeRequested: boolean;
  readonly hiddenSpawningRequested: boolean;
  readonly automaticRetryRequested: boolean;
  readonly automaticReplanRequested: boolean;
  readonly autoApprovalRequested: boolean;
  readonly productionFilesystemWriteRequested: boolean;
  readonly persistenceMode: PersistenceMode;
  readonly databaseRoute: DatabaseRoute;
  readonly studioPlannerImportRequested: boolean;
  readonly explicitApprovalRecorded: boolean;
  readonly vitestDefault: boolean;
  readonly vitestTechDocs: boolean;
  readonly requiredGatesComplete: boolean;
  readonly featureWaveRequested: boolean;
  readonly exactFeatureName: boolean;
  readonly activeAgentCount: number;
  readonly maxActiveAgents: number;
  readonly ownershipDisjoint: boolean;
  readonly sharedOutputWrite: boolean;
  readonly reservationCase: ReservationCase;
  readonly freezeCase: FreezeCase;
  readonly agentsFileMutationRequested: boolean;
  readonly reviewerOrderCorrect: boolean;
  readonly reviewerConcurrency: number;
  readonly reviewerIterationCeiling: number;
  readonly reviewersReadOnly: boolean;
  readonly integrationGateCount: number;
  readonly defaultTaskConcurrency: number;
}

interface GeneratedPolicyPlan {
  readonly seed: PolicyPlanSeed;
  readonly policyRequest: RepositoryPolicyRequest;
  readonly wave: ConcurrentImplementationWaveRecord;
  readonly reservations: readonly FileOwnershipReservation[];
  readonly freeze?: SharedContractFreeze;
  readonly mutationTarget?: string;
  readonly execution: WaveExecutionPolicyInput;
  readonly reviewerOrder: readonly ReviewerName[];
}

function property15Declarations(
  disjoint: boolean,
): readonly ImplementationAgentDeclaration[] {
  if (disjoint) return LANE_OWNERSHIP_DECLARATIONS;

  const laneA = LANE_OWNERSHIP_DECLARATIONS[0];
  const laneB = LANE_OWNERSHIP_DECLARATIONS[1];
  return [
    laneA,
    {
      ...laneB,
      writeScope: {
        ...laneB.writeScope,
        writePaths: [
          laneA.writeScope.writePaths[0],
          ...laneB.writeScope.writePaths.slice(1),
        ],
      },
    },
    LANE_OWNERSHIP_DECLARATIONS[2],
    LANE_OWNERSHIP_DECLARATIONS[3],
  ];
}

function property15Reservation(
  agent: ImplementationAgentDeclaration,
  existingReservations: readonly FileOwnershipReservation[],
): FileOwnershipReservation {
  const result = acquireFileOwnershipReservation({
    waveId: PROPERTY_15_WAVE_ID,
    agent,
    targetPaths: [agent.writeScope.writePaths[0]],
    existingReservations,
    acquiredAtUtc: "2026-08-25T00:00:00Z",
    approvalBoundaryRefs: [OD04_APPROVAL_BOUNDARY_REF],
  });
  if (result.status !== "pass" || result.output?.reservation === null) {
    throw new Error(result.blockers.join("; ") || "Property 15 reservation fixture failed");
  }
  return result.output.reservation;
}

function property15CanonicalReservations(): readonly FileOwnershipReservation[] {
  const reservations: FileOwnershipReservation[] = [];
  for (const agent of LANE_OWNERSHIP_DECLARATIONS) {
    reservations.push(property15Reservation(agent, reservations));
  }
  return reservations;
}

const PROPERTY_15_CANONICAL_RESERVATIONS = property15CanonicalReservations();

function property15Wave(
  seed: PolicyPlanSeed,
  declarations: readonly ImplementationAgentDeclaration[],
  reservations: readonly FileOwnershipReservation[],
): ConcurrentImplementationWaveRecord {
  const waveFeatureName = seed.featureWaveRequested && !seed.exactFeatureName
    ? "unrelated-feature"
    : PROPERTY_15_FEATURE_NAME;
  const integrationGateRef = seed.integrationGateCount === 1 ? PROPERTY_15_GATE_ID : "";
  const wave = {
    waveId: PROPERTY_15_WAVE_ID,
    featureName: waveFeatureName,
    scope: "feature_only",
    maxActiveAgents: seed.maxActiveAgents,
    activeAgentCount: seed.activeAgentCount,
    implementationAgents: declarations,
    declaredFileOwnership: declarations.flatMap((agent) => agent.writeScope.writePaths),
    declaredSharedOutputOwnership: seed.sharedOutputWrite ? "named_disjoint_outputs" : "none",
    readWriteScopes: declarations.flatMap((agent) => [agent.readScope, agent.writeScope]),
    fileOwnershipReservations: reservations,
    sharedContractFreezeRef: PROPERTY_15_FREEZE_ID,
    rootWorkingDirectory: seed.workingDirectoryValid ? "D:\\23082026" : "D:\\other-repository",
    packageManager: seed.packageManagerValid ? "pnpm" : "npm",
    worktrees: seed.worktreeRequested ? "allowed" : "prohibited",
    hiddenSpawning: seed.hiddenSpawningRequested ? "allowed" : "prohibited",
    automaticRetries: seed.automaticRetryRequested ? "allowed" : "prohibited",
    automaticReplans: seed.automaticReplanRequested ? "allowed" : "prohibited",
    approvalBoundaryRefs: [OD04_APPROVAL_BOUNDARY_REF],
    conflictPolicy: "stop_affected_agent_or_wave_fail_closed",
    integrationValidationGateRef: integrationGateRef,
    status: "pending",
    rollbackPath: "release reservations and restore affected artifacts",
    validationRunRefs: [],
  } as unknown as ConcurrentImplementationWaveRecord;
  return wave;
}

function property15Freeze(state: FreezeCase, wave: ConcurrentImplementationWaveRecord): SharedContractFreeze | undefined {
  const canonicalWave = {
    ...wave,
    featureName: PROPERTY_15_FEATURE_NAME,
    scope: "feature_only" as const,
    implementationAgents: LANE_OWNERSHIP_DECLARATIONS,
    declaredFileOwnership: LANE_OWNERSHIP_DECLARATIONS.flatMap(
      (agent) => agent.writeScope.writePaths,
    ),
    readWriteScopes: LANE_OWNERSHIP_DECLARATIONS.flatMap((agent) => [
      agent.readScope,
      agent.writeScope,
    ]),
    fileOwnershipReservations: PROPERTY_15_CANONICAL_RESERVATIONS,
    activeAgentCount: 4 as FeatureWaveAgentCount,
    maxActiveAgents: 4 as FeatureWaveAgentCount,
    declaredSharedOutputOwnership: "none" as const,
    rootWorkingDirectory: "D:\\23082026" as const,
    packageManager: "pnpm" as const,
    worktrees: "prohibited" as const,
    hiddenSpawning: "prohibited" as const,
    automaticRetries: "prohibited" as const,
    automaticReplans: "prohibited" as const,
    integrationValidationGateRef: PROPERTY_15_GATE_ID,
  } satisfies ConcurrentImplementationWaveRecord;
  const result = createSharedContractFreeze({
    wave: canonicalWave,
    freezeId: PROPERTY_15_FREEZE_ID,
    frozenAtUtc: "2026-08-25T00:00:00Z",
    validationRunRef: "validation:property-15-freeze",
  });
  if (result.status !== "pass" || result.output?.freeze === null) {
    throw new Error(result.blockers.join("; ") || "Property 15 freeze fixture failed");
  }
  const freeze = result.output.freeze;
  switch (state) {
    case "valid":
      return freeze;
    case "missing":
      return undefined;
    case "stale":
      return { ...freeze, contractVersionOrHash: "sha256:stale" };
    case "dependent-work-disallowed":
      return { ...freeze, dependentWorkAllowed: false };
  }
}

function property15Reservations(
  state: ReservationCase,
): readonly FileOwnershipReservation[] {
  switch (state) {
    case "valid":
      return PROPERTY_15_CANONICAL_RESERVATIONS;
    case "missing":
      return [];
    case "stale":
      return PROPERTY_15_CANONICAL_RESERVATIONS.map((reservation, index) =>
        index === 0 ? { ...reservation, status: "stale" as const } : reservation,
      );
    case "conflicting":
      return PROPERTY_15_CANONICAL_RESERVATIONS.map((reservation, index) =>
        index === 0 ? { ...reservation, conflictRefs: ["conflict:property-15"] } : reservation,
      );
    case "after-mutation":
      return PROPERTY_15_CANONICAL_RESERVATIONS.map((reservation, index) =>
        index === 0 ? { ...reservation, acquiredBeforeMutation: false } : reservation,
      );
    case "overlapping":
      return PROPERTY_15_CANONICAL_RESERVATIONS.map((reservation, index) =>
        index === 1
          ? { ...reservation, targetPaths: [PROPERTY_15_TARGET_PATHS[0]] }
          : reservation,
      );
  }
}

function generatedPolicyPlan(seed: PolicyPlanSeed): GeneratedPolicyPlan {
  const declarations = property15Declarations(seed.ownershipDisjoint);
  const reservations = property15Reservations(seed.reservationCase);
  const wave = property15Wave(seed, declarations, reservations);
  const mutationRequested = seed.activeAgentCount > 0 || seed.agentsFileMutationRequested;
  const mutationTarget = mutationRequested
    ? seed.agentsFileMutationRequested
      ? "AGENTS.md"
      : PROPERTY_15_TARGET_PATHS[0]
    : undefined;
  const freeze = property15Freeze(seed.freezeCase, wave);
  const execution: WaveExecutionPolicyInput = {
    repositoryRoot: seed.workingDirectoryValid ? "D:\\23082026" : "D:\\other-repository",
    packageManager: seed.packageManagerValid ? "pnpm" : "npm",
    worktreeRequested: seed.worktreeRequested,
    hiddenSpawningRequested: seed.hiddenSpawningRequested,
    automaticRetryRequested: seed.automaticRetryRequested,
    automaticReplanRequested: seed.automaticReplanRequested,
    featureName: wave.featureName,
  };
  const policyRequest: RepositoryPolicyRequest = {
    workingDirectory: seed.workingDirectoryValid ? REPOSITORY_ROOT : "D:\\other-repository",
    packageManager: seed.packageManagerValid ? PACKAGE_MANAGER : "npm",
    activeAgentCount: seed.activeAgentCount,
    featureWaveRequested: seed.featureWaveRequested,
    featureName: seed.featureWaveRequested ? wave.featureName : undefined,
    worktreeRequested: seed.worktreeRequested,
    hiddenSpawningRequested: seed.hiddenSpawningRequested,
    automaticRetryRequested: seed.automaticRetryRequested,
    automaticReplanRequested: seed.automaticReplanRequested,
    autoApprovalRequested: seed.autoApprovalRequested,
    crewExecutionRequested: seed.kind === "power" && seed.autoApprovalRequested,
    explicitApprovalRecorded: seed.explicitApprovalRecorded,
    productionFilesystemWriteRequested: seed.productionFilesystemWriteRequested,
    persistenceMode: seed.persistenceMode,
    databaseRoute: seed.databaseRoute,
    studioPlannerImportRequested: seed.studioPlannerImportRequested,
    requiredGates: [...REQUIRED_REPOSITORY_GATES],
    completedGates: seed.requiredGatesComplete ? [...REQUIRED_REPOSITORY_GATES] : [],
    vitestLanes: { default: seed.vitestDefault, techDocs: seed.vitestTechDocs },
  };
  return {
    seed,
    policyRequest,
    wave,
    reservations,
    freeze,
    mutationTarget,
    execution,
    reviewerOrder: seed.reviewerOrderCorrect
      ? REVIEWER_ORDER
      : [REVIEWER_ORDER[1], REVIEWER_ORDER[0]],
  };
}

const policyPlanSeedArb: fc.Arbitrary<PolicyPlanSeed> = fc.record({
  kind: fc.constantFrom(...POLICY_PLAN_KINDS),
  workingDirectoryValid: fc.boolean(),
  packageManagerValid: fc.boolean(),
  worktreeRequested: fc.boolean(),
  hiddenSpawningRequested: fc.boolean(),
  automaticRetryRequested: fc.boolean(),
  automaticReplanRequested: fc.boolean(),
  autoApprovalRequested: fc.boolean(),
  productionFilesystemWriteRequested: fc.boolean(),
  persistenceMode: persistenceModeArb,
  databaseRoute: databaseRouteArb,
  studioPlannerImportRequested: fc.boolean(),
  explicitApprovalRecorded: fc.boolean(),
  vitestDefault: fc.boolean(),
  vitestTechDocs: fc.boolean(),
  requiredGatesComplete: fc.boolean(),
  featureWaveRequested: fc.boolean(),
  exactFeatureName: fc.boolean(),
  activeAgentCount: fc.integer({ min: 0, max: 6 }),
  maxActiveAgents: fc.integer({ min: 0, max: 6 }),
  ownershipDisjoint: fc.boolean(),
  sharedOutputWrite: fc.boolean(),
  reservationCase: fc.constantFrom<ReservationCase>(
    "valid",
    "missing",
    "stale",
    "conflicting",
    "after-mutation",
    "overlapping",
  ),
  freezeCase: fc.constantFrom<FreezeCase>(
    "valid",
    "missing",
    "stale",
    "dependent-work-disallowed",
  ),
  agentsFileMutationRequested: fc.boolean(),
  reviewerOrderCorrect: fc.boolean(),
  reviewerConcurrency: fc.integer({ min: 0, max: 2 }),
  reviewerIterationCeiling: fc.integer({ min: 0, max: 4 }),
  reviewersReadOnly: fc.boolean(),
  integrationGateCount: fc.integer({ min: 0, max: 2 }),
  defaultTaskConcurrency: fc.integer({ min: 0, max: 2 }),
});

function reviewerPlanIsSafe(plan: GeneratedPolicyPlan): boolean {
  return (
    plan.reviewerOrder.length === REVIEWER_ORDER.length &&
    plan.reviewerOrder[0] === REVIEWER_ORDER[0] &&
    plan.reviewerOrder[1] === REVIEWER_ORDER[1] &&
    plan.seed.reviewerConcurrency === REVIEWER_MAXIMUM_CONCURRENCY &&
    plan.seed.reviewerIterationCeiling >= 0 &&
    plan.seed.reviewerIterationCeiling <= REVIEWER_ITERATION_CEILING &&
    plan.seed.reviewersReadOnly &&
    plan.seed.integrationGateCount === waveManifest.postWave.integrationGateCount
  );
}

function waveConditionsAreSafe(plan: GeneratedPolicyPlan): boolean {
  const { seed } = plan;
  const waveRequested = seed.featureWaveRequested || seed.agentsFileMutationRequested;
  if (!waveRequested) return true;

  const countIsSafe =
    seed.activeAgentCount >= 0 &&
    seed.activeAgentCount <= 4 &&
    seed.maxActiveAgents >= seed.activeAgentCount &&
    seed.maxActiveAgents <= 4;
  const reservationIsSafe =
    seed.reservationCase === "valid" ||
    (seed.activeAgentCount === 0 && seed.reservationCase === "missing");
  const freezeIsSafe =
    seed.freezeCase === "valid" ||
    (seed.activeAgentCount === 0 && seed.freezeCase === "missing" && !plan.mutationTarget);

  return (
    plan.wave.featureName === PROPERTY_15_FEATURE_NAME &&
    countIsSafe &&
    seed.ownershipDisjoint &&
    !seed.sharedOutputWrite &&
    reservationIsSafe &&
    freezeIsSafe &&
    !seed.worktreeRequested &&
    !seed.hiddenSpawningRequested &&
    !seed.automaticRetryRequested &&
    !seed.automaticReplanRequested &&
    !seed.autoApprovalRequested &&
    seed.workingDirectoryValid &&
    seed.packageManagerValid &&
    !seed.agentsFileMutationRequested &&
    (!plan.mutationTarget || seed.activeAgentCount > 0) &&
    seed.integrationGateCount === 1
  );
}

function policyPlanIsSafe(plan: GeneratedPolicyPlan): boolean {
  const policy = plan.seed;
  const defaultConcurrencyIsSafe = policy.defaultTaskConcurrency >= 0 && policy.defaultTaskConcurrency <= 1;
  const policyAllows = assessRepositoryPolicy(plan.policyRequest, OWNER_DECISIONS).status === "pass";
  const waveRequested = policy.featureWaveRequested || policy.agentsFileMutationRequested;
  const waveResult = waveRequested
    ? preflightWave({
        wave: plan.wave,
        declarations: plan.wave.implementationAgents,
        reservations: plan.reservations,
        sharedContractFreeze: plan.freeze,
        mutation: plan.mutationTarget
          ? {
              waveId: PROPERTY_15_WAVE_ID,
              agentId: LANE_OWNERSHIP_DECLARATIONS[0].agentId,
              targetPaths: [plan.mutationTarget],
              reservation: plan.reservations.find(
                (reservation) => reservation.agentId === LANE_OWNERSHIP_DECLARATIONS[0].agentId,
              ) ?? null,
            }
          : undefined,
        execution: plan.execution,
      })
    : undefined;
  const waveAllows =
    !waveRequested ||
    (waveResult?.status === "pass" && waveResult.output?.allowed === true);

  return (
    policyAllows &&
    waveAllows &&
    waveConditionsAreSafe(plan) &&
    reviewerPlanIsSafe(plan) &&
    defaultConcurrencyIsSafe &&
    plan.seed.agentsFileMutationRequested === false
  );
}

// Feature: kiro-repo-guidance-setup, Property 15: Repository policy invariants
// survive every generated command, hook, task graph, power, agent, reviewer,
// and handover plan.
// Validates: Requirements 9.2, 11.6, 14.2, 14.5; Design: Correctness Property 15.
describe("Property 15: every generated plan preserves repository policy invariants", () => {
  it("allows only the complete safe conjunction and fails closed otherwise", () => {
    fc.assert(
      fc.property(policyPlanSeedArb, (seed) => {
        const plan = generatedPolicyPlan(seed);
        const before = JSON.stringify(plan);
        const expectedSafe = policyPlanIsSafe(plan);
        const policyResult = assessRepositoryPolicy(plan.policyRequest, OWNER_DECISIONS);
        const waveRequested = seed.featureWaveRequested || seed.agentsFileMutationRequested;
        const waveResult = waveRequested
          ? preflightWave({
              wave: plan.wave,
              declarations: plan.wave.implementationAgents,
              reservations: plan.reservations,
              sharedContractFreeze: plan.freeze,
              mutation: plan.mutationTarget
                ? {
                    waveId: PROPERTY_15_WAVE_ID,
                    agentId: LANE_OWNERSHIP_DECLARATIONS[0].agentId,
                    targetPaths: [plan.mutationTarget],
                    reservation: plan.reservations.find(
                      (reservation) => reservation.agentId === LANE_OWNERSHIP_DECLARATIONS[0].agentId,
                    ) ?? null,
                  }
                : undefined,
              execution: plan.execution,
            })
          : undefined;

        if (expectedSafe) {
          expect(policyResult.status).toBe("pass");
          if (waveRequested) {
            expect(waveResult?.status).toBe("pass");
            expect(waveResult?.output?.allowed).toBe(true);
          }
        } else {
          expect(
            policyResult.status === "blocked" ||
            waveResult?.status === "blocked" ||
            !reviewerPlanIsSafe(plan) ||
            seed.defaultTaskConcurrency > 1,
          ).toBe(true);
        }

        // Every branch preserves the repository default and prior state.
        expect(policyResult.output?.generalRepositoryRulePreserved).toBe(true);
        expect(policyResult.output?.preservedPriorState).toBe(true);
        if (waveResult?.output !== undefined) {
          expect(waveResult.output.preservedPriorState).toBe(true);
        }
        expect(JSON.stringify(plan)).toBe(before);
        return true;
      }),
      { numRuns: 300 },
    );
  });
});

// Feature: kiro-repo-guidance-setup, Property 15: an OD-04 exception is never
// granted by changing AGENTS.md; Lane ownership and mutation reservations stay
// the only authority for feature-wave writes.
// Validates: Requirements 9.2, 9.8-9.12, 10.12-10.13, 11.6-11.8, 14.2, 14.5,
// 14.10-14.12; Design: Correctness Properties 15 and 16.
describe("Property 15: AGENTS.md cannot grant or receive the OD-04 exception", () => {
  it("rejects generated AGENTS.md mutations and preserves the frozen ownership manifest", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...POLICY_PLAN_KINDS),
        fc.integer({ min: 2, max: 4 }),
        (kind, activeAgentCount) => {
          const seed: PolicyPlanSeed = {
            kind,
            workingDirectoryValid: true,
            packageManagerValid: true,
            worktreeRequested: false,
            hiddenSpawningRequested: false,
            automaticRetryRequested: false,
            automaticReplanRequested: false,
            autoApprovalRequested: false,
            productionFilesystemWriteRequested: false,
            persistenceMode: "mode-aware",
            databaseRoute: "Admin",
            studioPlannerImportRequested: false,
            explicitApprovalRecorded: true,
            vitestDefault: true,
            vitestTechDocs: true,
            requiredGatesComplete: true,
            featureWaveRequested: true,
            exactFeatureName: true,
            activeAgentCount,
            maxActiveAgents: 4,
            ownershipDisjoint: true,
            sharedOutputWrite: false,
            reservationCase: "valid",
            freezeCase: "valid",
            agentsFileMutationRequested: true,
            reviewerOrderCorrect: true,
            reviewerConcurrency: 1,
            reviewerIterationCeiling: 3,
            reviewersReadOnly: true,
            integrationGateCount: 1,
            defaultTaskConcurrency: 1,
          };
          const plan = generatedPolicyPlan(seed);
          const before = JSON.stringify(plan);
          const result = preflightWave({
            wave: plan.wave,
            declarations: plan.wave.implementationAgents,
            reservations: plan.reservations,
            sharedContractFreeze: plan.freeze,
            mutation: {
              waveId: PROPERTY_15_WAVE_ID,
              agentId: LANE_OWNERSHIP_DECLARATIONS[0].agentId,
              targetPaths: ["AGENTS.md"],
              reservation: plan.reservations[0] ?? null,
            },
            execution: plan.execution,
          });

          expect(result.status).toBe("blocked");
          expect(result.output?.allowed).toBe(false);
          expect(result.output?.preservedPriorState).toBe(true);
          expect(result.blockers.some((blocker) => /outside|covered|ownership/i.test(blocker))).toBe(true);
          expect(waveManifest.od04.prohibitedControls).toContain("general-repository-policy-change");
          expect(
            LANE_OWNERSHIP_DECLARATIONS.every(
              (agent) => !agent.writeScope.writePaths.some((path) => path.toLowerCase().endsWith("agents.md")),
            ),
          ).toBe(true);
          expect(
            INTEGRATION_OWNER_OWNERSHIP.writeScope.writePaths.some((path) => path.toLowerCase().endsWith("agents.md")),
          ).toBe(false);
          expect(JSON.stringify(plan)).toBe(before);
          return true;
        },
      ),
      { numRuns: 150 },
    );
  });
});

// Feature: kiro-repo-guidance-setup, Property 15: ownership, reservation,
// Shared_Contract_Freeze, generated-output, reviewer, and integration-gate
// failures remain fail-closed and side-effect-free.
// Validates: Requirements 9.8-9.12, 10.12-10.13, 11.6-11.8, 14.10-14.12;
// Design: Correctness Properties 15 and 16.
describe("Property 15: invalid wave and review conditions preserve prior state", () => {
  it("never turns missing/conflicting ownership controls into an allowed plan", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ReservationCase>("missing", "stale", "conflicting", "after-mutation", "overlapping"),
        fc.constantFrom<FreezeCase>("missing", "stale", "dependent-work-disallowed"),
        fc.boolean(),
        fc.boolean(),
        (reservationCase, freezeCase, ownershipDisjoint, sharedOutputWrite) => {
          const seed: PolicyPlanSeed = {
            kind: "agent",
            workingDirectoryValid: true,
            packageManagerValid: true,
            worktreeRequested: false,
            hiddenSpawningRequested: false,
            automaticRetryRequested: false,
            automaticReplanRequested: false,
            autoApprovalRequested: false,
            productionFilesystemWriteRequested: false,
            persistenceMode: "mode-aware",
            databaseRoute: "Products",
            studioPlannerImportRequested: false,
            explicitApprovalRecorded: true,
            vitestDefault: true,
            vitestTechDocs: true,
            requiredGatesComplete: true,
            featureWaveRequested: true,
            exactFeatureName: true,
            activeAgentCount: 4,
            maxActiveAgents: 4,
            ownershipDisjoint,
            sharedOutputWrite,
            reservationCase,
            freezeCase,
            agentsFileMutationRequested: false,
            reviewerOrderCorrect: true,
            reviewerConcurrency: 1,
            reviewerIterationCeiling: 3,
            reviewersReadOnly: true,
            integrationGateCount: 1,
            defaultTaskConcurrency: 1,
          };
          const plan = generatedPolicyPlan(seed);
          const before = JSON.stringify(plan);
          const result = preflightWave({
            wave: plan.wave,
            declarations: plan.wave.implementationAgents,
            reservations: plan.reservations,
            sharedContractFreeze: plan.freeze,
            mutation: {
              waveId: PROPERTY_15_WAVE_ID,
              agentId: LANE_OWNERSHIP_DECLARATIONS[0].agentId,
              targetPaths: [PROPERTY_15_TARGET_PATHS[0]],
              reservation: plan.reservations[0] ?? null,
            },
            execution: plan.execution,
          });

          expect(result.status).toBe("blocked");
          expect(result.output?.allowed).toBe(false);
          expect(result.output?.preservedPriorState).toBe(true);
          expect(result.blockers.length).toBeGreaterThan(0);
          expect(JSON.stringify(plan)).toBe(before);
          return true;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("keeps the frozen ownership manifest disjoint and gives shared output to integration only", () => {
    fc.assert(
      fc.property(fc.constantFrom(...POLICY_PLAN_KINDS), (kind) => {
        const ownership = validateOwnership();
        expect(ownership.status).toBe("pass");
        expect(ownership.output?.sharedGeneratedOutputOwnership).toBe("none");
        expect(INTEGRATION_OWNER_OWNERSHIP.sharedGeneratedOutputOwnership).toBe("named_disjoint_outputs");
        expect(waveManifest.generatedOutputOwnership.laneSharedGeneratedOutputOwnership).toBe("none");
        expect(waveManifest.postWave.integrationGateCount).toBe(1);
        expect(waveManifest.postWave.reviewerOrder).toEqual([
          "EvidenceCompatibilityReviewer",
          "SafetyRollbackReviewer",
        ]);
        expect(kind.length).toBeGreaterThan(0);
        return true;
      }),
      { numRuns: 150 },
    );
  });
});
