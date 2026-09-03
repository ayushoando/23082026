// @vitest-environment happy-dom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ReactNode } from "react";
import type { LogErrorParams } from "@/lib/errorLogger";

const logClientError = vi.fn(async (_params: LogErrorParams) => true);

vi.mock("@/lib/errorLogger", () => ({
  logClientError: (params: LogErrorParams) => logClientError(params),
}));

import { PlannerErrorBoundary } from "@/components/Planner/PlannerErrorBoundary";

function Bomb({ message }: { message: string }): ReactNode {
  throw new Error(message);
}

describe("PlannerErrorBoundary (finding 17.1)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("renders children unchanged when nothing throws", () => {
    render(
      <PlannerErrorBoundary>
        <div data-testid="workspace">workspace</div>
      </PlannerErrorBoundary>,
    );
    expect(screen.getByTestId("workspace")).toBeTruthy();
    expect(screen.queryByTestId("planner-error-fallback")).toBeNull();
  });

  it("degrades to the in-place recovery panel when a child throws", () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <PlannerErrorBoundary>
        <div>outside</div>
        <Bomb message="canvas exploded" />
      </PlannerErrorBoundary>,
    );

    // Fallback replaces the crashed subtree in place.
    expect(screen.getByTestId("planner-error-fallback")).toBeTruthy();
    expect(screen.getByText(/unexpected error/i)).toBeTruthy();
    expect(
      screen.getByTestId("planner-error-fallback-message").textContent,
    ).toContain("canvas exploded");
    expect(screen.getByRole("button", { name: /reload planner/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /open saved plans/i })).toHaveAttribute(
      "href",
      "/portal",
    );

    // The crash is logged with the planner-local label, not swallowed.
    expect(logClientError).toHaveBeenCalledTimes(1);
    expect(logClientError.mock.calls[0][0]).toMatchObject({
      label: "planner-workspace-local",
    });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
