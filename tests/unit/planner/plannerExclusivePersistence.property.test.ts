import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";
import {
  PlannerPersistenceConfigurationError,
  runContextualPlannerPersistenceOperation,
} from "@planner/lib/plannerPersistenceMode";

// Property 18: Exclusive persistence selection. Authored only; execution is owner-controlled.
describe("Property 18: exclusive persistence selection", () => {
  it("calls exactly one approved adapter and never falls back after failure", async () => {
    await fc.assert(
      fc.asyncProperty(fc.boolean(), fc.boolean(), async (bypass, failSelected) => {
        const disk = vi.fn(async () => {
          if (failSelected && bypass) throw new Error("disk failed");
          return "disk" as const;
        });
        const supabase = vi.fn(async () => {
          if (failSelected && !bypass) throw new Error("supabase failed");
          return "supabase" as const;
        });
        const env = {
          NODE_ENV: "development",
          DEV_AUTH_BYPASS: bypass ? "1" : "0",
          NEXT_ADMIN_SUPABASE_URL: "https://admin.invalid",
          SUPABASE_ADMIN_SERVICE_ROLE_KEY: "test-only",
        } as NodeJS.ProcessEnv;
        const operation = runContextualPlannerPersistenceOperation(
          { ownerId: "owner", correlationId: "correlation" },
          { disk, supabase },
          env,
        );
        if (failSelected) await expect(operation).rejects.toThrow();
        else await expect(operation).resolves.toBe(bypass ? "disk" : "supabase");
        expect(disk).toHaveBeenCalledTimes(bypass ? 1 : 0);
        expect(supabase).toHaveBeenCalledTimes(bypass ? 0 : 1);
      }),
    );
  });

  it("rejects invalid mode configuration before either adapter", async () => {
    const disk = vi.fn(async () => "disk");
    const supabase = vi.fn(async () => "supabase");
    await expect(
      runContextualPlannerPersistenceOperation({}, { disk, supabase }, {
        NODE_ENV: "development",
        DEV_AUTH_BYPASS: "sometimes",
      } as NodeJS.ProcessEnv),
    ).rejects.toBeInstanceOf(PlannerPersistenceConfigurationError);
    expect(disk).not.toHaveBeenCalled();
    expect(supabase).not.toHaveBeenCalled();
  });
});
