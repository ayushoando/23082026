/**
 * Discriminated load-state model for the Planner editor.
 *
 * Represents the seven user-visible project-load outcomes: draft, loading,
 * ready, unauthorized (401), forbidden (403), not-found (404), and
 * transient-error (429/5xx/network). Cancelled/Stale is an internal
 * control-flow concept (checked via request-key currency) and is
 * intentionally excluded from the rendered union.
 *
 * unauthorized and forbidden are NOT retryable — see
 * .kiro/specs/remediation-unified/audit.md D8 for why a single retryable
 * TransientError bucket is wrong for a signed-out user.
 */
import type { PlannerProject } from "@planner/lib/plannerTypes";

/* ------------------------------------------------------------------ */
/* State union                                                         */
/* ------------------------------------------------------------------ */

export type PlannerLoadState =
  | { kind: "draft"; reason: "no-effective-project" }
  | { kind: "loading"; projectId: string; requestKey: string }
  | { kind: "ready"; projectId: string; project: PlannerProject }
  // Only failure state a persisted audit artifact actually recorded (401 on
  // /api/Planner/projects/demo-plan/ — .kiro/specs/remediation-unified/audit.md
  // D7). Not retryable: the session is missing entirely, so the recovery
  // action is sign-in with a return path, never "Try again".
  | { kind: "unauthorized"; projectId: string; status: 401; message: string }
  // Session exists but lacks permission. Also not retryable — the same
  // request will not succeed later. The [id] route currently masks a
  // foreign project as 404 rather than 403, so this is reachable only via
  // other withAuth role checks.
  | { kind: "forbidden"; projectId: string; status: 403; message: string }
  | { kind: "not-found"; projectId: string; status: 404; message: string }
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

export function transientErrorState(
  projectId: string,
  status?: number,
  message = "The plan could not be loaded right now. Please try again.",
): PlannerLoadState {
  return { kind: "transient-error", projectId, status, message, retryable: true };
}
