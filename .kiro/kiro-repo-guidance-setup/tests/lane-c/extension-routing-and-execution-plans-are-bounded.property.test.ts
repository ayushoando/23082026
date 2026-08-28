// @vitest-environment node

// Feature: kiro-repo-guidance-setup, Property 10: Extension routing and execution
// plans are bounded.
//
// Lane C, test-authoring only. This property test drives the read-only
// capability evaluator (.kiro/kiro-repo-guidance-setup/capabilities.ts) and
// the read-only continuity/execution evaluator
// (.kiro/kiro-repo-guidance-setup/continuity.ts). Both evaluators only inspect
// supplied metadata — they never load a power, route to an MCP service, spawn an
// agent, run a command, or contact Crew. This test therefore never touches a
// source module, package.json, or results/ (except vitest's own JSON output),
// and it never performs a network or filesystem write.
//
// Property 10 (design.md): for all powers, MCP services, tools, custom agents,
// and subagents, the format and repository-answer result are recorded before
// external routing; every external boundary is named, every custom-agent
// resource is recorded or explicitly `None`, default/native task execution and
// reviewer stages use `maximumConcurrency` of 0 or 1, review iterations are
// 0..3, and missing or incompatible values produce an inactive disposition. The
// feature-only implementation wave is evaluated by Property 16 and is not
// represented by this default/native field.

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  evaluateCapabilities,
  type ExtensionCandidateInput,
} from "../../capabilities.ts";
import {
  CREW_INCOMPATIBLE_BEHAVIORS,
  GRAPH_IMPACT_MAX_ITERATIONS,
  evaluateContinuity,
  type ContinuityCapabilityInput,
  type CrewBehaviorFlags,
} from "../../continuity.ts";
import {
  OWNER_DECISIONS,
  type ExtensionKind,
  type OwnerDecision,
} from "../../contracts.ts";

const repositoryRoot = "D:\\23082026";

// A recorded (owner-approved-conditional, resolved) owner decision satisfies the
// evaluator's approval predicate. Supplying every decision lets an otherwise
// complete capability reach the `retain` (active) disposition.
const ALL_OWNER_DECISIONS: readonly OwnerDecision[] = OWNER_DECISIONS as readonly OwnerDecision[];

// Dispositions the evaluators treat as inactive / fail-closed. `retain` is the
// only active disposition for an extension or power; `observe` is used for a
// local power that is present but not yet enabled-valid.
const INACTIVE_EXTENSION_DISPOSITIONS = ["defer", "disable", "observe", "exclude"] as const;

const EXTENSION_KINDS = ["MCP_Service", "Tool_Surface", "Custom_Agent", "Subagent"] as const satisfies readonly ExtensionKind[];

// ---------------------------------------------------------------------------
// Extension candidate generators.
// ---------------------------------------------------------------------------

// The evaluator reads every field through `input as Record<string, unknown>`,
// so a candidate is modeled here as a plain mutable bag of values. This lets the
// property feed intentionally out-of-range / missing values (the whole point of
// the bound checks) without fighting the narrow public field types.
type CandidateBag = Record<string, unknown>;

/**
 * A fully specified, repository-local, bounded extension candidate. When paired
 * with owner approval it is the only shape that can legitimately reach the
 * active `retain` disposition, so it anchors the "no false negatives" side of
 * the property. Overrides may set fields to arbitrary values (including
 * `undefined` to drop them) so the evaluator's clamping can be probed.
 */
