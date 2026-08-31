// @vitest-environment node
// Feature: site-ui-content-links-audit, Property 4: Authorization-lane non-escalation

/**
 * Property-based test for the authorization-lane non-escalation contract
 * (Task 1.10 implementation).
 *
 * **Validates: Requirements 4.1-4.6, 15.3, 15.7, 16.7, 17.8, 26.10**
 *
 * Property 4 states: for any evidence or requested operation, static evidence
 * shall never satisfy a runtime claim, and protected work lacking both exact
 * current-session authorization and a permitting hook decision shall remain
 * unexecuted with `blocked` or `not-run`, the exact pending operation, and
 * explicit claim basis.
 *
 * The four sub-properties verified here are:
 *
 * 1. **Static-only evidence cannot satisfy a runtime claim (Req 4.2, 4.6):**
 *    An EvidenceRecord with `claimBasis: "source-observed"` or
 *    `"source-inferred-expectation"` and `evidenceLane: "static-inspection"`
 *    must never be accepted as a valid runtime observation, regardless of any
 *    other field values.
 *
 * 2. **Missing authorization → unexecuted with not-run or blocked (Req 4.3):**
 *    When `authorizedInCurrentSession` is false or the `authorization` field is
 *    absent entirely, the EvidenceRecord's `resultClassification` must be
 *    `"not-run"` or `"blocked"`, and `blockers` must record the exact pending
 *    operation and claim basis.
 *
 * 3. **Denied authorization → unexecuted with blocked (Req 4.5):**
 *    When `hookDecision` is `"deny"`, the record must carry
 *    `resultClassification: "blocked"` and a blocker with a non-empty
 *    `pendingOperation` and `detail`.  No `executedAt` or `exitStatus` is
 *    permitted on the Authorization Evidence itself.
 *
 * 4. **Authorization lane is monotone: once denied, static evidence cannot
 *    unblock downstream steps (Req 4.4, 4.6):**
 *    Escalating a denied authorization by supplying a static-evidence
 *    `claimBasis` must still produce an invalid EvidenceRecord — the schema
 *    rejects any record that combines `hookDecision: "deny"` with a
 *    non-blocked result.
 *
 * All generated inputs are abstract audit schema records — not product
 * fixtures and not claims about rendered application behavior.
 * No `site/**` import is used.
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  AUDIT_SCHEMA_VERSION,
  AuthorizationEvidenceSchema,
  BlockerDetailSchema,
  EvidenceRecordSchema,
  parseAuditRecord,
  type AuthorizationEvidence,
  type BlockerDetail,
} from "../../scripts/site-ui-content-links-audit/schemas";

// ---------------------------------------------------------------------------
// Constants and shared fixtures
// ---------------------------------------------------------------------------

const SCHEMA_V = AUDIT_SCHEMA_VERSION;
const BASE_TIMESTAMP = "2026-08-23T12:00:00.000Z";
const LATER_TIMESTAMP = "2026-08-23T13:00:00.000Z";
const REPO_ROOT = "/workspace";

/** Build a minimal record envelope. */
function envelope(recordId: string) {
  return {
    schemaVersion: SCHEMA_V,
    recordId,
    createdAt: BASE_TIMESTAMP,
  } as const;
}

// ---------------------------------------------------------------------------
// Arbitraries: authorization scenario dimensions
// ---------------------------------------------------------------------------

/** Authorization contexts that represent "authorized in current session". */
const ARB_AUTHORIZED_IN_SESSION: fc.Arbitrary<boolean> = fc.boolean();

/**
 * Hook decision values.  "not-observed" is included because a hook decision
 * that is not-observed must not be treated as a permit for executed work.
 */
const ARB_HOOK_DECISION: fc.Arbitrary<AuthorizationEvidence["hookDecision"]> =
  fc.constantFrom("permit", "deny", "not-observed");

/** Evidence lane values. */
const ARB_EVIDENCE_LANE: fc.Arbitrary<"static-inspection" | "protected-runtime"> =
  fc.constantFrom("static-inspection", "protected-runtime");

/**
 * Claim basis values.  The critical property is that "runtime-observed" is the
 * only basis allowed for actual runtime work.
 */
const ARB_CLAIM_BASIS: fc.Arbitrary<
  "source-observed" | "source-inferred-expectation" | "runtime-observed"
> = fc.constantFrom(
  "source-observed",
  "source-inferred-expectation",
  "runtime-observed",
);

/** Non-empty string generator for identifiers. */
const ARB_ID = fc.stringMatching(/^[a-z][a-z0-9-]{2,15}$/);

/** Result classifications relevant to unexecuted protected work. */
const ARB_UNEXECUTED_RESULT: fc.Arbitrary<"blocked" | "not-run"> = fc.constantFrom(
  "blocked",
  "not-run",
);

