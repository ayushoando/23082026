import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@planner/components/Planner", () => ({
  default: ({ accessMode }: { accessMode: string }) => (
    <div data-testid="planner" data-access-mode={accessMode} />
  ),
}));

import { PlannerEntry } from "@/components/Planner/PlannerEntry";

describe("PlannerEntry", () => {
  it("keeps guest catalog workflow reachable and offers sign-in for project operations", () => {
    render(<PlannerEntry accessMode="guest" />);

    expect(screen.getByText("Guest workspace")).toBeInTheDocument();
    expect(screen.getByTestId("planner")).toHaveAttribute("data-access-mode", "guest");
    expect(screen.getByRole("link", { name: "Sign in to save" })).toHaveAttribute(
      "href",
      "/access?next=%2Fooplanner",
    );
  });

  it("links an authenticated owner to the saved project list", () => {
    render(<PlannerEntry accessMode="authenticated" />);

    expect(screen.getByText("Signed-in workspace")).toBeInTheDocument();
    expect(screen.getByTestId("planner")).toHaveAttribute(
      "data-access-mode",
      "authenticated",
    );
    expect(screen.getByRole("link", { name: "View saved plans" })).toHaveAttribute(
      "href",
      "/ooplanner/projects",
    );
  });
});