function boundedLocalExtension(
  kind: ExtensionKind,
  name: string,
  overrides: CandidateBag = {},
): ExtensionCandidateInput {
  const base: CandidateBag = {
    kind,
    name,
    canonicalSource: `.kiro/${name}`,
    configurationFormat: `${name} configuration`,
    surfaceAvailability: ["IDE", "CLI 2.x"],
    scope: "repository-local project scope",
    activation: "explicit activation after validation",
    authorityRelationship: "subordinate to repository authority",
    resourceUris: ["None"],
    dagOrReviewGraph: kind === "Subagent" ? "subagent -> bounded review" : "not applicable",
    maximumConcurrency: 1,
    iterationCeiling: 3,
    approvalBehavior: "explicit",
    failureBehavior: "fail_closed",
    repositoryCompatibility: "compatible",
    validationRunRefs: [],
    owner: "repository owner",
    rollbackPath: `disable ${name} and restore configuration`,
    trustDecision: "trusted",
    integrityResult: "pass",
    // The repository can answer, and no external routing is requested.
    repositoryAnswer: "Answered",
    externalRoutingRequested: false,
  };
  const merged: CandidateBag = { ...base, ...overrides };
  // A field explicitly overridden to `undefined` is treated as "not provided".
  for (const key of Object.keys(merged)) {
    if (merged[key] === undefined) delete merged[key];
  }
  return merged as unknown as ExtensionCandidateInput;
}

// Generator for the concurrency field: any integer, including out-of-range,
// non-integer-ish, and negative values, so the bound can be probed.
const concurrencyArb = fc.oneof(
  fc.constant(0),
  fc.constant(1),
  fc.integer({ min: 2, max: 12 }),
  fc.integer({ min: -5, max: -1 }),
);

// Generator for the review iteration ceiling: in and out of the 0..3 band.
const iterationArb = fc.oneof(
  fc.constant(0),
  fc.constant(1),
  fc.constant(2),
  fc.constant(3),
  fc.integer({ min: 4, max: 20 }),
  fc.integer({ min: -5, max: -1 }),
);

const repositoryAnswerArb = fc.constantFrom("Answered" as const, "Not_Answered" as const, "Not_Testable" as const);

const kindArb = fc.constantFrom(...EXTENSION_KINDS);

// A generator for arbitrary extension candidates, some complete and some with a
// single missing / incompatible / out-of-bounds field.
const extensionCandidateArb: fc.Arbitrary<ExtensionCandidateInput> = fc.record({
  kind: kindArb,
  maximumConcurrency: concurrencyArb,
  iterationCeiling: iterationArb,
  repositoryAnswer: repositoryAnswerArb,
  externalRoutingRequested: fc.boolean(),
  // Whether the custom-agent resource URIs are declared explicitly.
  provideResourceUris: fc.boolean(),
  // Whether the MCP service names its service/data/secret/permission boundaries.
  provideBoundaries: fc.boolean(),
  // Whether the subagent supplies a DAG / review graph.
  provideDag: fc.boolean(),
  compatibility: fc.constantFrom("compatible" as const, "incompatible" as const, "Unverified" as const),
  trust: fc.constantFrom("trusted" as const, "untrusted" as const, "unresolved" as const),
}).map((choice) => {
  const overrides: CandidateBag = {
    maximumConcurrency: choice.maximumConcurrency,
    iterationCeiling: choice.iterationCeiling,
    repositoryAnswer: choice.repositoryAnswer,
    externalRoutingRequested: choice.externalRoutingRequested,
    repositoryCompatibility: choice.compatibility,
    trustDecision: choice.trust,
    integrityResult: choice.trust === "trusted" ? "pass" : "unverified",
  };

  if (choice.kind === "Custom_Agent" && !choice.provideResourceUris) {
    // Drop the explicit resource URIs to exercise the "record every resource or
    // an explicit None" obligation.
    overrides.resourceUris = undefined;
  }

  if (choice.kind === "MCP_Service") {
    if (choice.provideBoundaries) {
      overrides.serviceAndDataBoundary = "named external service; documented data boundary";
      overrides.secretBoundary = "named secret boundary via .env.local reference";
      overrides.permissionBoundary = "named permission boundary for tool use";
    } else {
      overrides.serviceAndDataBoundary = undefined;
      overrides.secretBoundary = undefined;
      overrides.permissionBoundary = undefined;
    }
  }

  if (choice.kind === "Subagent" && !choice.provideDag) {
    overrides.dagOrReviewGraph = undefined;
  }

  return boundedLocalExtension(choice.kind, `${choice.kind.toLowerCase()}-candidate`, overrides);
});

/**
 * Route candidates to the correct evaluator input field per kind, then evaluate.
 * `evaluateCapabilities` groups MCP services, tools, custom agents, and
 * subagents into distinct input fields; all four feed the same
 * `output.extensions` list.
 */
