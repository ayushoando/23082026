import { PlannerApiError } from "@planner/lib/plannerApi";

export type PlannerProjectsListFailureKind =
  | "forbidden"
  | "rate-limited"
  | "server-error"
  | "unauthenticated";

export interface PlannerProjectsListFailure {
  kind: PlannerProjectsListFailureKind;
  heading: string;
  message: string;
  retryable: boolean;
}

export function classifyPlannerProjectsListFailure(
  error: unknown,
): PlannerProjectsListFailure {
  if (error instanceof PlannerApiError && error.isUnauthorized) {
    return {
      kind: "unauthenticated",
      heading: "Sign in required",
      message: "Your session ended. Sign in again to view your saved plans.",
      retryable: false,
    };
  }

  if (error instanceof PlannerApiError && error.isForbidden) {
    return {
      kind: "forbidden",
      heading: "Saved plans unavailable",
      message: "Your account does not have permission to access saved plans.",
      retryable: false,
    };
  }

  if (error instanceof PlannerApiError && error.status === 429) {
    return {
      kind: "rate-limited",
      heading: "Please wait before retrying",
      message: "Saved plans could not be loaded because too many requests were made.",
      retryable: true,
    };
  }

  return {
    kind: "server-error",
    heading: "Saved plans are temporarily unavailable",
    message: "We could not load your saved plans. Your existing plans have not been changed.",
    retryable: true,
  };
}
