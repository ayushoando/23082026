// @vitest-environment node
//
// Planner regression suite: units, owner scope, exclusive persistence mode,
// and accessible workflow state transitions.

import { describe, expect, it, vi } from "vitest";

import {
  detectClientOwnerIdentifiers,
  derivePlannerOwnerScope,
  findPlannerOwnedRecord,
  isPlannerSessionExpiryResponse,
  listPlannerOwnedRecords,
  PLANNER_SESSION_EXPIRY_RECOVERY,
} from "@planner/lib/plannerOwnerScope";
import {
  getPlannerPersistenceMode,
  PlannerPersistenceConfigurationError,
  runContextualPlannerPersistenceOperation,
} from "@planner/lib/plannerPersistenceMode";
import {
  clearObsoleteErrorOnRetry,
  getPlannerRequiredState,
  isClearableErrorState,
} from "@planner/lib/plannerWorkflowState";
import {
  formatDim,
  fromMm,
  mmToPx,
  pxToMm,
  toMm,
} from "@planner/lib/plannerUnits";

describe("Planner core contracts and regressions", () => {
  describe("units and scale conversions", () => {
    it("keeps canonical millimetres and Planner scale round trips stable", () => {
      expect(fromMm(toMm(42, "in"), "in")).toBeCloseTo(42, 10);
      expect(fromMm(toMm(150, "cm"), "cm")).toBeCloseTo(150, 10);
      expect(fromMm(toMm(3.5, "m"), "m")).toBeCloseTo(3.5, 10);
      expect(toMm(25, "mm")).toBe(25);
      expect(fromMm(25, "mm")).toBe(25);

      // Boundary values
      expect(toMm(0, "in")).toBe(0);
      expect(fromMm(0, "in")).toBe(0);
      expect(mmToPx(0)).toBe(0);
      expect(pxToMm(0)).toBe(0);

      // Canonical 0.05 px/mm scale
      expect(mmToPx(2_400)).toBe(120);
      expect(pxToMm(120)).toBe(2_400);
      expect(pxToMm(mmToPx(2_400))).toBeCloseTo(2_400, 10);

      // Formatting
      expect(formatDim(25.4, "in")).toBe('1.00"');
      expect(formatDim(1_000, "m")).toBe("1.00 m");
      expect(formatDim(100, "cm")).toBe("10.0 cm");
      expect(formatDim(500, "mm")).toBe("500 mm");

      // Non-positive scale assertion
      expect(() => mmToPx(100, 0)).toThrow();
      expect(() => pxToMm(100, -1)).toThrow();
    });
  });

  describe("owner scope and access control", () => {
    it("derives owner scope only from a verified server session and does not disclose cross-owner records", () => {
      const scope = derivePlannerOwnerScope({ ownerId: "owner-a" });
      expect(scope).toEqual({
        ownerId: "owner-a",
        source: "verified-server-session",
      });

      const records = [
        { id: "plan-a", ownerId: "owner-a" },
        { id: "plan-b", ownerId: "owner-b" },
      ];
      expect(listPlannerOwnedRecords(records, scope)).toEqual([records[0]]);
      expect(findPlannerOwnedRecord(records, "plan-b", scope, (record) => record.id)).toBeNull();
      expect(findPlannerOwnedRecord(records, "missing", scope, (record) => record.id)).toBeNull();
    });

    it("detects and rejects client-supplied owner identifiers", () => {
      expect(
        detectClientOwnerIdentifiers({
          name: "Project",
          ownerId: "hacker",
          user_id: "victim",
        }),
      ).toEqual(["user_id", "ownerId"]);

      expect(detectClientOwnerIdentifiers({ name: "Clean Project" })).toEqual([]);
      expect(detectClientOwnerIdentifiers(null)).toEqual([]);
    });

    it("identifies session expiry handoff responses", () => {
      expect(
        isPlannerSessionExpiryResponse({
          code: "AUTH_REQUIRED",
          recovery: PLANNER_SESSION_EXPIRY_RECOVERY,
        }),
      ).toBe(true);

      expect(
        isPlannerSessionExpiryResponse({
          code: "FORBIDDEN",
          recovery: PLANNER_SESSION_EXPIRY_RECOVERY,
        }),
      ).toBe(false);
    });
  });

  describe("exclusive persistence mode", () => {
    it("selects disk persistence only when DEV_AUTH_BYPASS=1 in non-production", async () => {
      const context = { ownerId: "owner-a", correlationId: "corr-00000001" };
      const disk = vi.fn(async (received: typeof context) => received);
      const supabase = vi.fn(async (received: typeof context) => received);

      await expect(
        runContextualPlannerPersistenceOperation(context, { disk, supabase }, {
          NODE_ENV: "development",
          DEV_AUTH_BYPASS: "1",
        }),
      ).resolves.toBe(context);

      expect(disk).toHaveBeenCalledOnce();
      expect(disk).toHaveBeenCalledWith(context);
      expect(supabase).not.toHaveBeenCalled();
    });

    it("selects Supabase persistence when DEV_AUTH_BYPASS is not set or zero", async () => {
      const context = { ownerId: "owner-a", correlationId: "corr-00000002" };
      const disk = vi.fn(async (received: typeof context) => received);
      const supabase = vi.fn(async (received: typeof context) => received);

      await expect(
        runContextualPlannerPersistenceOperation(context, { disk, supabase }, {
          NODE_ENV: "development",
          DEV_AUTH_BYPASS: "0",
          NEXT_ADMIN_SUPABASE_URL: "https://mock.supabase.co",
          SUPABASE_ADMIN_SERVICE_ROLE_KEY: "mock-service-role-key",
        }),
      ).resolves.toBe(context);

      expect(supabase).toHaveBeenCalledOnce();
      expect(disk).not.toHaveBeenCalled();
    });

    it("strictly forbids disk persistence in production even if DEV_AUTH_BYPASS=1", () => {
      const mode = getPlannerPersistenceMode({
        NODE_ENV: "production",
        DEV_AUTH_BYPASS: "1",
      });
      expect(mode).toBe("supabase");
    });

    it("throws configuration error on ambiguous DEV_AUTH_BYPASS values", () => {
      expect(() =>
        getPlannerPersistenceMode({
          NODE_ENV: "development",
          DEV_AUTH_BYPASS: "true",
        }),
      ).toThrow(PlannerPersistenceConfigurationError);
    });
  });

  describe("workflow state transitions and accessibility", () => {
    it("clears obsolete retry errors into the workflow success state while preserving conflict choices", () => {
      expect(clearObsoleteErrorOnRetry("project-save", "server-error")?.kind).toBe("success");
      expect(clearObsoleteErrorOnRetry("project-save", "conflict")).toBeNull();
      expect(isClearableErrorState("project-save", "server-error")).toBe(true);
      expect(isClearableErrorState("project-save", "conflict")).toBe(false);

      const conflictState = getPlannerRequiredState("project-save", "conflict");
      expect(conflictState?.actions.map((action) => action.id)).toEqual(["use-server", "keep-local"]);
      expect(conflictState?.accessible.role).toBe("alert");
    });

    it("attaches accessible live regions and focus targets to validation errors", () => {
      const validationState = getPlannerRequiredState("project-save", "validation-error");
      expect(validationState).toBeDefined();
      expect(validationState?.accessible.role).toBe("alert");
      expect(validationState?.focusTarget).toEqual({ kind: "first-invalid-field" });
    });
  });
});
