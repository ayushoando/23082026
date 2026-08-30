import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOptionalPlannerUser: vi.fn(),
}));

vi.mock("@/lib/auth/plannerSession", () => ({
  getOptionalPlannerUser: () => mocks.getOptionalPlannerUser(),
}));

vi.mock("@planner/components/PlannerEntry", () => ({
  PlannerEntry: ({
    accessMode,
    projectStartIntent,
  }: {
    accessMode: string;
    projectStartIntent: string;
  }) => (
    <div
      data-testid="planner-entry"
      data-access-mode={accessMode}
      data-project-start-intent={projectStartIntent}
    />
  ),
}));

vi.mock("@planner/components/PlannerProjectsList", () => ({
  ProjectsList: () => <div data-testid="projects-list" />,
}));

vi.mock("@planner/components/PlannerProjectAccessState", () => ({
  PlannerProjectAccessState: ({
    context,
    returnPath,
  }: {
    context: string;
    returnPath: string;
  }) => (
    <div
      data-testid="project-access-state"
      data-context={context}
      data-return-path={returnPath}
    />
  ),
}));

vi.mock("@planner/components/Planner", () => ({
  default: ({ accessMode }: { accessMode: string }) => (
    <div data-testid="planner-workspace-entry" data-access-mode={accessMode} />
  ),
}));

import { PlannerPage } from "@/features/Planner/page";
import { PlannerProjectsPage } from "@/features/Planner/projects/page";
import { PlannerProjectPage } from "@/features/Planner/projects/[id]/page";

describe("Planner route feature entries", () => {
  beforeEach(() => {
    mocks.getOptionalPlannerUser.mockReset();
  });

  it("selects the guest bare-route entry from the verified server session", async () => {
    mocks.getOptionalPlannerUser.mockResolvedValue(null);

    render(await PlannerPage());

    expect(screen.getByTestId("planner-entry")).toHaveAttribute(
      "data-access-mode",
      "guest",
    );
    expect(screen.getByTestId("planner-entry")).toHaveAttribute(
      "data-project-start-intent",
      "resume",
    );
  });

  it("starts a new authenticated draft without resuming a remembered project", async () => {
    mocks.getOptionalPlannerUser.mockResolvedValue({ id: "owner-1" });

    render(await PlannerPage({ searchParams: Promise.resolve({ new: "1" }) }));

    expect(screen.getByTestId("planner-entry")).toHaveAttribute(
      "data-access-mode",
      "authenticated",
    );
    expect(screen.getByTestId("planner-entry")).toHaveAttribute(
      "data-project-start-intent",
      "new",
    );
  });

  it("renders the project list only for an authenticated owner", async () => {
    mocks.getOptionalPlannerUser.mockResolvedValue({ id: "owner-1" });

    render(await PlannerProjectsPage());

    expect(screen.getByTestId("projects-list")).toBeInTheDocument();
    expect(screen.queryByTestId("project-access-state")).not.toBeInTheDocument();
  });

  it("stops a guest project-list request before the client list mounts", async () => {
    mocks.getOptionalPlannerUser.mockResolvedValue(null);

    render(await PlannerProjectsPage());

    expect(screen.getByTestId("project-access-state")).toHaveAttribute(
      "data-context",
      "project-list",
    );
    expect(screen.queryByTestId("projects-list")).not.toBeInTheDocument();
  });

  it("preserves the requested project return path for a guest", async () => {
    mocks.getOptionalPlannerUser.mockResolvedValue(null);

    render(
      await PlannerProjectPage({
        params: Promise.resolve({ id: "client plan" }),
      }),
    );

    expect(screen.getByTestId("project-access-state")).toHaveAttribute(
      "data-return-path",
      "/ooplanner/projects/client%20plan",
    );
    expect(screen.queryByTestId("planner-workspace-entry")).not.toBeInTheDocument();
  });
});
