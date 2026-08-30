import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listProjects = vi.fn();
const createProject = vi.fn();
const deleteProject = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@planner/lib/plannerApi", () => {
  class PlannerApiError extends Error {
    readonly status: number;

    constructor(status: number, _code: string, message: string) {
      super(message);
      this.status = status;
    }

    get isUnauthorized() {
      return this.status === 401;
    }

    get isForbidden() {
      return this.status === 403;
    }
  }

  return {
    PlannerApiError,
    listProjects: (...args: unknown[]) => listProjects(...args),
    createProject: (...args: unknown[]) => createProject(...args),
    deleteProject: (...args: unknown[]) => deleteProject(...args),
    fileUrl: (value: string | null | undefined) => value ?? null,
    isAbortError: (error: unknown) =>
      error instanceof DOMException && error.name === "AbortError",
  };
});

vi.mock("@planner/store/plannerUiStore", () => ({
  usePlannerUIStore: (selector: (state: { showToast: () => void }) => unknown) =>
    selector({ showToast: vi.fn() }),
}));

vi.mock("@/lib/analytics/conversionContract", () => ({
  trackPlannerProjectStart: vi.fn(),
}));

import { ProjectsList } from "@/components/Planner/PlannerProjectsList";
import { PlannerApiError } from "@planner/lib/plannerApi";

const project = {
  id: "plan-1",
  name: "Client floor",
  objects_count: 4,
  updated_at: "2026-08-30T00:00:00.000Z",
  thumbnail_url: null,
};

describe("PlannerProjectsList states and routing", () => {
  beforeEach(() => {
    listProjects.mockReset();
    listProjects.mockResolvedValue([]);
    createProject.mockReset();
    deleteProject.mockReset();
    push.mockReset();
    // happy-dom does not provide window.confirm; define it before spying.
    if (typeof window.confirm !== "function") {
      window.confirm = () => false;
    }
    vi.spyOn(window, "confirm").mockReturnValue(false);
  });

  it("identifies the pending list operation", () => {
    listProjects.mockReturnValue(new Promise(() => undefined));

    render(<ProjectsList />);

    expect(screen.getByTestId("projects-list-loading")).toHaveTextContent(
      "Loading saved plans",
    );
    expect(screen.getByTestId("projects-list-loading")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("shows empty-state actions after an authenticated empty result", async () => {
    render(<ProjectsList />);

    expect(await screen.findByTestId("projects-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("empty-state-new-plan")).toHaveAttribute(
      "href",
      "/ooplanner?new=1",
    );
    expect(screen.getByTestId("empty-state-sample-workspace")).toBeInTheDocument();
  });

  it("renders an error state without also rendering the empty state", async () => {
    listProjects.mockRejectedValue(new Error("network down"));

    render(<ProjectsList />);

    expect(await screen.findByTestId("projects-list-error")).toHaveAttribute(
      "data-error-kind",
      "server-error",
    );
    expect(screen.queryByTestId("projects-empty-state")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open guest workspace" })).toHaveAttribute(
      "href",
      "/ooplanner",
    );
  });

  it("offers sign-in instead of retry when the authenticated session expires", async () => {
    listProjects.mockRejectedValue(
      new PlannerApiError(401, "AUTH_REQUIRED", "Authentication required"),
    );

    render(<ProjectsList />);

    expect(await screen.findByTestId("projects-list-error")).toHaveAttribute(
      "data-error-kind",
      "unauthenticated",
    );
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/access?next=%2Fooplanner%2Fprojects",
    );
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("routes the header new-plan action to an explicit blank draft", async () => {
    render(<ProjectsList />);

    expect(await screen.findByTestId("btn-new-project")).toHaveAttribute(
      "href",
      "/ooplanner?new=1",
    );
  });

  it("uses a route link for opening a project and keeps delete as a separate control", async () => {
    listProjects.mockResolvedValue([project]);

    render(<ProjectsList />);

    const openLink = await screen.findByRole("link", { name: "Open plan Client floor" });
    expect(openLink).toHaveAttribute("href", "/ooplanner/projects/plan-1");

    fireEvent.click(screen.getByRole("button", { name: "Delete plan Client floor" }));
    expect(push).not.toHaveBeenCalled();
  });
});
