import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlannerProjectAccessState } from "@/components/Planner/PlannerProjectAccessState";

describe("PlannerProjectAccessState", () => {
  it("requires sign-in before a guest can list private plans", () => {
    render(
      <PlannerProjectAccessState
        context="project-list"
        returnPath="/ooplanner/projects"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Sign in to view saved plans" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/access?next=%2Fooplanner%2Fprojects",
    );
    expect(
      screen.getByRole("link", { name: "Continue in guest workspace" }),
    ).toHaveAttribute("href", "/ooplanner");
  });

  it("preserves a project return path for sign-in", () => {
    render(
      <PlannerProjectAccessState
        context="project"
        returnPath="/ooplanner/projects/plan-1"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Sign in to open this plan" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/access?next=%2Fooplanner%2Fprojects%2Fplan-1",
    );
  });
});
