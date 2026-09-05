import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/data/featuresData", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/data/featuresData")>();
  return {
    ...actual,
    otherFeatureRecords: [
      {
        kind: "misc",
        slug: "misc-fact",
        title: "Misc fact",
        tagline: "tag",
        summary: "summary",
        sourcePath: "site/example.ts",
        sourcePointer: "example",
      },
    ],
  };
});

import { Features } from "../src/pages/Features";

describe("Features page", () => {
  it("renders generated feature sections from live data", () => {
    render(
      <MemoryRouter>
        <Features />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Features" })).toBeTruthy();
    expect(screen.getByText("Product surfaces")).toBeTruthy();
    expect(screen.getByText("Auth roles")).toBeTruthy();
    expect(screen.getByText("Other generated feature facts")).toBeTruthy();
    expect(screen.getAllByText("Misc fact").length).toBeGreaterThan(0);
    expect(screen.getByText("All feature facts (raw)")).toBeTruthy();
  });
});