/** Result classifications that would wrongly claim execution succeeded. */
const ARB_EXECUTED_RESULT: fc.Arbitrary<
  "conforming" | "nonconforming" | "requires-owner-decision"
> = fc.constantFrom("conforming", "nonconforming", "requires-owner-decision");

/** Blocker kind values. */
const ARB_BLOCKER_KIND: fc.Arbitrary<BlockerDetail["blockerKind"]> = fc.constantFrom(
  "authorization",
  "hook-denial",
  "permission",
  "fixture",
  "credential",
  "environment",
  "command",
);

// ---------------------------------------------------------------------------
// Arbitrary: well-formed AuthorizationEvidence
// ---------------------------------------------------------------------------

interface AuthScenario {
  readonly authorizedInCurrentSession: boolean;
  readonly hookDecision: AuthorizationEvidence["hookDecision"];
  readonly occurrenceId: string;
  readonly operationId: string;
}

/** A complete authorization evidence envelope for the given scenario. */
function buildAuthorizationEvidence(
  scenario: AuthScenario,
  includeExecution: boolean,
): AuthorizationEvidence {
  const base: AuthorizationEvidence = {
    operationId: scenario.operationId,
    exactOperation: `pnpm exec playwright test --project=chromium --grep ${scenario.occurrenceId}`,
    authorizationStatement: scenario.authorizedInCurrentSession
      ? "User explicitly authorized this operation in the current session."
      : "No current-session authorization present.",
    authorizedInCurrentSession: scenario.authorizedInCurrentSession,
    repositoryRoot: REPO_ROOT,
    hookName: "block-agent-tests",
    hookDecision: scenario.hookDecision,
    requestedAt: BASE_TIMESTAMP,
    targetEnvironment: "local",
    affectedOccurrenceIds: [scenario.occurrenceId],
    credentialOrFixtureNeeds: [],
    outputLocations: [],
    limitations: ["Chromium only; no AT coverage."],
  };
  // Only add executedAt / exitStatus when permitted (permit + authorized)
  if (includeExecution && scenario.hookDecision === "permit" && scenario.authorizedInCurrentSession) {
    return {
      ...base,
      executedAt: LATER_TIMESTAMP,
      exitStatus: 0,
    };
  }
  return base;
}

/** Build a valid blocker array for unexecuted protected operations. */
function buildBlockers(
  pendingOperation: string,
  blockerKind: BlockerDetail["blockerKind"],
): BlockerDetail[] {
  return [
    {
      blockerKind,
      detail: `Operation requires exact current-session authorization. Kind: ${blockerKind}.`,
      pendingOperation,
    },
  ];
}

// ---------------------------------------------------------------------------
// Composite arbitrary: a full authorization scenario
// ---------------------------------------------------------------------------

interface AuthorizationScenario {
  readonly authorizedInCurrentSession: boolean;
  readonly hookDecision: AuthorizationEvidence["hookDecision"];
  readonly occurrenceId: string;
  readonly operationId: string;
  readonly blockerKind: BlockerDetail["blockerKind"];
  readonly evidenceLane: "static-inspection" | "protected-runtime";
  readonly claimBasis: "source-observed" | "source-inferred-expectation" | "runtime-observed";
}

const ARB_AUTH_SCENARIO: fc.Arbitrary<AuthorizationScenario> = fc
  .tuple(
    ARB_AUTHORIZED_IN_SESSION,
    ARB_HOOK_DECISION,
    ARB_ID,
    ARB_ID,
    ARB_BLOCKER_KIND,
    ARB_EVIDENCE_LANE,
    ARB_CLAIM_BASIS,
  )
  .map(
    ([authorizedInCurrentSession, hookDecision, occId, opId, blockerKind, lane, claim]) => ({
      authorizedInCurrentSession,
      hookDecision,
      occurrenceId: `occurrence.${occId}`,
      operationId: `op.${opId}`,
      blockerKind,
      evidenceLane: lane,
      claimBasis: claim,
    }),
  );

// ---------------------------------------------------------------------------
// Helper: build a minimal valid evidence record base (static inspection lane)
// ---------------------------------------------------------------------------

