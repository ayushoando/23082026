import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const listProjects = vi.fn();
const createProject = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@planner/lib/plannerApi", () => ({
  listProjects: (...args: unknown[]) => listProjects(...args),
  createProject: (...args: unknown[]) => createProject(...args),
  deleteProject: vi.fn(),
  fileUrl: vi.fn(),
}));

vi.mock("@planner/store/plannerUiStore", () => ({
  usePlannerUIStore: (sel: (s: { showToast: () => void }) => unknown) =>
    sel({ showToast: vi.fn() }),
}));

vi.mock("@/lib/analytics/conversionContract", () => ({
  trackPlannerProjectStart: vi.fn(),
}));

import ProjectsList from "@/components/Planner/PlannerProjectsList";

describe("PlannerProjectsList empty state", () => {
  beforeEach(() => {
    listProjects.mockReset();
    listProjects.mockResolvedValue([]);
    push.mockReset();
  });

  it("shows two CTAs: new plan and sample workspace", async () => {
    render(<ProjectsList />);
    expect(await screen.findByTestId("projects-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("empty-state-new-plan")).toBeInTheDocument();
    expect(screen.getByTestId("empty-state-sample-workspace")).toBeInTheDocument();
  });
});
