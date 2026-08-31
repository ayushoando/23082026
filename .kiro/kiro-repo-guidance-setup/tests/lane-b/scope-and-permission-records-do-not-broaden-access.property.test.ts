// @vitest-environment node

// Feature: kiro-repo-guidance-setup, Property 7: Scope and permission records
// do not broaden access.
//
// For all selected surfaces, global, project, agent, workspace-root permission,
// user-permission, and external-service scopes carry separate documented and
// observed precedence fields; a pending approval boundary or an unresolved
// deny-overrides-allow result yields a blocked action and no global/user/
// external mutation intent. This exercises the Lane B ScopePrecedenceMapper
// (scope precedence) and the approval-boundary/permission-probe assessment
// (permission probes) as pure, side-effect-free record checks.
//
// **Validates: Requirements 5.1, 5.2, 5.4, 5.5, 5.6, 10.9, 11.6; Design: Correctness Property 7**

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  assessScopePrecedence,
  DOCUMENTED_SCOPE_ORDER,
} from "../../compatibility.ts";
import { assessApprovalBoundaryOperation } from "../../scope.ts";
import type {
  ApprovalBoundary,
  ApprovalBoundaryStatus,
  ConfigurationScope,
  DenyOverridesAllow,
  KiroSurface,
  PermissionProbe,
  PermissionProbeOutcome,
  ScopeInput,
  ScopeRecord,
} from "../../contracts.ts";

// The scopes that, if widened, would broaden access beyond the repository-local
// surface. A pending/unresolved decision for any of these must never carry a
// mutation intent.
const ACCESS_BROADENING_SCOPES = [
  "global",
  "user_permission",
  "external_service",
] as const satisfies readonly ConfigurationScope[];

// An unresolved deny-overrides-allow result. "observed" is the only value that
// can clear the mapper; the other two leave the scope unresolved and blocked.
const UNRESOLVED_DENY_OVERRIDES = [
  "Unverified",
  "contradicted",
] as const satisfies readonly DenyOverridesAllow[];

// An approval boundary is only actionable when explicitly approved. Every other
// status must block the operation without mutation.
const NON_APPROVED_STATUSES = [
  "pending",
  "rejected",
  "expired",
] as const satisfies readonly ApprovalBoundaryStatus[];

const PROBE_OUTCOMES = [
  "allowed",
  "denied",
  "prompted",
  "restricted",
] as const satisfies readonly PermissionProbeOutcome[];

function createScopeRecord(
  scope: ConfigurationScope,
  overrides: Partial<ScopeRecord> = {},
): ScopeRecord {
  return {
    scope,
    surface: "Local_Repository_Surface",
    pathOrService: `.kiro/${scope}`,
    applicability: "applicable",
    access: "read",
    actions: ["record scope"],
    documentedPrecedence: [...DOCUMENTED_SCOPE_ORDER],
    observedPrecedence: [...DOCUMENTED_SCOPE_ORDER],
    denyOverridesAllow: "observed",
    evidenceRefs: [`evidence:${scope}`],
    rollbackPathRef: `rollback:${scope}`,
    ...overrides,
  };
}

function createScopeInput(records: readonly ScopeRecord[]): ScopeInput {
  return {
    records: [...records],
    generatedAtUtc: "2026-08-25T12:00:00Z",
  };
}

function createBoundary(
  scope: ConfigurationScope,
  surface: KiroSurface,
  status: ApprovalBoundaryStatus,
  overrides: Partial<ApprovalBoundary> = {},
): ApprovalBoundary {
  return {
    boundaryId: `boundary-${scope}`,
    scope,
    requestedChange: `Adjust the ${scope} configuration for ${surface} after validation.`,
    targetSurface: surface,
    owner: "repository owner",
    approvalStatus: status,
    // Only an approved boundary supplies an approval date; the pure check must
    // block everything else regardless.
    approvalDate: status === "approved" ? "2026-08-25" : undefined,
    preChangeStateRef: `snapshot:${scope}-before-change`,
    securityBoundary: `${scope} boundary; no credentials or project data are included.`,
    expectedSideEffects: [`The ${scope} configuration may change only after validation.`],
    rollbackPathRef: `rollback:restore-${scope}-snapshot`,
    ...overrides,
  };
}

function createProbe(
  outcome: PermissionProbeOutcome,
  surface: KiroSurface,
): PermissionProbe {
  return {
    probeId: `probe-${outcome}`,
    surface,
    action: `Record ${outcome} permission outcome without executing the protected operation.`,
    outcome,
    evidenceRef: `evidence:probe-${outcome}`,
  };
}

