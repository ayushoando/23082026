// @vitest-environment node

// Feature: kiro-repo-guidance-setup, Property 9: Approved hooks satisfy schema and safety bounds.
// Lane C, test-authoring only. This test drives the read-only HookEvaluator
// (scripts/kiro-repo-guidance-setup/hooks.ts) against throwaway fixture roots in
// the OS temp directory (the sibling hooks.test.ts convention). It never writes
// to a source module, package.json, the repository .kiro/hooks tree, or results/,
// and it never executes a hook or contacts an external service.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import fc from "fast-check";
import { afterEach, describe, expect, it } from "vitest";

import {
  evaluateHooks,
  HOOK_SURFACES,
  HOOK_TIMEOUT_MAX_SECONDS,
  HOOK_TIMEOUT_MIN_SECONDS,
  SUPPORTED_HOOK_EVENTS,
  type EvaluatedHookRecord,
} from "../../../scripts/kiro-repo-guidance-setup/hooks.ts";
import type {
  Identifier,
  ValidationRun,
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";

// ---------------------------------------------------------------------------
// Throwaway fixture roots (OS temp dir — outside the repository tree).
// ---------------------------------------------------------------------------

const temporaryRoots: string[] = [];

// A repository-local script referenced by the valid baseline command. It is
// created inside each fixture root so the reviewed-command path check passes.
const REFERENCED_SCRIPT = "scripts/guidance-graph.mjs";

/**
 * Create an isolated fixture root with a package.json and the referenced script,
 * so a valid command hook can pass every command-review check.
 */
function createRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "kiro-hooks-prop-"));
  temporaryRoots.push(root);
  mkdirSync(join(root, ".kiro", "hooks"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ scripts: { "check:target": "node scripts/guidance-graph.mjs" } }),
    "utf8",
  );
  writeFileSync(join(root, REFERENCED_SCRIPT), "// fixture script\n", "utf8");
  return root;
}

