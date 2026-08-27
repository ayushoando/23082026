"use client";
import { useEffect, useRef } from "react";
import type { PlannerLoadState } from "./plannerLoadState";

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

export interface PlannerProjectLoadStateProps {
  state: PlannerLoadState;
  onRetry: () => void;
  onBackToProjects: () => void;
  /**
   * Sign-in action, offered only for `unauthorized`. Carries a return path
   * back to the requested project. Required because a signed-out user
   * cannot be shown "Try again" — the same request will fail again until
   * they sign in. See .kiro/specs/remediation-unified/design.md §3.1.
   */
  onSignIn: () => void;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * Planner-owned recovery/loading surface.
 *
 * Renders inline load feedback or error recovery UI based on the
 * discriminated PlannerLoadState. Does not call the API directly or
 * own navigation — those are parent-supplied callbacks.
 */
export function PlannerProjectLoadState({
  state,
  onRetry,
  onBackToProjects,
  onSignIn,
}: PlannerProjectLoadStateProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  /* Move focus to the heading when transitioning to an error state */
  useEffect(() => {
    if (
      state.kind === "unauthorized" ||
      state.kind === "forbidden" ||
      state.kind === "not-found" ||
      state.kind === "transient-error"
    ) {
      headingRef.current?.focus();
    }
  }, [state.kind]);

  /* Draft and Ready are not rendered by this component */
  if (state.kind === "draft" || state.kind === "ready") {
    return null;
  }

  /* Loading state */
  if (state.kind === "loading") {
    return (
      <div className="planner-load-state" role="status" aria-busy="true">
        <h2
          className="planner-load-state__heading"
          ref={headingRef}
          tabIndex={-1}
        >
          Loading plan…
        </h2>
      </div>
    );
  }

  /* Unauthorized (401) — not retryable. Offer sign-in, not "Try again". */
  if (state.kind === "unauthorized") {
    return (
      <div className="planner-load-state" role="alert">
        <h2
          className="planner-load-state__heading"
          ref={headingRef}
          tabIndex={-1}
        >
          Sign in required
        </h2>
        <p className="planner-load-state__message">{state.message}</p>
        <div className="planner-load-state__actions">
          <button type="button" className="btn" onClick={onSignIn}>
            Sign in
          </button>
          <button type="button" className="btn" onClick={onBackToProjects}>
            Back to projects
          </button>
        </div>
      </div>
    );
  }

  /* Forbidden (403) — also not retryable. No sign-in action: the user is
     already signed in and lacks access, so only recovery is the list. */
  if (state.kind === "forbidden") {
    return (
      <div className="planner-load-state" role="alert">
        <h2
          className="planner-load-state__heading"
          ref={headingRef}
          tabIndex={-1}
        >
          Access denied
        </h2>
        <p className="planner-load-state__message">{state.message}</p>
        <div className="planner-load-state__actions">
          <button type="button" className="btn" onClick={onBackToProjects}>
            Back to projects
          </button>
        </div>
      </div>
    );
  }

  /* Retryable error states: not-found and transient-error */
  const heading =
    state.kind === "not-found" ? "Plan not found" : "Temporarily unavailable";

  return (
    <div className="planner-load-state" role="alert">
      <h2
        className="planner-load-state__heading"
        ref={headingRef}
        tabIndex={-1}
      >
        {heading}
      </h2>

      <p className="planner-load-state__message">{state.message}</p>

      <div className="planner-load-state__actions">
        <button type="button" className="btn" onClick={onRetry}>
          Try again
        </button>
        <button type="button" className="btn" onClick={onBackToProjects}>
          Back to projects
        </button>
      </div>
    </div>
  );
}

export default PlannerProjectLoadState;