describe("Property 7: Scope and permission records do not broaden access", () => {
  it("keeps documented and observed precedence in separate fields and never fabricates a mutation intent", () => {
    fc.assert(
      fc.property(
        // A scope whose observed precedence diverges from documented order.
        fc.constantFrom(...DOCUMENTED_SCOPE_ORDER),
        // A reversed observed order forces a documented/observed divergence
        // that must be recorded as a conflict, not silently reconciled.
        fc.boolean(),
        (divergentScope, reverseObserved) => {
          const observed = reverseObserved
            ? [...DOCUMENTED_SCOPE_ORDER].reverse()
            : [divergentScope, ...DOCUMENTED_SCOPE_ORDER.filter((scope) => scope !== divergentScope)];
          const records = DOCUMENTED_SCOPE_ORDER.map((scope) =>
            createScopeRecord(scope, scope === divergentScope ? { observedPrecedence: observed } : {}),
          );

          const result = assessScopePrecedence(createScopeInput(records));
          const map = result.output?.map;

          expect(map).toBeDefined();
          // Documented and observed precedence are always distinct projections;
          // the documented order is never overwritten by an observation.
          expect(map?.documentedOrder).toEqual(DOCUMENTED_SCOPE_ORDER);
          for (const record of map?.records ?? []) {
            expect(record).toHaveProperty("documentedPrecedence");
            expect(record).toHaveProperty("observedPrecedence");
          }
          // The mapper never manufactures an approval boundary (a mutation
          // intent) from a read-only precedence projection.
          expect(result.output?.approvalBoundaries).toEqual([]);

          // A divergent observation is a recorded conflict, never a widening.
          if (JSON.stringify(observed) !== JSON.stringify([...DOCUMENTED_SCOPE_ORDER])) {
            expect(result.status).toBe("partial");
            expect(map?.conflicts).toContain(`evidence:${divergentScope}`);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("blocks an unresolved deny-overrides-allow result for an access-broadening scope without mutation intent", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ACCESS_BROADENING_SCOPES),
        fc.constantFrom(...UNRESOLVED_DENY_OVERRIDES),
        (scope, unresolvedDeny) => {
          const records = DOCUMENTED_SCOPE_ORDER.map((candidate) =>
            createScopeRecord(candidate, candidate === scope
              ? {
                  // A scope with no confirmed deny-overrides-allow result and no
                  // observed state must not be inferred as permissive.
                  denyOverridesAllow: unresolvedDeny,
                  observedPrecedence: [],
                  evidenceRefs: [`evidence:${scope}-unresolved`],
                }
              : {}),
          );

          const result = assessScopePrecedence(createScopeInput(records));

          // An unresolved deny-overrides-allow result blocks: the stage never
          // reports a clean pass and the affected evidence stays unresolved.
          expect(result.status).toBe("partial");
          expect(result.output?.map.unresolved).toContain(`evidence:${scope}-unresolved`);
          expect(
            result.blockers.some((blocker) => blocker.includes(`${scope} deny-overrides-allow is ${unresolvedDeny}`)),
          ).toBe(true);
          // No approval boundary (mutation intent) is fabricated for the
          // unresolved global/user/external scope.
          expect(result.output?.approvalBoundaries).toEqual([]);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("blocks a pending or non-approved boundary for an access-broadening scope while preserving prior state", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ACCESS_BROADENING_SCOPES),
        fc.constantFrom(...NON_APPROVED_STATUSES),
        fc.constantFrom<KiroSurface>("IDE", "CLI 2.x", "Cloud/Crew", "Local_Repository_Surface"),
        // Optionally include recorded probe outcomes; a pending boundary must
        // still block regardless of any probe evidence.
        fc.subarray([...PROBE_OUTCOMES]),
        (scope, status, surface, probeOutcomes) => {
          const result = assessApprovalBoundaryOperation({
            boundary: createBoundary(scope, surface, status),
            permissionProbes: probeOutcomes.map((outcome) => createProbe(outcome, surface)),
          });

          // A non-approved boundary blocks the operation; access is never
          // broadened while approval is unresolved.
          expect(result.status).toBe("blocked");
          expect(result.output?.canProceed).toBe(false);
          // Prior state is always preserved: there is no mutation intent.
          expect(result.output?.preservedPriorState).toBe(true);
          expect(
            result.blockers.some((blocker) =>
              blocker.includes(`approval boundary is ${status} and blocks the operation`),
            ),
          ).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("does not let a recorded permission probe outcome escalate an unapproved boundary", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ACCESS_BROADENING_SCOPES),
        // Even an "allowed" probe outcome cannot substitute for owner approval.
        fc.constantFrom(...PROBE_OUTCOMES),
        fc.constantFrom(...NON_APPROVED_STATUSES),
        (scope, probeOutcome, status) => {
          const result = assessApprovalBoundaryOperation({
            boundary: createBoundary(scope, "IDE", status),
            permissionProbes: [createProbe(probeOutcome, "IDE")],
            requiredProbeOutcomes: [probeOutcome],
          });

          // A satisfied probe requirement never widens access on its own: the
          // unapproved boundary keeps the operation blocked and side-effect-free.
          expect(result.status).toBe("blocked");
          expect(result.output?.canProceed).toBe(false);
          expect(result.output?.preservedPriorState).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("permits only a fully approved, rollback-ready boundary and never broadens beyond its recorded inputs", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ACCESS_BROADENING_SCOPES),
        fc.subarray([...PROBE_OUTCOMES], { minLength: 1 }),
        (scope, requiredOutcomes) => {
          const boundary = createBoundary(scope, "IDE", "approved");
          const result = assessApprovalBoundaryOperation({
            boundary,
            permissionProbes: requiredOutcomes.map((outcome) => createProbe(outcome, "IDE")),
            requiredProbeOutcomes: requiredOutcomes,
          });

          // A complete approved boundary with all required outcomes recorded
          // may proceed, but the assessment only reflects its recorded inputs:
          // the surface, scope, and probes are echoed, never widened.
          expect(result.status).toBe("pass");
          expect(result.output?.canProceed).toBe(true);
          expect(result.output?.preservedPriorState).toBe(true);
          expect(result.output?.boundary.scope).toBe(scope);
          expect(result.output?.boundary.targetSurface).toBe("IDE");
          const recordedOutcomes = new Set(result.output?.permissionProbes.map((probe) => probe.outcome));
          for (const outcome of requiredOutcomes) {
            expect(recordedOutcomes.has(outcome)).toBe(true);
          }
          // The assessment records no probe outcome that was not supplied.
          for (const outcome of recordedOutcomes) {
            expect(requiredOutcomes).toContain(outcome);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
