/**
 * Focused unit tests for the Planner recovery/loading surface component.
 *
 * Validates:
 * - Draft and Ready states render nothing (parent decides visibility)
 * - Loading state uses role="status" and aria-busy
 * - Not-found and transient-error states display appropriate heading/copy
 * - Recovery actions (Try again, Back to projects) call parent callbacks
 * - Error states use role="alert" for screen-reader announcements
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlannerProjectLoadState } from "@planner/components/PlannerProjectLoadState";
import {
  loadingState,
  unauthorizedState,
  forbiddenState,
  notFoundState,
  transientErrorState,
  DRAFT,
  readyState,
} from "@planner/components/plannerLoadState";

const noop = () => {};

describe("PlannerProjectLoadState", () => {
  it("returns null for draft state", () => {
    const { container } = render(
      <PlannerProjectLoadState
        state={DRAFT}
        onRetry={noop}
        onBackToProjects={noop}
        onSignIn={noop}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("returns null for ready state", () => {
    const project = { id: "p_1", name: "My Plan" } as Parameters<typeof readyState>[1];
    const { container } = render(
      <PlannerProjectLoadState
        state={readyState("p_1", project)}
        onRetry={noop}
        onBackToProjects={noop}
        onSignIn={noop}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders loading indicator with role=status and aria-busy", () => {
    render(
      <PlannerProjectLoadState
        state={loadingState("p_1", "p_1:123")}
        onRetry={noop}
        onBackToProjects={noop}
        onSignIn={noop}
      />,
    );
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading plan…")).toBeInTheDocument();
  });

  it("renders sign-in action (not retry) for unauthorized (401) — the one state a persisted audit artifact recorded", () => {
    render(
      <PlannerProjectLoadState
        state={unauthorizedState("demo-plan", "Sign in to continue working on this plan.")}
        onRetry={noop}
        onBackToProjects={noop}
        onSignIn={noop}
      />,
    );
    expect(screen.getByRole("heading", { name: /sign in required/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to projects/i })).toBeInTheDocument();
    // No "Try again" — retrying a 401 as the same request can never succeed.
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("calls onSignIn when Sign in is clicked", () => {
    const onSignIn = vi.fn();
    render(
      <PlannerProjectLoadState
        state={unauthorizedState("demo-plan")}
        onRetry={noop}
        onBackToProjects={noop}
        onSignIn={onSignIn}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("renders access-denied copy with no retry and no sign-in for forbidden (403)", () => {
    render(
      <PlannerProjectLoadState
        state={forbiddenState("p_1", "You do not have access to this plan.")}
        onRetry={noop}
        onBackToProjects={noop}
        onSignIn={noop}
      />,
    );
    expect(screen.getByRole("heading", { name: /access denied/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to projects/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^sign in$/i })).not.toBeInTheDocument();
  });

  it("renders not-found heading and message", () => {
    render(
      <PlannerProjectLoadState
        state={notFoundState("p_invalid", "The requested plan was not found.")}
        onRetry={noop}
        onBackToProjects={noop}
        onSignIn={noop}
      />,
    );
    expect(screen.getByRole("heading", { name: /plan not found/i })).toBeInTheDocument();
    expect(screen.getByText("The requested plan was not found.")).toBeInTheDocument();
  });

  it("renders Try again and Back to projects buttons for not-found", () => {
    render(
      <PlannerProjectLoadState
        state={notFoundState("p_invalid")}
        onRetry={noop}
        onBackToProjects={noop}
        onSignIn={noop}
      />,
    );
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to projects/i })).toBeInTheDocument();
  });

  it("renders transient-error heading and message", () => {
    const msg = "The plan could not be loaded right now. Please try again.";
    render(
      <PlannerProjectLoadState
        state={transientErrorState("p_1", 503, msg)}
        onRetry={noop}
        onBackToProjects={noop}
        onSignIn={noop}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /temporarily unavailable/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(msg)).toBeInTheDocument();
  });

  it("calls onRetry when Try again is clicked", () => {
    const onRetry = vi.fn();
    render(
      <PlannerProjectLoadState
        state={notFoundState("p_bad")}
        onRetry={onRetry}
        onBackToProjects={noop}
        onSignIn={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onBackToProjects when Back to projects is clicked", () => {
    const onBack = vi.fn();
    render(
      <PlannerProjectLoadState
        state={transientErrorState("p_1", 429)}
        onRetry={noop}
        onBackToProjects={onBack}
        onSignIn={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /back to projects/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("has role=alert for error states", () => {
    const { rerender } = render(
      <PlannerProjectLoadState
        state={notFoundState("p_bad")}
        onRetry={noop}
        onBackToProjects={noop}
        onSignIn={noop}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(
      <PlannerProjectLoadState
        state={transientErrorState("p_1", 503)}
        onRetry={noop}
        onBackToProjects={noop}
        onSignIn={noop}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
