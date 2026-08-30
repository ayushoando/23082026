"use client";

import { PlannerStateSurface } from "@planner/components/ui/PlannerStateSurface";
import type { PlannerVisualStateKind } from "@planner/components/ui/PlannerStateSurface";
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
   * they sign in. See plans/ref/remediation-unified/design.md §3.1.
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
  /* Draft and Ready are not rendered by this component. */
  if (state.kind === "draft" || state.kind === "ready") {
    return null;
  }

  const surfaceProps = {
    as: "div" as const,
    className: "planner-load-state",
    headingClassName: "planner-load-state__heading",
    messageClassName: "planner-load-state__message",
    actionsClassName: "planner-load-state__actions",
    focusOnRender: true,
  };

  /* Loading state */
  if (state.kind === "loading") {
    return (
      <PlannerStateSurface
        {...surfaceProps}
        kind="loading"
        heading="Loading plan…"
        message=""
        role="status"
        busy
      />
    );
  }

  /* Unauthorized (401) — not retryable. Offer sign-in, not "Try again". */
  if (state.kind === "unauthorized") {
    return (
      <PlannerStateSurface
        {...surfaceProps}
        kind="unauthenticated"
        heading="Sign in required"
        message={state.message}
        role="alert"
        actions={
          <>
            <button
              type="button"
              className="btn"
              data-planner-primary-action
              onClick={onSignIn}
            >
              Sign in
            </button>
            <button type="button" className="btn" onClick={onBackToProjects}>
              Back to projects
            </button>
          </>
        }
      />
    );
  }

  /* Forbidden (403) — also not retryable. No sign-in action: the user is
     already signed in and lacks access, so only recovery is the list. */
  if (state.kind === "forbidden") {
    return (
      <PlannerStateSurface
        {...surfaceProps}
        kind="forbidden"
        heading="Access denied"
        message={state.message}
        role="alert"
        actions={
          <button
            type="button"
            className="btn"
            data-planner-primary-action
            onClick={onBackToProjects}
          >
            Back to projects
          </button>
        }
      />
    );
  }

  /* Offline and connection-restored states remain distinct from a generic
     server error. The retry stays explicit so reconnecting never replaces
     the current in-memory document without a user action. */
  if (state.kind === "offline" || state.kind === "recovery") {
    const offline = state.kind === "offline";
    return (
      <PlannerStateSurface
        {...surfaceProps}
        kind={state.kind}
        heading={offline ? "You are offline" : "Connection restored"}
        message={state.message}
        role="alert"
        actions={
          <>
            <button
              type="button"
              className="btn"
              data-planner-primary-action
              onClick={onRetry}
            >
              {offline ? "Retry connection" : "Retry load"}
            </button>
            <button type="button" className="btn" onClick={onBackToProjects}>
              Back to projects
            </button>
          </>
        }
      />
    );
  }

  /* Retryable persisted-data outcomes: not-found, rate-limited, and
     transient server errors. */
  const kind: PlannerVisualStateKind =
    state.kind === "not-found"
      ? "not-found"
      : state.status === 429
        ? "rate-limited"
        : "server-error";
  const heading =
    state.kind === "not-found"
      ? "Plan not found"
      : state.status === 429
        ? "Please wait before retrying"
        : "Temporarily unavailable";

  return (
    <PlannerStateSurface
      {...surfaceProps}
      kind={kind}
      heading={heading}
      message={state.message}
      role="alert"
      actions={
        <>
          <button
            type="button"
            className="btn"
            data-planner-primary-action
            onClick={onRetry}
          >
            Try again
          </button>
          <button type="button" className="btn" onClick={onBackToProjects}>
            Back to projects
          </button>
        </>
      }
    />
  );
}
