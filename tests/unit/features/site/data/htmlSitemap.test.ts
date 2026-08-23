import { describe, expect, it } from "vitest";
import {
  PLANNER_MARKETING_SITEMAP_PATHS,
  PUBLIC_INDEXABLE_STATIC_PATHS,
  SOLUTION_CATEGORY_IDS,
  SOLUTION_CATEGORY_SITEMAP_PATHS,
} from "@/features/site/data/routeClassification";
import {
  ADMIN_HTML_SITEMAP_PATHS,
  buildSitemapCsv,
  buildSitemapCsvRows,
  buildSitemapSections,
  getHtmlSitemapHrefs,
  getSitemapConceptualOverlaps,
  getSitemapDuplicateHrefs,
} from "@/features/site/data/htmlSitemap";

describe("htmlSitemap buildSitemapSections", () => {
  const sections = buildSitemapSections();
  const hrefs = getHtmlSitemapHrefs(sections);

  it("includes all indexable static paths from routeClassification", () => {
    for (const path of PUBLIC_INDEXABLE_STATIC_PATHS) {
      expect(hrefs).toContain(path);
    }
  });

  it("includes planner marketing and solution category sitemap paths", () => {
    for (const path of PLANNER_MARKETING_SITEMAP_PATHS) {
      expect(hrefs).toContain(path);
    }
    for (const path of SOLUTION_CATEGORY_SITEMAP_PATHS) {
      expect(hrefs).toContain(path);
    }
  });

  it("includes product category catalog paths", () => {
    for (const id of SOLUTION_CATEGORY_IDS) {
      expect(hrefs).toContain(`/products/${id}`);
    }
  });

  it("includes the XML sitemap link and all admin HTML routes", () => {
    expect(hrefs).toContain("/sitemap.xml");
    for (const path of ADMIN_HTML_SITEMAP_PATHS) {
      expect(hrefs).toContain(path);
    }
  });

  it("excludes protected and noindex utility routes outside the admin section", () => {
    const blocked = [
      "/quote-cart",
      "/tracking",
      "/access",
      "/portal",
      "/dashboard",
      "/api/health",
      "/ooplanner/",
      "/planner/canvas",
      "/planner/guest",
      "/choose-product",
    ];
    for (const path of blocked) {
      expect(hrefs.some((href) => href === path || href.startsWith(`${path}/`))).toBe(false);
    }
  });

  it("organizes links into six sections including admin", () => {
    expect(sections.map((section) => section.heading)).toEqual([
      "Products & catalog",
      "Solutions",
      "Planner",
      "Company & service",
      "Legal & policies",
      "Admin",
    ]);
    expect(sections.every((section) => section.links.length > 0)).toBe(true);
  });

  it("does not repeat the same href across multiple sections", () => {
    expect(getSitemapDuplicateHrefs(sections)).toEqual([]);
  });

  it("documents conceptual product/solution category overlaps by slug", () => {
    const overlaps = getSitemapConceptualOverlaps(sections);
    expect(overlaps).toHaveLength(SOLUTION_CATEGORY_IDS.length);
    expect(overlaps.map((overlap) => overlap.slug)).toEqual([...SOLUTION_CATEGORY_IDS]);
  });

  it("exports CSV rows for every HTML sitemap link", () => {
    const rows = buildSitemapCsvRows(sections);
    expect(rows).toHaveLength(hrefs.length);
    expect(rows.some((row) => row.section === "Admin" && row.inXmlSitemap === "no")).toBe(true);
    expect(buildSitemapCsv(sections).split("\n")[0]).toBe(
      "section,path,label,audience,in_xml_sitemap,conceptual_pair_slug",
    );
  });
});

describe("htmlSitemap branch coverage", () => {
  it("reports duplicate hrefs and ignores a second copy in the same section", () => {
    expect(
      getSitemapDuplicateHrefs([
        {
          heading: "A",
          links: [
            { href: "/x", label: "X" },
            { href: "/x", label: "X again" },
          ],
        },
        { heading: "B", links: [{ href: "/x", label: "X" }, { href: "/y", label: "Y" }] },
      ]),
    ).toEqual([{ href: "/x", sections: ["A", "B"] }]);
  });

  it("returns no conceptual overlaps when product or solution sections are missing", () => {
    expect(getSitemapConceptualOverlaps([])).toEqual([]);
    expect(
      getSitemapConceptualOverlaps([{ heading: "Planner", links: [{ href: "/planner", label: "Planner" }] }]),
    ).toEqual([]);
  });

  it("skips a category that is missing from one side of the product/solution pair", () => {
    const overlaps = getSitemapConceptualOverlaps([
      {
        heading: "Products & catalog",
        links: [{ href: "/products/seating", label: "Seating" }],
      },
      {
        heading: "Solutions",
        links: [
          { href: "/solutions/seating", label: "Seating" },
          { href: "/solutions/tables", label: "Tables" },
        ],
      },
    ]);
    expect(overlaps.map((overlap) => overlap.slug)).toEqual(["seating"]);
  });

  it("quotes CSV cells that contain commas or quotes and defaults sections when omitted", () => {
    const csv = buildSitemapCsv([
      {
        heading: 'Legal, "policies"',
        links: [{ href: "/privacy", label: 'Privacy, "policy"' }],
      },
    ]);
    expect(csv.split("\n")[1]).toBe(
      '"Legal, ""policies""",/privacy,"Privacy, ""policy""",public,yes,',
    );

    const rows = buildSitemapCsvRows();
    expect(rows.length).toBe(getHtmlSitemapHrefs(buildSitemapSections()).length);
    expect(rows.some((row) => row.path === "/sitemap.xml" && row.inXmlSitemap === "no")).toBe(
      true,
    );
  });
});
