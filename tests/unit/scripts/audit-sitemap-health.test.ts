// @vitest-environment node
//
// Covers the pure sitemap parsing used by scripts/general/audit-sitemap-health.mjs
// (SEC / SEO-R01 code-side remedy). Importing the module does not trigger the
// network run because the script guards execution behind a CLI entrypoint check.

import { describe, expect, it } from "vitest";
import { extractLocs } from "../../../scripts/general/audit-sitemap-health.mjs";

describe("audit-sitemap-health extractLocs", () => {
  it("extracts url-set <loc> entries", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://oando.co.in/</loc><changefreq>weekly</changefreq></url>
        <url><loc>
          https://oando.co.in/planner
        </loc></url>
      </urlset>`;
    expect(extractLocs(xml)).toEqual([
      "https://oando.co.in/",
      "https://oando.co.in/planner",
    ]);
  });

  it("extracts child sitemap locations from an index", () => {
    const xml = `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap><loc>https://oando.co.in/sitemap-pages.xml</loc></sitemap>
      <sitemap><loc>https://oando.co.in/sitemap-products.xml</loc></sitemap>
    </sitemapindex>`;
    expect(extractLocs(xml)).toEqual([
      "https://oando.co.in/sitemap-pages.xml",
      "https://oando.co.in/sitemap-products.xml",
    ]);
  });

  it("returns an empty list when there are no locations", () => {
    expect(extractLocs("<urlset></urlset>")).toEqual([]);
  });
});