function staticEvidenceBase(
  recordId: string,
  occurrenceId: string,
  claimBasis: "source-observed" | "source-inferred-expectation",
) {
  return {
    ...envelope(recordId),
    recordType: "evidence" as const,
    evidenceId: `evid.${recordId}`,
    findingId: `finding.${occurrenceId}`,
    occurrenceId,
    route: "/test-route",
    concreteUrl: "/test-route/",
    productSurface: "marketing" as const,
    stateVariant: "default",
    viewportProfile: "desktop-1440",
    browserProfile: "chrome-latest",
    accessContext: "public-guest",
    languageContext: "en" as const,
    auditDimension: "route-and-link-integrity",
    expectedResult: "Route resolves to a 200 OK response.",
    observedResult: "Source declares route pattern exists.",
    claimBasis,
    resultClassification: "conforming" as const,
    severity: "advisory" as const,
    severityRationale: "Static evidence only; no runtime observation.",
    userImpact: "No measured user impact from static inspection.",
    evidenceLane: "static-inspection" as const,
    evidenceType: "source-declaration",
    sourceOrRuntimeLocation: "site/app/test-route/page.tsx",
    capturedAt: BASE_TIMESTAMP,
    reproductionSteps: ["Read site/app/test-route/page.tsx and verify route pattern."],
    evidenceReferences: ["source.app-router"],
    requirementIds: ["4.2"],
    proposedOutcome: "Confirm route at runtime when authorized.",
    likelyOwner: "team.frontend",
    verificationMethod: "Static source inspection.",
  };
}

// ---------------------------------------------------------------------------
// Property 1: Static-only evidence cannot satisfy a runtime claim
// ---------------------------------------------------------------------------

