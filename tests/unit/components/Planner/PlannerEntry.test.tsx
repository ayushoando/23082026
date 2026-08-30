import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@planner/components/Planner", () => ({
  default: ({
    accessMode,
    projectStartIntent,
  }: {
    accessMode: string;
    projectStartIntent: string;
  }) => (
    <div
      data-testid="planner"
      data-access-mode={accessMode}
      data-project-start-intent={projectStartIntent}
    />
  ),
}));

import { PlannerEntry } from "@/components/Planner/PlannerEntry";

describe("PlannerEntry", () => {
  it("keeps guest catalog workflow reachable and offers sign-in for project operations", () => {
    render(<PlannerEntry accessMode="guest" />);

    expect(screen.getByText("Guest workspace")).toBeInTheDocument();
    expect(screen.getByTestId("planner")).toHaveAttribute("data-access-mode", "guest");
    expect(screen.getByTestId("planner")).toHaveAttribute(
      "data-project-start-intent",
      "resume",
    );
    expect(screen.getByRole("link", { name: "Sign in to save" })).toHaveAttribute(
      "href",
      "/access?next=%2Fooplanner",
    );
  });

  it("passes a requested new-project intent into the authenticated workspace", () => {
    render(<PlannerEntry accessMode="authenticated" projectStartIntent="new" />);

    expect(screen.getByText("Signed-in workspace")).toBeInTheDocument();
    expect(screen.getByTestId("planner")).toHaveAttribute(
      "data-access-mode",
      "authenticated",
    );
    expect(screen.getByTestId("planner")).toHaveAttribute(
      "data-project-start-intent",
      "new",
    );
    expect(screen.getByRole("link", { name: "View saved plans" })).toHaveAttribute(
      "href",
      "/ooplanner/projects",
    );
  });
});
