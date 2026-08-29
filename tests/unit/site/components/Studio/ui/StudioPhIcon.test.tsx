import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { PhIcon } from "@studio/components/ui/StudioPhIcon";
import { PH_ICON_MAP, resolvePhIcon } from "@studio/components/ui/studioPhIconMap";

describe("Studio PhIcon", () => {
  it("resolves every Studio-owned key and falls back to the Studio cursor", () => {
    for (const [name, icon] of Object.entries(PH_ICON_MAP)) {
      expect(resolvePhIcon(name)).toBe(icon);
    }
    expect(resolvePhIcon("not-a-studio-icon")).toBe(PH_ICON_MAP.cursor);
  });

  it("renders a decorative icon with Studio defaults and size overrides", () => {
    const { container, rerender } = render(
      createElement(PhIcon, { name: "alignLeft", className: "studio-icon" }),
    );
    let icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("width", "20");
    expect(icon).toHaveAttribute("height", "20");
    expect(icon).toHaveClass("studio-icon");

    rerender(createElement(PhIcon, { name: "alignLeft", size: 30, weight: "bold" }));
    icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("width", "30");
    expect(icon).toHaveAttribute("height", "30");
  });
});