describe(
  "Feature: site-ui-content-links-audit, Property 4: Authorization-lane non-escalation",
  () => {
    it(
      "Feature: site-ui-content-links-audit, Property 4: Authorization-lane non-escalation — static-only evidence never satisfies a runtime claim (Req 4.2, 4.6)",
      () => {
        /**
         * **Validates: Requirements 4.2, 4.6**
         *
         * An EvidenceRecord with `claimBasis: "source-observed"` or
         * `"source-inferred-expectation"` must always be on the
         * `"static-inspection"` lane.  The schema rejects any record that
         * combines a static claim basis with `"protected-runtime"` lane, and
         * it also rejects a record that combines a runtime claim basis with
         * `"static-inspection"` lane.  This enforces the boundary: static
         * evidence can never "upgrade" itself to satisfy a runtime claim.
         */
        fc.assert(
          fc.property(
            ARB_ID,
            ARB_ID,
            fc.constantFrom("source-observed" as const, "source-inferred-expectation" as const),
            (recordId, occurrenceId, staticClaimBasis) => {
              const fullOccurrenceId = `occurrence.${occurrenceId}`;

              // ── Case A: valid static record on static lane (must parse) ──
              const staticRecord = {
                ...staticEvidenceBase(`ev-${recordId}-static`, fullOccurrenceId, staticClaimBasis),
                // static lane is correct for static claim basis
              };

              const staticResult = EvidenceRecordSchema.safeParse(staticRecord);
              // A well-formed static evidence record is valid.
              expect(
                staticResult.success,
                `Static evidence record with claimBasis="${staticClaimBasis}" and evidenceLane="static-inspection" must be valid. Errors: ${JSON.stringify(staticResult.error?.errors)}`,
              ).toBe(true);

              // ── Case B: static claim basis with protected-runtime lane (must fail) ──
              const escalatedRecord = {
                ...staticRecord,
                recordId: `ev-${recordId}-escalated`,
                evidenceId: `evid.ev-${recordId}-escalated`,
                // Attempting to "upgrade" the lane while keeping a static claim basis
                evidenceLane: "protected-runtime",
              };

              const escalatedResult = EvidenceRecordSchema.safeParse(escalatedRecord);
              // Escalation must be rejected.
              expect(
                escalatedResult.success,
                `Static-claim evidence with evidenceLane="protected-runtime" must be INVALID (cannot escalate lane). Got: ${JSON.stringify(escalatedResult)}`,
              ).toBe(false);

              // The rejection must reference the static-lane requirement.
              const escalatedErrors = escalatedResult.error?.errors ?? [];
              const hasStaticLaneIssue = escalatedErrors.some(
                (e) =>
                  e.message === "AUDIT_SCHEMA_STATIC_CLAIM_REQUIRES_STATIC_LANE" ||
                  e.path.includes("evidenceLane"),
              );
              expect(
                hasStaticLaneIssue,
                `Escalation rejection must cite evidenceLane or AUDIT_SCHEMA_STATIC_CLAIM_REQUIRES_STATIC_LANE. Got: ${JSON.stringify(escalatedErrors)}`,
              ).toBe(true);

              // ── Case C: runtime-observed claim on static lane (must fail) ──
              const runtimeClaimOnStaticLane = {
                ...staticRecord,
                recordId: `ev-${recordId}-rt-claim`,
                evidenceId: `evid.ev-${recordId}-rt-claim`,
                claimBasis: "runtime-observed" as const,
                // Lane remains static — the schema must reject this combination
                evidenceLane: "static-inspection" as const,
              };

              const runtimeClaimOnStaticResult = EvidenceRecordSchema.safeParse(
                runtimeClaimOnStaticLane,
              );
              expect(
                runtimeClaimOnStaticResult.success,
                `runtime-observed claim on static-inspection lane must be INVALID. Got: ${JSON.stringify(runtimeClaimOnStaticResult)}`,
              ).toBe(false);

              const runtimeClaimErrors = runtimeClaimOnStaticResult.error?.errors ?? [];
              const hasRuntimeLaneIssue = runtimeClaimErrors.some(
                (e) =>
                  e.message === "AUDIT_SCHEMA_RUNTIME_CLAIM_REQUIRES_PROTECTED_LANE" ||
                  e.path.includes("evidenceLane"),
              );
              expect(
                hasRuntimeLaneIssue,
                `Runtime-claim on static lane must cite evidenceLane or AUDIT_SCHEMA_RUNTIME_CLAIM_REQUIRES_PROTECTED_LANE. Got: ${JSON.stringify(runtimeClaimErrors)}`,
              ).toBe(true);
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    // ---------------------------------------------------------------------------
    // Property 2: Missing authorization → not-run or blocked (Req 4.3, 4.4)
    // ---------------------------------------------------------------------------

    it(
      "Feature: site-ui-content-links-audit, Property 4: Authorization-lane non-escalation — missing or absent authorization yields not-run or blocked with exact pending work (Req 4.3, 4.4)",
      () => {
        /**
         * **Validates: Requirements 4.3, 4.4**
         *
         * When `authorizedInCurrentSession` is false, or when no authorization
         * envelope is present at all for a protected-runtime operation, the
         * EvidenceRecord must carry `resultClassification` of `"not-run"` or
         * `"blocked"` and a non-empty `blockers` array recording the exact
         * pending operation.  Any other resultClassification (conforming,
         * nonconforming, etc.) must be invalid.
         */
        fc.assert(
          fc.property(
            ARB_ID,
            ARB_ID,
            ARB_BLOCKER_KIND,
            ARB_UNEXECUTED_RESULT,
            ARB_EXECUTED_RESULT,
            (recordId, occurrenceId, blockerKind, unexecutedResult, executedResult) => {
              const fullOccurrenceId = `occurrence.${occurrenceId}`;
              const pendingOp = `pnpm exec playwright test --project=chromium --grep ${fullOccurrenceId}`;

              const blockers = buildBlockers(pendingOp, blockerKind);

              // ── Case A: not-run/blocked with blockers (must be valid) ──
              const notRunRecord = {
                ...staticEvidenceBase(`ev-${recordId}-nr`, fullOccurrenceId, "source-inferred-expectation"),
                recordId: `ev-${recordId}-nr`,
                evidenceId: `evid.ev-${recordId}-nr`,
                claimBasis: "source-inferred-expectation" as const,
                evidenceLane: "static-inspection" as const,
                resultClassification: unexecutedResult,
                severity: "not-applicable" as const,
                severityRationale: "Operation not executed; no runtime observation.",
                notApplicableRationale:
                  unexecutedResult === "not-run"
                    ? "Protected runtime work not run: no current-session authorization."
                    : undefined,
                blockers,
                observedResult: `Operation ${unexecutedResult}: ${pendingOp}`,
              };

              const notRunResult = EvidenceRecordSchema.safeParse(notRunRecord);
              expect(
                notRunResult.success,
                `A ${unexecutedResult} evidence record with blockers must be valid. Errors: ${JSON.stringify(notRunResult.error?.errors)}`,
              ).toBe(true);

              // ── Case B: "executed" result without authorization (must fail) ──
              const unauthorizedExecutedRecord = {
                ...staticEvidenceBase(`ev-${recordId}-unauth`, fullOccurrenceId, "runtime-observed"),
                recordId: `ev-${recordId}-unauth`,
                evidenceId: `evid.ev-${recordId}-unauth`,
                claimBasis: "runtime-observed" as const,
                evidenceLane: "protected-runtime" as const,
                resultClassification: executedResult,
                // No authorization envelope supplied
              };

              const unauthorizedExecutedResult = EvidenceRecordSchema.safeParse(
                unauthorizedExecutedRecord,
              );
              expect(
                unauthorizedExecutedResult.success,
                `A runtime-observed record with resultClassification="${executedResult}" and no authorization must be INVALID. Got: ${JSON.stringify(unauthorizedExecutedResult)}`,
              ).toBe(false);

              const unauthorizedErrors = unauthorizedExecutedResult.error?.errors ?? [];
              const hasAuthIssue = unauthorizedErrors.some(
                (e) =>
                  e.message === "AUDIT_SCHEMA_RUNTIME_AUTHORIZATION_REQUIRED" ||
                  e.path.includes("authorization"),
              );
              expect(
                hasAuthIssue,
                `Missing authorization must produce AUDIT_SCHEMA_RUNTIME_AUTHORIZATION_REQUIRED. Got: ${JSON.stringify(unauthorizedErrors)}`,
              ).toBe(true);
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    // ---------------------------------------------------------------------------
    // Property 3: Denied authorization → blocked, pending recorded (Req 4.5, 4.3)
    // ---------------------------------------------------------------------------

    it(
      "Feature: site-ui-content-links-audit, Property 4: Authorization-lane non-escalation — hook denial yields blocked with non-empty pending operation and no execution (Req 4.5, 4.3)",
      () => {
        /**
         * **Validates: Requirements 4.3, 4.5**
         *
         * When `hookDecision` is `"deny"`, the AuthorizationEvidence must carry
         * neither `executedAt` nor `exitStatus`.  The enclosing EvidenceRecord
         * must carry `resultClassification: "blocked"` (or `"not-run"`) and a
         * non-empty `blockers` array with `pendingOperation` and `detail` present.
         *
         * Attempting to set resultClassification to anything other than blocked/
         * not-run while the hook denied must be schema-invalid.
         */
        fc.assert(
          fc.property(
            ARB_ID,
            ARB_ID,
            ARB_BLOCKER_KIND,
            ARB_EXECUTED_RESULT,
            (recordId, occurrenceId, blockerKind, executedResult) => {
              const fullOccurrenceId = `occurrence.${occurrenceId}`;
              const opId = `op.${recordId}`;
              const pendingOp = `pnpm exec playwright test --project=chromium --grep ${fullOccurrenceId}`;

              // ── Build a denied authorization envelope ──────────────────────
              const deniedAuth: AuthorizationEvidence = {
                operationId: opId,
                exactOperation: pendingOp,
                authorizationStatement:
                  "Authorization requested but hook denied execution.",
                authorizedInCurrentSession: true,
                repositoryRoot: REPO_ROOT,
                hookName: "block-agent-tests",
                hookDecision: "deny",
                requestedAt: BASE_TIMESTAMP,
                targetEnvironment: "local",
                affectedOccurrenceIds: [fullOccurrenceId],
                credentialOrFixtureNeeds: [],
                outputLocations: [],
                limitations: [
                  "block-agent-tests hook denied; operation remains unexecuted.",
                ],
                // No executedAt or exitStatus — denial must be unexecuted
              };

              // ── Case A: denied auth envelope itself must be valid ──────────
              const authResult = AuthorizationEvidenceSchema.safeParse(deniedAuth);
              expect(
                authResult.success,
                `Denied authorization without executedAt/exitStatus must be valid. Errors: ${JSON.stringify(authResult.error?.errors)}`,
              ).toBe(true);

              // ── Case B: denied auth with executedAt must be invalid ────────
              const deniedAuthWithExecution = {
                ...deniedAuth,
                executedAt: LATER_TIMESTAMP,
                exitStatus: 0,
              };
              const authWithExecResult =
                AuthorizationEvidenceSchema.safeParse(deniedAuthWithExecution);
              expect(
                authWithExecResult.success,
                `Denied authorization with executedAt must be INVALID. Got: ${JSON.stringify(authWithExecResult)}`,
              ).toBe(false);

              // ── Case C: blocked evidence with denied auth (must be valid) ──
              const blockedEvidence = {
                ...staticEvidenceBase(`ev-${recordId}-blk`, fullOccurrenceId, "source-inferred-expectation"),
                recordId: `ev-${recordId}-blk`,
                evidenceId: `evid.ev-${recordId}-blk`,
                claimBasis: "source-inferred-expectation" as const,
                evidenceLane: "static-inspection" as const,
                resultClassification: "blocked" as const,
                severity: "not-applicable" as const,
                severityRationale: "Hook denied; no execution occurred.",
                notApplicableRationale: undefined,
                blockers: [
                  {
                    blockerKind: "hook-denial" as const,
                    detail:
                      "block-agent-tests hook denied execution of the protected operation.",
                    pendingOperation: pendingOp,
                  },
                ],
                authorization: deniedAuth,
                observedResult: `Hook denied: ${pendingOp}`,
              };

              const blockedResult = EvidenceRecordSchema.safeParse(blockedEvidence);
              expect(
                blockedResult.success,
                `Blocked evidence with denied auth must be valid. Errors: ${JSON.stringify(blockedResult.error?.errors)}`,
              ).toBe(true);

              // ── Case D: non-blocked result with denied auth must be invalid ─
              const escalatedResult = {
                ...staticEvidenceBase(`ev-${recordId}-esc`, fullOccurrenceId, "source-inferred-expectation"),
                recordId: `ev-${recordId}-esc`,
                evidenceId: `evid.ev-${recordId}-esc`,
                claimBasis: "source-inferred-expectation" as const,
                evidenceLane: "static-inspection" as const,
                resultClassification: executedResult,
                authorization: deniedAuth,
                observedResult: "Attempted to classify as executed despite denial.",
              };

              const escalatedParseResult = EvidenceRecordSchema.safeParse(escalatedResult);
              expect(
                escalatedParseResult.success,
                `Non-blocked result with denied authorization must be INVALID. Got: ${JSON.stringify(escalatedParseResult)}`,
              ).toBe(false);

              const escalatedErrors = escalatedParseResult.error?.errors ?? [];
              const hasDenialIssue = escalatedErrors.some(
                (e) =>
                  e.message ===
                    "AUDIT_SCHEMA_DENIED_AUTHORIZATION_REQUIRES_BLOCKED_RESULT" ||
                  e.path.includes("resultClassification"),
              );
              expect(
                hasDenialIssue,
                `Denied-auth escalation must cite AUDIT_SCHEMA_DENIED_AUTHORIZATION_REQUIRES_BLOCKED_RESULT or resultClassification. Got: ${JSON.stringify(escalatedErrors)}`,
              ).toBe(true);

              // ── Case E: blockers must carry non-empty pendingOperation ──────
              const blockerValidationResult = BlockerDetailSchema.safeParse(
                blockedEvidence.blockers[0],
              );
              expect(
                blockerValidationResult.success,
                `Blocker with non-empty pendingOperation must be valid. Errors: ${JSON.stringify(blockerValidationResult.error?.errors)}`,
              ).toBe(true);

              const blockerData = blockerValidationResult.data!;
              expect(blockerData.pendingOperation.trim().length).toBeGreaterThan(0);
              expect(blockerData.detail.trim().length).toBeGreaterThan(0);
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    // ---------------------------------------------------------------------------
    // Property 4: Monotone lane — static evidence cannot unblock downstream
    //             steps after denial (Req 4.4, 4.6)
    // ---------------------------------------------------------------------------

    it(
      "Feature: site-ui-content-links-audit, Property 4: Authorization-lane non-escalation — once denied, no static-evidence combination can unblock downstream execution (Req 4.4, 4.6)",
      () => {
        /**
         * **Validates: Requirements 4.4, 4.6**
         *
         * The authorization lane is monotone: once a hook denies an operation or
         * authorization is absent, no combination of static evidence — regardless
         * of claimBasis, result classification, or how many evidence records are
         * supplied — can produce a valid runtime-observed record.
         *
         * This property generates many combinations of:
         *  - (authorizedInCurrentSession, hookDecision) that do NOT constitute
         *    valid runtime authorization, and
         *  - (evidenceLane, claimBasis, resultClassification) chosen to maximally
         *    probe the boundary
         *
         * and confirms that every such combination fails schema validation for a
         * runtime claim.
         */
        fc.assert(
          fc.property(
            ARB_ID,
            ARB_ID,
            // Hook decisions that cannot authorize execution
            fc.constantFrom("deny" as const, "not-observed" as const),
            // Session authorization state (both true and false)
            fc.boolean(),
            ARB_BLOCKER_KIND,
            (recordId, occurrenceId, hookDecision, authorizedInCurrentSession, blockerKind) => {
              const fullOccurrenceId = `occurrence.${occurrenceId}`;
              const opId = `op.${recordId}`;
              const pendingOp = `pnpm exec playwright test --project=chromium --grep ${fullOccurrenceId}`;

              // Authorization envelope that does NOT constitute a valid runtime permit
              const nonPermitAuth: AuthorizationEvidence = {
                operationId: opId,
                exactOperation: pendingOp,
                authorizationStatement: authorizedInCurrentSession
                  ? "Authorized in session but hook denied."
                  : "No current-session authorization.",
                authorizedInCurrentSession,
                repositoryRoot: REPO_ROOT,
                hookName: "block-agent-tests",
                hookDecision,
                requestedAt: BASE_TIMESTAMP,
                targetEnvironment: "local",
                affectedOccurrenceIds: [fullOccurrenceId],
                credentialOrFixtureNeeds: [],
                outputLocations: [],
                limitations: ["Non-permitting authorization; work must remain unexecuted."],
                // Deliberately NO executedAt/exitStatus — the work was not run
              };

              // ── Attempt A: runtime-observed claim with non-permitting auth ──
              // This must always be invalid regardless of the evidence lane.
              const attemptRuntimeClaim = {
                ...staticEvidenceBase(`ev-${recordId}-mono`, fullOccurrenceId, "source-inferred-expectation"),
                recordId: `ev-${recordId}-mono`,
                evidenceId: `evid.ev-${recordId}-mono`,
                claimBasis: "runtime-observed" as const,
                evidenceLane: "protected-runtime" as const,
                resultClassification: "conforming" as const,
                authorization: nonPermitAuth,
                observedResult: "Attempting to claim runtime success without permit.",
              };

              const runtimeClaimResult = EvidenceRecordSchema.safeParse(attemptRuntimeClaim);
              expect(
                runtimeClaimResult.success,
                `runtime-observed claim with hookDecision="${hookDecision}" and authorizedInCurrentSession=${authorizedInCurrentSession} must be INVALID. Got: ${JSON.stringify(runtimeClaimResult)}`,
              ).toBe(false);

              // ── Attempt B: static claim basis with non-permitting auth (monotone) ──
              // Even providing a valid static record with the non-permitting auth
              // attached must NOT produce a conforming result when result implies
              // execution (which static can never guarantee).
              // Here we verify that denied-auth always requires blocked/not-run.
              if (hookDecision === "deny") {
                const staticWithDeniedAuth = {
                  ...staticEvidenceBase(`ev-${recordId}-mono-s`, fullOccurrenceId, "source-inferred-expectation"),
                  recordId: `ev-${recordId}-mono-s`,
                  evidenceId: `evid.ev-${recordId}-mono-s`,
                  claimBasis: "source-inferred-expectation" as const,
                  evidenceLane: "static-inspection" as const,
                  resultClassification: "conforming" as const,
                  authorization: nonPermitAuth,
                  observedResult: "Attempting to claim conforming via static despite denial.",
                };

                const staticDeniedResult = EvidenceRecordSchema.safeParse(staticWithDeniedAuth);
                expect(
                  staticDeniedResult.success,
                  `Static-evidence conforming result with denied auth must be INVALID (monotone). Got: ${JSON.stringify(staticDeniedResult)}`,
                ).toBe(false);

                // Error must reference the denial/result mismatch
                const staticDeniedErrors = staticDeniedResult.error?.errors ?? [];
                const hasMismatchIssue = staticDeniedErrors.some(
                  (e) =>
                    e.message === "AUDIT_SCHEMA_DENIED_AUTHORIZATION_REQUIRES_BLOCKED_RESULT" ||
                    e.path.includes("resultClassification"),
                );
                expect(
                  hasMismatchIssue,
                  `Monotone violation must cite AUDIT_SCHEMA_DENIED_AUTHORIZATION_REQUIRES_BLOCKED_RESULT. Got: ${JSON.stringify(staticDeniedErrors)}`,
                ).toBe(true);
              }

              // ── Attempt C: blocked/not-run with non-permitting auth (correct path) ──
              const correctUnexecuted = {
                ...staticEvidenceBase(`ev-${recordId}-correct`, fullOccurrenceId, "source-inferred-expectation"),
                recordId: `ev-${recordId}-correct`,
                evidenceId: `evid.ev-${recordId}-correct`,
                claimBasis: "source-inferred-expectation" as const,
                evidenceLane: "static-inspection" as const,
                resultClassification: hookDecision === "deny" ? ("blocked" as const) : ("not-run" as const),
                severity: "not-applicable" as const,
                severityRationale:
                  hookDecision === "deny"
                    ? "Hook denied; blocked."
                    : "No authorization; not-run.",
                notApplicableRationale:
                  hookDecision === "deny"
                    ? undefined
                    : "Protected work not executed: authorization absent.",
                blockers: [
                  {
                    blockerKind: hookDecision === "deny" ? ("hook-denial" as const) : blockerKind,
                    detail:
                      hookDecision === "deny"
                        ? "block-agent-tests hook denied execution."
                        : "No current-session authorization supplied.",
                    pendingOperation: pendingOp,
                  },
                ],
                authorization: nonPermitAuth,
                observedResult: `Operation ${hookDecision === "deny" ? "blocked by hook denial" : "not-run: no authorization"}: ${pendingOp}`,
              };

              const correctResult = EvidenceRecordSchema.safeParse(correctUnexecuted);
              expect(
                correctResult.success,
                `A ${correctUnexecuted.resultClassification} record with non-permitting auth must be valid. Errors: ${JSON.stringify(correctResult.error?.errors)}`,
              ).toBe(true);
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    // ---------------------------------------------------------------------------
    // Property 5: Pending-operation completeness — every denied/missing case
    //             records exact pending work and claim basis (Req 4.3, 26.10)
    // ---------------------------------------------------------------------------

    it(
      "Feature: site-ui-content-links-audit, Property 4: Authorization-lane non-escalation — every denied/missing authorization case records exact pending work and claim basis (Req 4.3, 26.10)",
      () => {
        /**
         * **Validates: Requirements 4.3, 26.10**
         *
         * Every not-run or blocked record must carry:
         *   - at least one blocker with a non-empty `pendingOperation`
         *   - a non-empty `detail` describing the missing authorization
         *   - a `claimBasis` that is static (not "runtime-observed"), since
         *     the work was not performed
         *
         * This property generates varied authorization denial combinations and
         * verifies that the schema contract enforces complete pending-work records.
         */
        fc.assert(
          fc.property(
            ARB_ID,
            ARB_ID,
            ARB_BLOCKER_KIND,
            ARB_UNEXECUTED_RESULT,
            fc.array(fc.stringMatching(/^[a-z0-9:._/-]{4,40}$/), {
              minLength: 1,
              maxLength: 3,
            }),
            (recordId, occurrenceId, blockerKind, unexecutedResult, pendingOpSuffixes) => {
              const fullOccurrenceId = `occurrence.${occurrenceId}`;
              // Build distinct, non-empty pending operation strings
              const pendingOperations = pendingOpSuffixes.map(
                (suffix) =>
                  `pnpm exec playwright test --project=chromium --grep ${suffix}`,
              );
              const primaryPendingOp = pendingOperations[0]!;

              // ── Case A: blocker with empty pendingOperation must be invalid ──
              const emptyPendingOpBlocker = {
                blockerKind,
                detail: "Authorization missing.",
                pendingOperation: "   ",
              };
              const emptyPendingResult = BlockerDetailSchema.safeParse(emptyPendingOpBlocker);
              expect(
                emptyPendingResult.success,
                `A blocker with whitespace-only pendingOperation must be INVALID. Got: ${JSON.stringify(emptyPendingResult)}`,
              ).toBe(false);

              // ── Case B: blocker with empty detail must be invalid ──────────
              const emptyDetailBlocker = {
                blockerKind,
                detail: "",
                pendingOperation: primaryPendingOp,
              };
              const emptyDetailResult = BlockerDetailSchema.safeParse(emptyDetailBlocker);
              expect(
                emptyDetailResult.success,
                `A blocker with empty detail must be INVALID. Got: ${JSON.stringify(emptyDetailResult)}`,
              ).toBe(false);

              // ── Case C: well-formed blockers must all be valid ────────────
              const wellFormedBlockers: BlockerDetail[] = pendingOperations.map((op, i) => ({
                blockerKind: i === 0 ? "authorization" as const : blockerKind,
                detail: `Pending operation ${i + 1}: authorization and hook permit required.`,
                pendingOperation: op,
              }));

              for (const blocker of wellFormedBlockers) {
                const blockerResult = BlockerDetailSchema.safeParse(blocker);
                expect(
                  blockerResult.success,
                  `Well-formed blocker must be valid. Errors: ${JSON.stringify(blockerResult.error?.errors)}`,
                ).toBe(true);
                expect(blockerResult.data!.pendingOperation.trim().length).toBeGreaterThan(0);
                expect(blockerResult.data!.detail.trim().length).toBeGreaterThan(0);
              }

              // ── Case D: not-run/blocked record with valid blockers and
              //           static claim basis is always a valid record ─────────
              const notApplicableRationale =
                unexecutedResult === "not-run"
                  ? "Protected runtime work not executed: authorization absent or hook denied."
                  : undefined;

              const compliantRecord = {
                ...staticEvidenceBase(
                  `ev-${recordId}-comp`,
                  fullOccurrenceId,
                  "source-inferred-expectation",
                ),
                recordId: `ev-${recordId}-comp`,
                evidenceId: `evid.ev-${recordId}-comp`,
                claimBasis: "source-inferred-expectation" as const,
                evidenceLane: "static-inspection" as const,
                resultClassification: unexecutedResult,
                severity: "not-applicable" as const,
                severityRationale: `No execution; result is ${unexecutedResult}.`,
                notApplicableRationale,
                blockers: wellFormedBlockers,
                observedResult: `${unexecutedResult}: ${primaryPendingOp}`,
              };

              const compliantResult = EvidenceRecordSchema.safeParse(compliantRecord);
              expect(
                compliantResult.success,
                `Compliant ${unexecutedResult} record must be valid. Errors: ${JSON.stringify(compliantResult.error?.errors)}`,
              ).toBe(true);

              // Confirm every blocker on the parsed record carries non-empty fields
              for (const blocker of compliantResult.data!.blockers ?? []) {
                expect(blocker.pendingOperation.trim().length).toBeGreaterThan(0);
                expect(blocker.detail.trim().length).toBeGreaterThan(0);
              }

              // ── Case E: parseAuditRecord round-trip preserves blockers ────
              const parsed = parseAuditRecord(compliantRecord);
              expect(parsed.success).toBe(true);
              if (parsed.success) {
                const rec = parsed.record;
                if (rec.recordType === "evidence") {
                  expect((rec.blockers ?? []).length).toBeGreaterThan(0);
                  for (const blocker of rec.blockers ?? []) {
                    expect(blocker.pendingOperation.trim().length).toBeGreaterThan(0);
                  }
                }
              }
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  },
);