function writeManifest(root: string, name: string, manifest: unknown): void {
  writeFileSync(join(root, ".kiro", "hooks", name), JSON.stringify(manifest), "utf8");
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Valid baseline hook + its fresh activation/rollback evidence.
// ---------------------------------------------------------------------------

// Reads JSON from stdin (`process.stdin` + `JSON.parse`) then runs an existing
// repository-local node script. No npm/yarn/npx, no `cd`, no install, no secret
// literal, no external/production target, and no unsafe write.
const VALID_COMMAND =
  "node -e \"process.stdin.on('data', value => JSON.parse(value))\"; node scripts/guidance-graph.mjs";

// A narrow, target-only matcher (concrete extension boundary, not a bare wildcard).
const VALID_MATCHER = "^scripts/.+\\.ts$";

// File-lifecycle event so a matcher is required, maximizing rule coverage.
const VALID_EVENT = "PostFileSave";

const VALID_TIMEOUT = 30;

interface RawHookAction {
  type?: unknown;
  command?: unknown;
  prompt?: unknown;
  timeout?: unknown;
}

interface RawHookDefinition {
  name?: unknown;
  trigger?: unknown;
  matcher?: unknown;
  enabled?: unknown;
  timeout?: unknown;
  action?: unknown;
}

function baselineHook(): RawHookDefinition {
  return {
    name: "guidance graph impact",
    trigger: VALID_EVENT,
    matcher: VALID_MATCHER,
    enabled: true,
    timeout: VALID_TIMEOUT,
    action: { type: "command", command: VALID_COMMAND } as RawHookAction,
  };
}

/**
 * Fresh, passing Local_Repository_Surface validation run for one hook path. The
 * evaluator only accepts such a run as activation evidence when it mentions the
 * exact path and is not a pre-change/baseline run.
 */
function passingRun(path: string, id: Identifier, action: string): ValidationRun {
  return {
    validationId: id,
    action,
    repositoryRootOrActiveSurface: path,
    surface: "Local_Repository_Surface",
    version: "repository",
    scope: `${path}; hook behavior; rollback path`,
    executionLayer: "surface_validation",
    startedAtUtc: "2026-08-25T12:00:00Z",
    result: "pass",
    commandOrInteraction: `read-only local hook validation for ${path}`,
    exitCodeOrOutcome: "exit 0",
    evidenceRefs: [id],
    unverifiedItems: [],
    blocker: "none",
  };
}

/** Fresh activation + rollback evidence for a single hook path. */
function evidenceFor(path: string): readonly ValidationRun[] {
  return [
    passingRun(path, `validation:hook:${path}`, `validate hook manifest at ${path}`),
    passingRun(path, `validation:hook:restore:${path}`, `validate rollback restore for ${path}`),
  ];
}

const HOOK_PATH = ".kiro/hooks/guidance.json";

/** Write a single-hook manifest and evaluate it with fresh evidence. */
function evaluateOne(hook: RawHookDefinition, version: unknown = "v1"): {
  readonly record: EvaluatedHookRecord | undefined;
  readonly status: string;
} {
  const root = createRoot();
  writeManifest(root, "guidance.json", { version, hooks: [hook] });
  const result = evaluateHooks({
    repositoryRoot: root,
    validationRuns: evidenceFor(HOOK_PATH),
  });
  return { record: result.output?.hooks[0], status: result.status };
}

/** Assert every schema and safety bound for a hook the evaluator marks enabled. */
function assertEnabledInvariants(record: EvaluatedHookRecord): void {
  // Fail-closed: an enabled hook carries zero recorded blockers.
  expect(record.blockers).toHaveLength(0);

  // Supported PascalCase event.
  expect(SUPPORTED_HOOK_EVENTS as readonly string[]).toContain(record.hookEvent);
  expect(/^[A-Z][A-Za-z0-9]*$/.test(record.hookEvent)).toBe(true);

  // Supported command/agent action.
  expect(["command", "agent"]).toContain(record.actionType);

  // Hook-level boolean enabled true and schema pass.
  expect(record.enabled).toBe(true);
  expect(record.schemaResult).toBe("pass");

  // Hook-level timeout within the approved bounds.
  const timeout = record.hookLevelTimeoutSeconds ?? Number.NaN;
  expect(Number.isInteger(timeout)).toBe(true);
  expect(timeout).toBeGreaterThanOrEqual(HOOK_TIMEOUT_MIN_SECONDS);
  expect(timeout).toBeLessThanOrEqual(HOOK_TIMEOUT_MAX_SECONDS);

  // Correct command input contract for command hooks.
  if (record.actionType === "command") {
    expect(record.commandInputContract).toBe("JSON on stdin required");
  }

  // Named owner, bounded side effects, valid rollback path.
  expect(record.owner.trim().length).toBeGreaterThan(0);
  expect(record.expectedSideEffects.length).toBeGreaterThan(0);
  expect(record.rollbackPath.trim().length).toBeGreaterThan(0);

  // Fresh activation evidence recorded for an enabled hook.
  expect(record.validationRunRefs.length).toBeGreaterThan(0);

  // Target-only surface availability, no unapproved overlap (implied by zero blockers).
  expect(record.surfaceAvailability).toEqual(HOOK_SURFACES);
}

// ---------------------------------------------------------------------------
// Single-rule mutations off the valid baseline.
// ---------------------------------------------------------------------------

interface Mutation {
  readonly label: string;
  readonly build: (salt: number) => { version: unknown; hook: RawHookDefinition };
}

const MUTATIONS: readonly Mutation[] = [
  {
    label: "timeout placed inside action",
    build: () => {
      const hook = baselineHook();
      return {
        version: "v1",
        hook: {
          ...hook,
          timeout: undefined,
          action: { type: "command", command: VALID_COMMAND, timeout: VALID_TIMEOUT } as RawHookAction,
        },
      };
    },
  },
  {
    label: "event not PascalCase / unsupported",
    build: () => ({ version: "v1", hook: { ...baselineHook(), trigger: "postFileSave" } }),
  },
  {
    label: "unsupported action type",
    build: () => ({
      version: "v1",
      hook: { ...baselineHook(), action: { type: "webhook", command: VALID_COMMAND } as RawHookAction },
    }),
  },
  {
    label: "matcher not narrow (bare wildcard)",
    build: () => ({ version: "v1", hook: { ...baselineHook(), matcher: ".*" } }),
  },
  {
    label: "enabled is not a boolean",
    build: () => ({ version: "v1", hook: { ...baselineHook(), enabled: "yes" } }),
  },
  {
    label: "command lacks JSON stdin contract",
    build: () => ({
      version: "v1",
      hook: {
        ...baselineHook(),
        action: { type: "command", command: "node scripts/guidance-graph.mjs" } as RawHookAction,
      },
    }),
  },
  {
    label: "command references an unavailable path",
    build: (salt) => ({
      version: "v1",
      hook: {
        ...baselineHook(),
        action: {
          type: "command",
          command: `node -e "process.stdin.on('data', value => JSON.parse(value))"; node scripts/missing-${salt}.mjs`,
        } as RawHookAction,
      },
    }),
  },
  {
    label: "command has an unsafe write side effect",
    build: () => ({
      version: "v1",
      hook: {
        ...baselineHook(),
        action: {
          type: "command",
          command: `${VALID_COMMAND}; rm -rf build`,
        } as RawHookAction,
      },
    }),
  },
  {
    label: "command has an external/production side effect",
    build: () => ({
      version: "v1",
      hook: {
        ...baselineHook(),
        action: {
          type: "command",
          command: `${VALID_COMMAND}; curl https://example.invalid/data`,
        } as RawHookAction,
      },
    }),
  },
  {
    label: "command contains a secret-like value",
    build: () => ({
      version: "v1",
      hook: {
        ...baselineHook(),
        action: {
          type: "command",
          command: `${VALID_COMMAND} --token=super-secret-value`,
        } as RawHookAction,
      },
    }),
  },
  {
    label: "command uses a non-pnpm package manager",
    build: () => ({
      version: "v1",
      hook: {
        ...baselineHook(),
        action: {
          type: "command",
          command: "node -e \"process.stdin.on('data', value => JSON.parse(value))\"; npm run check:target",
        } as RawHookAction,
      },
    }),
  },
  {
    label: "timeout above the maximum bound",
    build: () => ({ version: "v1", hook: { ...baselineHook(), timeout: HOOK_TIMEOUT_MAX_SECONDS + 1 } }),
  },
  {
    label: "timeout below the minimum bound",
    build: () => ({ version: "v1", hook: { ...baselineHook(), timeout: HOOK_TIMEOUT_MIN_SECONDS - 1 } }),
  },
  {
    label: "manifest version is not v1",
    build: () => ({ version: "v2", hook: baselineHook() }),
  },
];

// ---------------------------------------------------------------------------
// Properties.
// ---------------------------------------------------------------------------

describe("Property 9: Approved hooks satisfy schema and safety bounds", () => {
  // **Validates: Requirements 7.2, 7.5, 7.6, 7.8, 7.9, 12.1**

  it("marks the fully valid baseline hook enabled and satisfying every schema/safety bound", () => {
    // Sanity anchor: without this, the mutation property could pass vacuously.
    const { record, status } = evaluateOne(baselineHook());
    expect(status).toBe("pass");
    expect(record).toBeDefined();
    if (!record) return;
    assertEnabledInvariants(record);
  });

  it("never enables a hook that violates exactly one rule, and records the failed rule", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...MUTATIONS.map((_, index) => index)),
        fc.integer({ min: 0, max: 99999 }),
        (mutationIndex, salt) => {
          const mutation = MUTATIONS[mutationIndex];
          const { version, hook } = mutation.build(salt);
          const { record, status } = evaluateOne(hook, version);

          // A single-rule violation must never yield a clean pass.
          expect(status).not.toBe("pass");

          if (record) {
            // The hook is never enabled and always records at least one blocker.
            expect(record.enabled).toBe(false);
            expect(record.blockers.length).toBeGreaterThan(0);
            // A violating hook is never enabled-valid: disposition is a safe,
            // inactive one.
            expect(["defer", "observe", "disable", "exclude"]).toContain(record.disposition);
          } else {
            // Manifest-level violations (e.g. wrong version) produce no per-hook
            // record and a blocked/partial status: still fail-closed.
            expect(["blocked", "partial"]).toContain(status);
          }
        },
      ),
      { numRuns: 150 },
    );
  });

  it("keeps the enabled invariant under approved-overlap and owner variation", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant<readonly Identifier[]>([]), fc.constant<readonly Identifier[]>(["overlap:none"])),
        fc.oneof(fc.constant("repository owner"), fc.constant("guidance maintainer")),
        (approvedOverlapRefs, owner) => {
          const root = createRoot();
          writeManifest(root, "guidance.json", { version: "v1", hooks: [baselineHook()] });
          const result = evaluateHooks({
            repositoryRoot: root,
            owner,
            approvedOverlapRefs,
            validationRuns: evidenceFor(HOOK_PATH),
          });
          const record = result.output?.hooks[0];
          expect(record).toBeDefined();
          if (!record) return;

          // The single valid hook has no overlap peer, so it stays enabled and
          // fully compliant regardless of the approved-overlap set / owner.
          if (record.enabled) {
            assertEnabledInvariants(record);
            expect(record.owner).toBe(owner);
          } else {
            // If evidence ever fails to attach, it must be fail-closed instead.
            expect(record.blockers.length).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
