import { describe, expect, it, vi } from "vitest";
import {
  getPlannerPersistenceMode,
  getPlannerPersistenceModeLabel,
  isPlannerPersistenceConfigured,
  PlannerPersistenceConfigurationError,
  runContextualPlannerPersistenceOperation,
  runPlannerPersistenceOperation,
} from "@planner/lib/plannerPersistenceMode";

/**
 * Both helpers take an explicit env bag, so pass one rather than mutating
 * `process.env` — Next types `NODE_ENV` as read-only, and a shared mutable
 * process env leaks between tests.
 */
function env(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return overrides as NodeJS.ProcessEnv;
}

/** Supabase env with valid admin credentials. */
function supabaseEnv(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return env({
    NEXT_ADMIN_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ADMIN_SERVICE_ROLE_KEY: "service-role-key",
    ...overrides,
  });
}

describe("plannerPersistenceMode", () => {
  // ── Requirement 12.1: disk only when DEV_AUTH_BYPASS=1 AND non-production ──
  it("disk when DEV_AUTH_BYPASS=1 and not production", () => {
    const e = env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "1" });
    expect(getPlannerPersistenceMode(e)).toBe("disk");
    expect(isPlannerPersistenceConfigured(e)).toBe(true);
  });

  it("disk when DEV_AUTH_BYPASS=1 and NODE_ENV=test", () => {
    const e = env({ NODE_ENV: "test", DEV_AUTH_BYPASS: "1" });
    expect(getPlannerPersistenceMode(e)).toBe("disk");
  });

  // ── Requirement 12.2: supabase when bypass inactive ──
  it("supabase when bypass off", () => {
    expect(getPlannerPersistenceMode(env({ NODE_ENV: "development" }))).toBe(
      "supabase",
    );
  });

  it("supabase when DEV_AUTH_BYPASS=0", () => {
    expect(
      getPlannerPersistenceMode(env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "0" })),
    ).toBe("supabase");
  });

  it("supabase when DEV_AUTH_BYPASS is empty string", () => {
    expect(
      getPlannerPersistenceMode(env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "" })),
    ).toBe("supabase");
  });

  // ── Requirement 12.3: production always selects supabase ──
  it("bypass never applies in production", () => {
    const e = env({ NODE_ENV: "production", DEV_AUTH_BYPASS: "1" });
    expect(getPlannerPersistenceMode(e)).toBe("supabase");
  });

  it("supabase not configured without admin env", () => {
    const e = env({ NODE_ENV: "production" });
    expect(getPlannerPersistenceMode(e)).toBe("supabase");
    expect(isPlannerPersistenceConfigured(e)).toBe(false);
  });

  it("supabase configured when admin env present", () => {
    const e = supabaseEnv({ NODE_ENV: "production" });
    expect(isPlannerPersistenceConfigured(e)).toBe(true);
  });

  // ── Requirement 12.7: reject ambiguous configuration ──
  describe("ambiguous configuration rejection", () => {
    it("rejects DEV_AUTH_BYPASS with non-canonical value", () => {
      expect(() =>
        getPlannerPersistenceMode(env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "true" })),
      ).toThrow(PlannerPersistenceConfigurationError);
    });

    it("rejects DEV_AUTH_BYPASS=yes", () => {
      expect(() =>
        getPlannerPersistenceMode(env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "yes" })),
      ).toThrow(PlannerPersistenceConfigurationError);
    });

    it("rejects DEV_AUTH_BYPASS=2", () => {
      expect(() =>
        getPlannerPersistenceMode(env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "2" })),
      ).toThrow(PlannerPersistenceConfigurationError);
    });

    it("rejects ambiguous config before consulting any adapter", async () => {
      const disk = vi.fn(async () => "disk");
      const supabase = vi.fn(async () => "supabase");
      await expect(
        runPlannerPersistenceOperation(
          { disk, supabase },
          env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "maybe" }),
        ),
      ).rejects.toThrow(PlannerPersistenceConfigurationError);
      expect(disk).not.toHaveBeenCalled();
      expect(supabase).not.toHaveBeenCalled();
    });
  });

  // ── Requirement 12.4–12.6: exclusive persistence per operation ──
  describe("exclusive persistence selection", () => {
    it("calls only disk adapter in dev bypass mode", async () => {
      const disk = vi.fn(async () => "disk-result");
      const supabase = vi.fn(async () => "supabase-result");
      const result = await runPlannerPersistenceOperation(
        { disk, supabase },
        env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "1" }),
      );
      expect(result).toBe("disk-result");
      expect(disk).toHaveBeenCalledTimes(1);
      expect(supabase).not.toHaveBeenCalled();
    });

    it("calls only supabase adapter when bypass is off", async () => {
      const disk = vi.fn(async () => "disk-result");
      const supabase = vi.fn(async () => "supabase-result");
      const result = await runPlannerPersistenceOperation(
        { disk, supabase },
        supabaseEnv({ NODE_ENV: "development" }),
      );
      expect(result).toBe("supabase-result");
      expect(supabase).toHaveBeenCalledTimes(1);
      expect(disk).not.toHaveBeenCalled();
    });

    it("calls only supabase adapter in production", async () => {
      const disk = vi.fn(async () => "disk-result");
      const supabase = vi.fn(async () => "supabase-result");
      const result = await runPlannerPersistenceOperation(
        { disk, supabase },
        supabaseEnv({ NODE_ENV: "production" }),
      );
      expect(result).toBe("supabase-result");
      expect(supabase).toHaveBeenCalledTimes(1);
      expect(disk).not.toHaveBeenCalled();
    });
  });

  // ── Requirement 12.8: no fallback-write after adapter failure ──
  describe("no fallback after adapter failure", () => {
    it("does not fallback to supabase when disk adapter fails", async () => {
      const disk = vi.fn(async () => { throw new Error("disk EROFS"); });
      const supabase = vi.fn(async () => "supabase-result");
      await expect(
        runPlannerPersistenceOperation(
          { disk, supabase },
          env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "1" }),
        ),
      ).rejects.toThrow("disk EROFS");
      expect(supabase).not.toHaveBeenCalled();
    });

    it("does not fallback to disk when supabase adapter fails", async () => {
      const disk = vi.fn(async () => "disk-result");
      const supabase = vi.fn(async () => { throw new Error("connection refused"); });
      await expect(
        runPlannerPersistenceOperation(
          { disk, supabase },
          supabaseEnv({ NODE_ENV: "production" }),
        ),
      ).rejects.toThrow("connection refused");
      expect(disk).not.toHaveBeenCalled();
    });
  });

  // ── Requirement 17.4: owner/correlation context through selected adapter ──
  describe("contextual persistence with owner/correlation", () => {
    it("passes context to exactly one selected adapter", async () => {
      const context = { ownerId: "owner-123", correlationId: "corr-abc" };
      const disk = vi.fn(async (ctx: typeof context) => ctx.ownerId);
      const supabase = vi.fn(async (ctx: typeof context) => ctx.correlationId);
      const result = await runContextualPlannerPersistenceOperation(
        context,
        { disk, supabase },
        env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "1" }),
      );
      expect(result).toBe("owner-123");
      expect(disk).toHaveBeenCalledWith(context);
      expect(supabase).not.toHaveBeenCalled();
    });

    it("passes context to supabase in production", async () => {
      const context = { ownerId: "owner-456", correlationId: "corr-xyz" };
      const disk = vi.fn(async (ctx: typeof context) => ctx.ownerId);
      const supabase = vi.fn(async (ctx: typeof context) => ctx.correlationId);
      const result = await runContextualPlannerPersistenceOperation(
        context,
        { disk, supabase },
        supabaseEnv({ NODE_ENV: "production" }),
      );
      expect(result).toBe("corr-xyz");
      expect(supabase).toHaveBeenCalledWith(context);
      expect(disk).not.toHaveBeenCalled();
    });

    it("rejects contextual operation on unconfigured supabase", async () => {
      const context = { ownerId: "owner-789", correlationId: "corr-def" };
      const disk = vi.fn(async () => "disk");
      const supabase = vi.fn(async () => "supabase");
      await expect(
        runContextualPlannerPersistenceOperation(
          context,
          { disk, supabase },
          env({ NODE_ENV: "production" }),
        ),
      ).rejects.toThrow(PlannerPersistenceConfigurationError);
      expect(disk).not.toHaveBeenCalled();
      expect(supabase).not.toHaveBeenCalled();
    });
  });

  // ── getPlannerPersistenceModeLabel ──
  describe("getPlannerPersistenceModeLabel", () => {
    it("returns disk for dev bypass", () => {
      expect(getPlannerPersistenceModeLabel(
        env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "1" }),
      )).toBe("disk");
    });

    it("returns supabase for production", () => {
      expect(getPlannerPersistenceModeLabel(
        supabaseEnv({ NODE_ENV: "production" }),
      )).toBe("supabase");
    });

    it("throws on ambiguous config", () => {
      expect(() =>
        getPlannerPersistenceModeLabel(
          env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "sometimes" }),
        ),
      ).toThrow(PlannerPersistenceConfigurationError);
    });
  });
});
