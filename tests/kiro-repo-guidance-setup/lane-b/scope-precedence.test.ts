// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  assessScopePrecedence,
  DOCUMENTED_SCOPE_ORDER,
} from "../../../scripts/kiro-repo-guidance-setup/compatibility.ts";
import type {
  ConfigurationScope,
  ScopeInput,
  ScopeRecord,
} from "../../../scripts/kiro-repo-guidance-setup/contracts.ts";

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

function createInput(overrides: Partial<ScopeInput> = {}): ScopeInput {
  return {
    records: DOCUMENTED_SCOPE_ORDER.map((scope) => createScopeRecord(scope)),
    generatedAtUtc: "2026-08-25T12:00:00Z",
    ...overrides,
  };
}

describe("ScopePrecedenceMapper", () => {
  it("keeps documented and observed precedence separate for every required scope", () => {
    const result = assessScopePrecedence(createInput());

    expect(result.status).toBe("pass");
    expect(result.output?.map.records).toHaveLength(DOCUMENTED_SCOPE_ORDER.length);
    expect(result.output?.map.documentedOrder).toEqual(DOCUMENTED_SCOPE_ORDER);
    expect(result.output?.map.observedOrder).toEqual(DOCUMENTED_SCOPE_ORDER);
    expect(result.output?.map.conflicts).toEqual([]);
    expect(result.output?.map.unresolved).toEqual([]);
    expect(result.output?.approvalBoundaries).toEqual([]);
  });

  it("does not infer user-level state and blocks an unresolved deny-overrides-allow result", () => {
    const records = DOCUMENTED_SCOPE_ORDER.map((scope) =>
      createScopeRecord(scope, scope === "user_permission"
        ? {
            pathOrService: "user-level permissions not inspected",
            applicability: "unresolved",
            access: "none",
            observedPrecedence: [],
            denyOverridesAllow: "Unverified",
            evidenceRefs: ["evidence:user-permission-absent"],
          }
        : {}),
    );

    const result = assessScopePrecedence(createInput({ records }));

    expect(result.status).toBe("partial");
    expect(result.output?.map.records.find((record) => record.scope === "user_permission")?.observedPrecedence).toEqual([]);
    expect(result.output?.map.unresolved).toContain("evidence:user-permission-absent");
    expect(result.blockers.some((blocker) => blocker.includes("user_permission deny-overrides-allow is Unverified"))).toBe(true);
  });

  it("records conflicts instead of treating divergent observed precedence as documented fact", () => {
    const records = DOCUMENTED_SCOPE_ORDER.map((scope) =>
      createScopeRecord(scope, scope === "project"
        ? { observedPrecedence: ["project", "global"] }
        : {}),
    );

    const result = assessScopePrecedence(createInput({ records }));

    expect(result.status).toBe("partial");
    expect(result.output?.map.documentedOrder).toEqual(DOCUMENTED_SCOPE_ORDER);
    expect(result.output?.map.observedOrder).toEqual(DOCUMENTED_SCOPE_ORDER);
    expect(result.output?.map.conflicts).toContain("evidence:project");
    expect(result.blockers.some((blocker) => blocker.includes("project observed precedence conflicts"))).toBe(true);
  });

  it("fails closed when a required scope is missing", () => {
    const result = assessScopePrecedence(
      createInput({
        records: DOCUMENTED_SCOPE_ORDER
          .filter((scope) => scope !== "external_service")
          .map((scope) => createScopeRecord(scope)),
      }),
    );

    expect(result.status).toBe("partial");
    expect(result.blockers).toContain("required configuration scope external_service is missing");
  });

  it("rejects malformed records and an invalid generation timestamp without inferring scope state", () => {
    const records = DOCUMENTED_SCOPE_ORDER.map((scope) => createScopeRecord(scope));
    const malformedRecord = {
      ...records[0],
      surface: "unknown-surface",
      actions: ["record scope", 42],
      evidenceRefs: [],
    };

    const result = assessScopePrecedence({
      records: [malformedRecord, ...records.slice(1)] as unknown as ScopeRecord[],
      generatedAtUtc: "not-a-timestamp",
    });

    expect(result.status).toBe("partial");
    expect(result.blockers).toContain("a scope record is malformed and cannot be used for precedence assessment");
    expect(result.blockers).toContain("required configuration scope global is missing");
    expect(result.output?.map.records.some((record) => record.scope === "global")).toBe(false);
  });
});
