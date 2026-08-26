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
}: PlannerProjectLoadStateProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  /* Move focus to the heading when transitioning to an error state */
  useEffect(() => {
    if (state.kind === "not-found" || state.kind === "transient-error") {
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

  /* Error states: not-found and transient-error */
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