function evaluateExtensions(candidates: readonly ExtensionCandidateInput[]) {
  const byKind = (kind: ExtensionKind): ExtensionCandidateInput[] =>
    candidates.filter((candidate) => (candidate as { kind?: ExtensionKind }).kind === kind);
  return evaluateCapabilities({
    repositoryRoot,
    mcpServices: byKind("MCP_Service"),
    tools: byKind("Tool_Surface"),
    customAgents: byKind("Custom_Agent"),
    subagents: byKind("Subagent"),
    ownerDecisions: ALL_OWNER_DECISIONS,
  });
}

// ---------------------------------------------------------------------------
// Property 10 — extension routing and bounds.
// ---------------------------------------------------------------------------

describe("Property 10: Extension routing and execution plans are bounded", () => {
  // **Validates: Requirements 8.1, 8.3, 8.4, 8.6, 8.7, 8.8, 9.2**

  it("records format and repository-answer before external routing and never attempts external routing", () => {
    fc.assert(
      fc.property(fc.array(extensionCandidateArb, { minLength: 1, maxLength: 5 }), (extensions) => {
        const result = evaluateExtensions(extensions);
        const output = result.output;
        expect(output).toBeDefined();
        if (!output) return;

        // The evaluator is static: it never routes externally.
        expect(output.externalRoutingAttempted).toBe(false);

        for (const check of output.repositoryAnswerChecks) {
          // The repository-answer check is always evaluated before routing.
          expect(check.evaluatedBeforeExternalRouting).toBe(true);
          // External routing is only ever allowed when the repository cannot
          // answer (Not_Answered) — never on Answered/Not_Testable.
          if (check.externalRoutingAllowed) {
            expect(check.result).toBe("Not_Answered");
            expect(check.externalRoutingRequested).toBe(true);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it("keeps every evaluated extension bounded and fail-closed", () => {
    fc.assert(
      fc.property(extensionCandidateArb, (candidate) => {
        const result = evaluateExtensions([candidate]);
        const record = result.output?.extensions[0];
        expect(record).toBeDefined();
        if (!record) return;

        // Concurrency is always clamped into the default/native 0..1 band.
        expect([0, 1]).toContain(record.maximumConcurrency);
        // Review iteration ceiling is always within 0..3.
        expect(record.iterationCeiling).toBeGreaterThanOrEqual(0);
        expect(record.iterationCeiling).toBeLessThanOrEqual(3);
        // Every custom-agent / extension resource URI list is non-empty; when no
        // URI applies it is the explicit `None` sentinel.
        expect(record.resourceUris.length).toBeGreaterThan(0);

        // Fail-closed: a routing attempt is only permitted when the repository
        // could not answer AND there are no recorded blockers.
        if (record.externalRoutingAllowed) {
          expect(record.repositoryAnswerCheck.result).toBe("Not_Answered");
          expect(record.blockers).toHaveLength(0);
          expect(record.external).toBe(true);
        }

        // An external MCP service that is active must carry a named service/data
        // boundary; otherwise it must be inactive.
        if (record.kind === "MCP_Service" && record.disposition === "retained") {
          expect(record.evidence.serviceAndDataBoundary).not.toBe("unavailable");
          expect(record.evidence.serviceAndDataBoundary.trim().length).toBeGreaterThan(0);
        }

        // Any recorded blocker forces an inactive (never `retain`) disposition.
        if (record.blockers.length > 0) {
          expect(INACTIVE_EXTENSION_DISPOSITIONS).toContain(record.disposition);
        }
      }),
      { numRuns: 250 },
    );
  });

  it("never marks a missing or incompatible extension as active", () => {
    // Build a candidate guaranteed to violate exactly the kind's core obligation.
    const brokenExtensionArb: fc.Arbitrary<{ readonly candidate: ExtensionCandidateInput; readonly why: string }> =
      fc.oneof(
        // Concurrency above the one-agent ceiling.
        fc.constant({
          candidate: boundedLocalExtension("Subagent", "over-concurrent", {
            maximumConcurrency: 3,
            dagOrReviewGraph: "subagent -> bounded review",
          }),
          why: "concurrency above one",
        }),
        // Review iteration ceiling out of the 0..3 band.
        fc.constant({
          candidate: boundedLocalExtension("Subagent", "over-iteration", {
            iterationCeiling: 9,
            dagOrReviewGraph: "subagent -> bounded review",
          }),
          why: "iteration ceiling above three",
        }),
        // Custom agent with no explicit resource URI record.
        fc.constant({
          candidate: boundedLocalExtension("Custom_Agent", "no-resources", { resourceUris: undefined }),
          why: "missing resource URI record",
        }),
        // External MCP service with no named boundary.
        fc.constant({
          candidate: boundedLocalExtension("MCP_Service", "unbounded-mcp", {
            externalRoutingRequested: true,
            repositoryAnswer: "Not_Answered",
            serviceAndDataBoundary: undefined,
            secretBoundary: undefined,
            permissionBoundary: undefined,
          }),
          why: "external service with no named boundary",
        }),
        // Incompatible repository compatibility must be disabled.
        fc.constant({
          candidate: boundedLocalExtension("Tool_Surface", "incompatible", {
            repositoryCompatibility: "incompatible",
          }),
          why: "repository-incompatible",
        }),
        // Untrusted extension.
        fc.constant({
          candidate: boundedLocalExtension("Tool_Surface", "untrusted", {
            trustDecision: "untrusted",
            integrityResult: "fail",
          }),
          why: "untrusted / failed integrity",
        }),
      );

    fc.assert(
      fc.property(brokenExtensionArb, ({ candidate }) => {
        const result = evaluateExtensions([candidate]);
        const record = result.output?.extensions[0];
        expect(record).toBeDefined();
        if (!record) return;

        // A single core violation must never reach the active `retain`
        // disposition; the value stays bounded regardless.
        expect(record.disposition).not.toBe("retained");
        expect(INACTIVE_EXTENSION_DISPOSITIONS).toContain(record.disposition);
        expect(record.blockers.length).toBeGreaterThan(0);
        expect(record.externalRoutingAllowed).toBe(false);
        // Bounds still hold even for the invalid record.
        expect([0, 1]).toContain(record.maximumConcurrency);
        expect(record.iterationCeiling).toBeGreaterThanOrEqual(0);
        expect(record.iterationCeiling).toBeLessThanOrEqual(3);
      }),
      { numRuns: 150 },
    );
  });

  // -------------------------------------------------------------------------
  // Execution plans — continuity evaluator (DAG / wave / review-loop /
  // concurrency, no worktrees, no hidden spawning).
  // -------------------------------------------------------------------------

  const executionKindArb = fc.constantFrom(
    "native_task_graph" as const,
    "parallel_task_wave" as const,
    "subagent_dag" as const,
  );

  it("clamps native/parallel/subagent execution concurrency to 0 or 1 and blocks any proposal above one", () => {
    fc.assert(
      fc.property(
        executionKindArb,
        fc.integer({ min: -3, max: 12 }),
        (kind, proposed) => {
          const capability: ContinuityCapabilityInput = { kind, proposedMaximumConcurrency: proposed };
          const result = evaluateContinuity({
            repositoryRoot,
            capabilities: [capability],
            ownerDecisions: ALL_OWNER_DECISIONS,
          });
          const record = result.output?.records.find((entry) => entry.kind === kind);
          expect(record).toBeDefined();
          if (!record) return;

          // Concurrency is always clamped into the default/native band.
          expect([0, 1]).toContain(record.maximumConcurrency);

          // Any proposal above one (or otherwise invalid) is a recorded policy
          // violation and never reaches an active disposition.
          if (proposed > 1 || proposed < 0 || !Number.isInteger(proposed)) {
            expect(record.blockers.length).toBeGreaterThan(0);
            expect(["defer", "disable", "exclude"]).toContain(record.disposition);
          }
          // Default/native execution capabilities are never `retain`ed as
          // active by this evaluator; they stay deferred pending validation.
          expect(record.disposition).not.toBe("retained");
        },
      ),
      { numRuns: 200 },
    );
  });

  it("bounds review-loop iterations to 0..3 and flags any ceiling outside the band", () => {
    fc.assert(
      fc.property(fc.integer({ min: -5, max: 20 }), (proposed) => {
        const result = evaluateContinuity({
          repositoryRoot,
          capabilities: [{ kind: "review_loop", proposedIterationCeiling: proposed }],
          ownerDecisions: ALL_OWNER_DECISIONS,
        });
        const record = result.output?.records.find((entry) => entry.kind === "review_loop");
        expect(record).toBeDefined();
        if (!record) return;

        // Iteration ceiling is always clamped into 0..3.
        expect(record.iterationCeiling).toBeGreaterThanOrEqual(0);
        expect(record.iterationCeiling).toBeLessThanOrEqual(3);

        if (proposed > 3 || proposed < 0 || !Number.isInteger(proposed)) {
          expect(record.blockers.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 150 },
    );
  });

  it("caps graph-impact automation at three iterations and preserves the manual loop as fallback", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 20 }), (proposed) => {
        const result = evaluateContinuity({
          repositoryRoot,
          capabilities: [
            { kind: "graph_impact_automation", proposedIterations: proposed, validationRunRefs: [] },
          ],
          ownerDecisions: ALL_OWNER_DECISIONS,
        });
        const record = result.output?.records.find((entry) => entry.kind === "graph_impact_automation");
        expect(record).toBeDefined();
        if (!record) return;

        // Automation iterations never exceed the ceiling.
        expect(record.iterationCeiling).toBeLessThanOrEqual(GRAPH_IMPACT_MAX_ITERATIONS);
        expect(record.iterationCeiling).toBeGreaterThanOrEqual(0);

        // A proposal beyond the ceiling is a recorded policy violation.
        if (proposed > GRAPH_IMPACT_MAX_ITERATIONS) {
          expect(record.blockers.some((blocker) => blocker.includes(String(GRAPH_IMPACT_MAX_ITERATIONS)))).toBe(true);
        }
        // Without a fresh validation run the automation stays deferred; the
        // manual loop remains the fallback (never active-`retain`/`observe`
        // wave). It is never enabled outright.
        expect(record.disposition).not.toBe("retained");
      }),
      { numRuns: 150 },
    );
  });

  it("defers or excludes any Crew execution that uses worktrees or hidden spawning and never lets OD-04 enable it", () => {
    // Generator over the incompatible Crew behavior flags — worktrees, hidden
    // spawning, concurrency > 1, retries/replans, auto-approval, OD-04 misuse.
    const flagsArb: fc.Arbitrary<Partial<CrewBehaviorFlags>> = fc.record(
      Object.fromEntries(CREW_INCOMPATIBLE_BEHAVIORS.map((behavior) => [behavior, fc.boolean()])) as Record<
        keyof CrewBehaviorFlags,
        fc.Arbitrary<boolean>
      >,
    );

    fc.assert(
      fc.property(
        fc.constantFrom("crew_memory" as const, "crew_knowledge" as const, "crew_task_runner" as const),
        flagsArb,
        (kind, crewBehaviorFlags) => {
          const result = evaluateContinuity({
            repositoryRoot,
            capabilities: [{ kind, crewBehaviorFlags }],
            // Every owner decision (including OD-04) is present and approved.
            ownerDecisions: ALL_OWNER_DECISIONS,
          });
          const record = result.output?.records.find((entry) => entry.kind === kind);
          expect(record).toBeDefined();
          if (!record) return;

          // A Crew capability is never active: it is deferred or excluded.
          expect(["defer", "disable", "exclude"]).toContain(record.disposition);
          expect(record.disposition).not.toBe("retained");
          expect(record.disposition).not.toBe("observe");

          // Any incompatible behavior recorded on the flags is surfaced as an
          // incompatible behavior on the record and blocks enablement.
          if (record.incompatibleBehaviors.length > 0) {
            expect(record.blockers.length).toBeGreaterThan(0);
          }

          // OD-04 (approved and present) can never turn a Crew capability into an
          // enabled-valid one — its disposition remains inactive.
          expect(record.status === "deferred" || record.status === "excluded" || record.status === "disabled").toBe(true);
        },
      ),
      { numRuns: 200 },
    );
  });
});
