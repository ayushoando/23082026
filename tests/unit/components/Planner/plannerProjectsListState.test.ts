import { describe, expect, it } from "vitest";

import { PlannerApiError } from "@planner/lib/plannerApi";
import { classifyPlannerProjectsListFailure } from "@/components/Planner/plannerProjectsListState";

describe("classifyPlannerProjectsListFailure", () => {
  it.each([
    [401, "AUTH_REQUIRED", "unauthenticated", false],
    [403, "INSUFFICIENT_PERMISSIONS", "forbidden", false],
    [429, "RATE_LIMIT_EXCEEDED", "rate-limited", true],
    [503, "SERVICE_UNAVAILABLE", "server-error", true],
  ] as const)(
    "maps status %i to %s recovery",
    (status, code, expectedKind, retryable) => {
      const failure = classifyPlannerProjectsListFailure(
        new PlannerApiError(status, code, "Safe error"),
      );

      expect(failure.kind).toBe(expectedKind);
      expect(failure.retryable).toBe(retryable);
    },
  );

  it("uses a safe retryable server state for unexpected failures", () => {
    const failure = classifyPlannerProjectsListFailure(
      new Error("internal implementation detail"),
    );

    expect(failure.kind).toBe("server-error");
    expect(failure.message).not.toContain("internal implementation detail");
  });
});
