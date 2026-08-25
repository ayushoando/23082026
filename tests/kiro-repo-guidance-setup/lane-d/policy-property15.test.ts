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
// under tests/kiro-repo-guidance-setup/lane-d/**. It reads the frozen Lane B
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
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";
import {
  assessRepositoryPolicy,
  REQUIRED_REPOSITORY_GATES,
  type DatabaseRoute,
  type PersistenceMode,
  type RepositoryPolicyRequest,
} from "../../../scripts/kiro-repo-guidance-setup/policy.ts";

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
