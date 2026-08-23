import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CatalogLastUpdated } from "@/features/site/catalog/CatalogLastUpdated";

describe("CatalogLastUpdated", () => {
  it("renders a formatted last-updated line", () => {
    render(<CatalogLastUpdated isoDate="2026-08-17T12:00:00.000Z" />);
    expect(screen.getByTestId("catalog-last-updated")).toHaveTextContent(/Last updated/i);
    expect(screen.getByTestId("catalog-last-updated")).toHaveTextContent(/2026/);
  });

  it("renders nothing for invalid dates", () => {
    const { container } = render(<CatalogLastUpdated isoDate="not-a-date" />);
    expect(container).toBeEmptyDOMElement();
  });
});
