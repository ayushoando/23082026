//
// Feature: client-showcase-tabs, Properties 6–7: card labelling and content.
// Component tests for ClientCard (plans/client-showcase-tabs task 8.5).

// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ClientCard } from "@/components/site/clients/ClientCard";
import type { ClientRecord } from "@/lib/clients/clientTypes";

const record: ClientRecord = {
  canonicalId: "tata-motors",
  displayName: "Tata Motors Limited",
  sourceNames: ["Tata Motors"],
  sectorTab: "corporates-multinationals",
  logoPath: "/assets/marketing/client-logos/tata-motors.svg",
  published: true,
};

describe("ClientCard", () => {
  it("labels the card article with the display name", () => {
    const { container } = render(<ClientCard record={record} />);
    const article = container.querySelector("article");
    expect(article?.getAttribute("aria-label")).toBe("Tata Motors Limited");
  });

  it("renders the full display name as visible text", () => {
    const { container } = render(<ClientCard record={record} />);
    expect(container.textContent).toContain("Tata Motors Limited");
  });

  it("shows the logo image for records with an approved logoPath", () => {
    const { container } = render(<ClientCard record={record} />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/assets/marketing/client-logos/tata-motors.svg",
    );
  });

  it("falls back to initials for records without a logoPath", () => {
    const { container } = render(
      <ClientCard record={{ ...record, logoPath: undefined }} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("TM");
  });
});
