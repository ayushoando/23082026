/**
 * Discriminated load-state model for the Planner editor.
 *
 * Represents the user-visible project-load outcomes: draft, loading, ready,
 * unauthorized (401), forbidden (403), not-found (404), offline, connection
 * recovery, and transient server errors (429/5xx). Cancelled/Stale is an
 * internal control-flow concept (checked via request-key currency) and is
 * intentionally excluded from the rendered union.
 *
 * Offline and transient server failures remain separate so the UI can offer a
 * reconnect/retry action without presenting a network outage as a generic
 * server problem. Unauthorized and forbidden are not retryable until the
 * user's access changes.
 */
import type { PlannerProject } from "@planner/lib/plannerTypes";

/* ------------------------------------------------------------------ */
/* State union                                                         */
/* ------------------------------------------------------------------ */

export type PlannerLoadState =
  | { kind: "draft"; reason: "no-effective-project" }
  | { kind: "loading"; projectId: string; requestKey: string }
  | { kind: "ready"; projectId: string; project: PlannerProject }
  // Not retryable until the user signs in; the recovery action is a return
  // path to authentication, never a request retry.
  | { kind: "unauthorized"; projectId: string; status: 401; message: string }
  // The session exists but does not grant access to this project.
  | { kind: "forbidden"; projectId: string; status: 403; message: string }
  | { kind: "not-found"; projectId: string; status: 404; message: string }
  | {
      kind: "offline";
      projectId: string;
      message: string;
      retryable: true;
    }
  | {
      kind: "recovery";
      projectId: string;
      message: string;
      retryable: true;
    }
  | {
      kind: "transient-error";
      projectId: string;
      status?: number;
      message: string;
      retryable: true;
    };

/* ------------------------------------------------------------------ */
/* Type guards                                                         */
/* ------------------------------------------------------------------ */

export function isDraft(
  state: PlannerLoadState,
): state is Extract<PlannerLoadState, { kind: "draft" }> {
  return state.kind === "draft";
}

export function isLoading(
  state: PlannerLoadState,
): state is Extract<PlannerLoadState, { kind: "loading" }> {
  return state.kind === "loading";
}

export function isReady(
  state: PlannerLoadState,
): state is Extract<PlannerLoadState, { kind: "ready" }> {
  return state.kind === "ready";
}

export function isUnauthorized(
  state: PlannerLoadState,
): state is Extract<PlannerLoadState, { kind: "unauthorized" }> {
  return state.kind === "unauthorized";
}

export function isForbidden(
  state: PlannerLoadState,
): state is Extract<PlannerLoadState, { kind: "forbidden" }> {
  return state.kind === "forbidden";
}

export function isNotFound(
  state: PlannerLoadState,
): state is Extract<PlannerLoadState, { kind: "not-found" }> {
  return state.kind === "not-found";
}

export function isTransientError(
  state: PlannerLoadState,
): state is Extract<PlannerLoadState, { kind: "transient-error" }> {
  return state.kind === "transient-error";
}

export function isOffline(
  state: PlannerLoadState,
): state is Extract<PlannerLoadState, { kind: "offline" }> {
  return state.kind === "offline";
}

export function isRecovery(
  state: PlannerLoadState,
): state is Extract<PlannerLoadState, { kind: "recovery" }> {
  return state.kind === "recovery";
}

/* ------------------------------------------------------------------ */
/* Factory helpers                                                     */
/* ------------------------------------------------------------------ */

/** Singleton Draft state — no effective project to load. */
export const DRAFT: PlannerLoadState = {
  kind: "draft",
  reason: "no-effective-project",
};

export function loadingState(
  projectId: string,
  requestKey: string,
): PlannerLoadState {
  return { kind: "loading", projectId, requestKey };
}

export function readyState(
  projectId: string,
  project: PlannerProject,
): PlannerLoadState {
  return { kind: "ready", projectId, project };
}

export function unauthorizedState(
  projectId: string,
  message = "Sign in to continue working on this plan.",
): PlannerLoadState {
  return { kind: "unauthorized", projectId, status: 401, message };
}

export function forbiddenState(
  projectId: string,
  message = "You do not have access to this plan.",
): PlannerLoadState {
  return { kind: "forbidden", projectId, status: 403, message };
}

export function notFoundState(
  projectId: string,
  message = "The requested plan was not found.",
): PlannerLoadState {
  return { kind: "not-found", projectId, status: 404, message };
}

export function offlineState(
  projectId: string,
  message = "You are offline. Your current plan remains available. Reconnect and try loading again.",
): PlannerLoadState {
  return { kind: "offline", projectId, message, retryable: true };
}

export function recoveryState(
  projectId: string,
  message = "Connection restored. Retry loading the plan to review the latest saved version.",
): PlannerLoadState {
  return { kind: "recovery", projectId, message, retryable: true };
}

export function transientErrorState(
  projectId: string,
  status?: number,
  message = "The plan could not be loaded right now. Please try again.",
): PlannerLoadState {
  return { kind: "transient-error", projectId, status, message, retryable: true };
}
