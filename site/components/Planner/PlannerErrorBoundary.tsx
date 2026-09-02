"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { logClientError } from "@/lib/errorLogger";

interface PlannerErrorBoundaryProps {
  children: ReactNode;
}

interface PlannerErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Local error boundary for the planner workspace (finding 17.1).
 *
 * Route-level `app/ooplanner/error.tsx` is the last resort — it replaces the
 * whole route and loses all workspace chrome. This boundary sits INSIDE
 * `Planner.tsx` around the `planner-stack` workspace so a render crash in a
 * sub-panel (dock, dialogs, canvas overlay chrome) degrades to an in-place
 * recovery panel instead of falling to the route boundary. Errors thrown by
 * `Planner` itself are caught one level up (route `error.tsx`).
 */
export class PlannerErrorBoundary extends Component<
  PlannerErrorBoundaryProps,
  PlannerErrorBoundaryState
> {
  constructor(props: PlannerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PlannerErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void logClientError({
      error,
      label: "planner-workspace-local",
      componentStack: info?.componentStack ?? "",
    });
  }

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="planner-stack" data-testid="planner-error-fallback">
        <section
          className="planner-save-state"
          role="alert"
          data-save-issue="server"
        >
          <span className="planner-save-state__message">
            <strong>The planner workspace hit an unexpected error.</strong>{" "}
            Your plan stays saved on this device. Reload the page to continue
            where you left off.
          </span>
          <span>
            <button type="button" onClick={this.handleReload}>
              Reload planner
            </button>{" "}
            <a href="/portal">Open saved plans</a>
          </span>
        </section>
        {this.state.error?.message ? (
          <p data-testid="planner-error-fallback-message">
            {this.state.error.message}
          </p>
        ) : null}
      </div>
    );
  }
}
