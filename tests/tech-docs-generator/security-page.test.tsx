import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Security } from "../../tech-docs-generator/src/pages/Security";

describe("Security page", () => {
  it("renders security layers from live data", () => {
    render(
      <MemoryRouter>
        <Security />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Security Practices" }),
    ).toBeTruthy();
    expect(screen.getByText("Security Layers")).toBeTruthy();
    expect(screen.getByText("Authentication")).toBeTruthy();
  });
});
