import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import { PH_ICON_MAP, resolvePhIcon } from "@planner/components/ui/plannerPhIconMap";

describe("Planner PhIcon", () => {
  it("resolves every Planner-owned key and falls back to the Planner cursor", () => {
    for (const [name, icon] of Object.entries(PH_ICON_MAP)) {
      expect(resolvePhIcon(name)).toBe(icon);
    }
    expect(resolvePhIcon("not-a-planner-icon")).toBe(PH_ICON_MAP.cursor);
  });

  it("renders accessible decorative geometry with Planner defaults and overrides", () => {
    const { container, rerender } = render(
      createElement(PhIcon, { name: "save", className: "planner-icon" }),
    );
    let icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("width", "18");
    expect(icon).toHaveAttribute("height", "18");
    expect(icon).toHaveClass("planner-icon");

    rerender(createElement(PhIcon, { name: "save", size: 28, weight: "fill" }));
    icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("width", "28");
    expect(icon).toHaveAttribute("height", "28");
  });
});
