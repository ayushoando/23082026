import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/site/data/routeClassification", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/site/data/routeClassification")>();
  return {
    ...actual,
    PLANNER_MARKETING_SITEMAP_PATHS: [
      ...actual.PLANNER_MARKETING_SITEMAP_PATHS,
      "/planner/features/unknown-thing",
      "",
    ],
  };
});

import { buildSitemapSections } from "@/features/site/data/htmlSitemap";

describe("htmlSitemap unlabeled path fallback", () => {
  it("title-cases an unknown last segment and returns the raw path when none exists", () => {
    const planner = buildSitemapSections().find((section) => section.heading === "Planner");
    expect(planner?.links).toEqual(
      expect.arrayContaining([
        { href: "/planner/features/unknown-thing", label: "Unknown Thing" },
        { href: "", label: "" },
      ]),
    );
  });
});
