// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  buildBreadcrumbJsonLd,
  buildCareerJobsJsonLd,
  buildFaqJsonLd,
  buildGlobalJsonLd,
  buildPageMetadata,
  buildProductJsonLd,
  canonicalPath,
  countBrandPipeSegments,
  resolveDocumentTitle,
  sanitizeCanonicalPath,
  buildCanonicalUrl,
} from "@/features/site/data/seo";
import {
  SEO01_STATIC_METADATA,
  expectedStaticSitemapPaths,
  metadataTitleString,
} from "@/features/site/data/siteSeoContract";
import {
  ROBOTS_DISALLOW_PREFIXES,
} from "@/features/site/data/routeClassification";
import { SITE_FOOTER_NAV, SITE_HEADER_PRIMARY_LINKS } from "@/features/site/data/navigation";
import { buildSitemapSections } from "@/features/site/data/htmlSitemap";
import { SITE_BRAND } from "@/features/site/data/brand";

const TEST_SITE_URL = "https://oando.co.in";

describe("SEO Standards Audit: Schema.org Rich Results Compliance", () => {
  it("buildGlobalJsonLd produces valid Organization, WebSite, and FurnitureStore entities", () => {
    const globalGraph = buildGlobalJsonLd(TEST_SITE_URL);
    expect(globalGraph["@context"]).toBe("https://schema.org");
    expect(Array.isArray(globalGraph["@graph"])).toBe(true);

    const org = globalGraph["@graph"].find((item) => item["@type"] === "Organization");
    expect(org).toBeDefined();
    expect(org?.name).toBe(SITE_BRAND.companyName);
    expect(org?.legalName).toBe(SITE_BRAND.legalName);
    expect(org?.url).toBe(TEST_SITE_URL);
    expect(org?.logo).toMatch(/^https:\/\/oando\.co\.in\/.+/);
    expect(Array.isArray(org?.contactPoint)).toBe(true);
    expect(org?.contactPoint?.length).toBeGreaterThanOrEqual(1);
    for (const cp of org?.contactPoint || []) {
      expect(cp["@type"]).toBe("ContactPoint");
      expect(cp.telephone).toBeTruthy();
      expect(cp.contactType).toBeTruthy();
    }

    const website = globalGraph["@graph"].find((item) => item["@type"] === "WebSite");
    expect(website).toBeDefined();
    expect(website?.url).toBe(TEST_SITE_URL);
    expect(website?.inLanguage).toBe("en-IN");
    expect(website?.publisher).toEqual({ "@id": `${TEST_SITE_URL}#organization` });

    const store = globalGraph["@graph"].find((item) => item["@type"] === "FurnitureStore");
    expect(store).toBeDefined();
    if (!store || store["@type"] !== "FurnitureStore" || !store.address || !store.geo) {
      throw new Error("FurnitureStore entity missing or incomplete");
    }
    expect(store.address["@type"]).toBe("PostalAddress");
    expect(store.address.addressCountry).toBe("IN");
    expect(store.geo["@type"]).toBe("GeoCoordinates");
    expect(typeof store.geo.latitude).toBe("number");
    expect(typeof store.geo.longitude).toBe("number");
  });

  it("buildProductJsonLd produces schema-compliant Product with absolute image & brand", () => {
    const productData = buildProductJsonLd(TEST_SITE_URL, {
      name: "Apex Ergonomic Task Chair",
      description: "High-performance mesh task chair with dynamic lumbar support.",
      url: `${TEST_SITE_URL}/products/seating/apex-chair/`,
      image: "/assets/catalog/seating/apex-chair.webp",
      sku: "OFL-ST-APX-01",
      category: "Seating",
    });

    expect(productData["@context"]).toBe("https://schema.org");
    expect(productData["@type"]).toBe("Product");
    expect(productData["@id"]).toBe(`${TEST_SITE_URL}/products/seating/apex-chair#product`);
    expect(productData.name).toBe("Apex Ergonomic Task Chair");
    expect(productData.sku).toBe("OFL-ST-APX-01");
    expect(productData.brand).toEqual({
      "@type": "Brand",
      name: SITE_BRAND.companyName,
    });
    expect(productData.image).toBe(`${TEST_SITE_URL}/assets/catalog/seating/apex-chair.webp`);
    expect(productData.category).toBe("Seating");
  });

  it("buildBreadcrumbJsonLd produces sequential 1-indexed ListItem chain", () => {
    const breadcrumbs = buildBreadcrumbJsonLd(TEST_SITE_URL, [
      { name: "Home", path: "/" },
      { name: "Products", path: "/products" },
      { name: "Workstations", path: "/products/workstations" },
    ]);

    expect(breadcrumbs["@context"]).toBe("https://schema.org");
    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbs.itemListElement).toHaveLength(3);

    expect(breadcrumbs.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${TEST_SITE_URL}/`,
    });
    expect(breadcrumbs.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "Products",
      item: `${TEST_SITE_URL}/products/`,
    });
    expect(breadcrumbs.itemListElement[2]).toEqual({
      "@type": "ListItem",
      position: 3,
      name: "Workstations",
      item: `${TEST_SITE_URL}/products/workstations/`,
    });
  });

  it("buildCareerJobsJsonLd produces valid JobPosting with real datePosted and telecommute location", () => {
    const jobsData = buildCareerJobsJsonLd(TEST_SITE_URL, [
      {
        title: "Senior Workspace Design Consultant",
        department: "Design & Planning",
        location: "Bengaluru, India",
        postedDate: "2026-08-01",
      },
    ]);

    expect(jobsData["@context"]).toBe("https://schema.org");
    expect(Array.isArray(jobsData["@graph"])).toBe(true);
    const job = jobsData["@graph"][0];
    expect(job["@type"]).toBe("JobPosting");
    expect(job.title).toBe("Senior Workspace Design Consultant");
    expect(job.datePosted).toBe("2026-08-01");
    expect(job.employmentType).toBe("FULL_TIME");
    expect(job.jobLocationType).toBe("TELECOMMUTE");
    expect(job.applicantLocationRequirements).toEqual({
      "@type": "Country",
      name: "India",
    });
    expect(job.hiringOrganization["@type"]).toBe("Organization");
  });

  it("buildFaqJsonLd produces valid FAQPage schema for commercial category hubs", () => {
    const faqSchema = buildFaqJsonLd(TEST_SITE_URL, "/products/workstations", [
      {
        question: "Are One&Only workstations BIFMA certified?",
        answer: "Yes, our workstations meet BIFMA X5.5 commercial performance standards.",
      },
    ]);

    expect(faqSchema["@context"]).toBe("https://schema.org");
    expect(faqSchema["@type"]).toBe("FAQPage");
    expect(faqSchema["@id"]).toBe(`${TEST_SITE_URL}/products/workstations/#faq`);
    expect(faqSchema.mainEntity).toHaveLength(1);
    expect(faqSchema.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Are One&Only workstations BIFMA certified?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, our workstations meet BIFMA X5.5 commercial performance standards.",
      },
    });
  });
});

describe("SEO Standards Audit: Canonical & Trailing Slash Integrity", () => {
  it("canonicalPath strictly preserves root '/' and appends trailing slash to subpages", () => {
    expect(canonicalPath("/")).toBe("/");
    expect(canonicalPath("")).toBe("/");
    expect(canonicalPath("/products")).toBe("/products/");
    expect(canonicalPath("/products/")).toBe("/products/");
    expect(canonicalPath("/solutions/workstations")).toBe("/solutions/workstations/");
  });

  it("sanitizeCanonicalPath neutralizes open-redirects, backslashes, and protocol tricks", () => {
    expect(sanitizeCanonicalPath("//evil.com")).toBe("/");
    expect(sanitizeCanonicalPath("https://evil.com/phish")).toBe("/");
    expect(sanitizeCanonicalPath("/products\\sub")).toBe("/");
    expect(sanitizeCanonicalPath("/%2f%2fevil.com")).toBe("/");
    expect(sanitizeCanonicalPath("/products/workstations?sort=asc")).toBe("/products/workstations/");
    expect(sanitizeCanonicalPath("/about#team")).toBe("/about/");
  });

  it("buildCanonicalUrl always resolves against the canonical apex origin with trailing slash", () => {
    const canonical = buildCanonicalUrl(TEST_SITE_URL, "/solutions/executive");
    expect(canonical).toBe("https://oando.co.in/solutions/executive/");
    expect(canonical).not.toContain("localhost");
    expect(canonical).not.toContain("127.0.0.1");
  });
});

describe("SEO Standards Audit: Title, Description & Social Cards Quality", () => {
  it("resolveDocumentTitle prevents repeated brand suffixes and maintains single branding", () => {
    expect(resolveDocumentTitle("Executive Desks")).toBe(`Executive Desks | ${SITE_BRAND.titleSuffix}`);
    expect(resolveDocumentTitle(`Executive Desks | ${SITE_BRAND.titleSuffix}`)).toBe(
      `Executive Desks | ${SITE_BRAND.titleSuffix}`,
    );
    expect(
      resolveDocumentTitle(`Executive Desks | ${SITE_BRAND.titleSuffix} | ${SITE_BRAND.titleSuffix}`),
    ).toBe(`Executive Desks | ${SITE_BRAND.titleSuffix}`);
    expect(countBrandPipeSegments(resolveDocumentTitle("Executive Desks"))).toBe(1);
  });

  it("buildPageMetadata sets openGraph and twitter summary_large_image cards without fabricated dimensions", () => {
    const metadata = buildPageMetadata(TEST_SITE_URL, {
      title: "Commercial Workstations",
      description: "Premium commercial office workstations and modular desk systems.",
      path: "/products/workstations",
    });

    const openGraph = metadata.openGraph as Record<string, unknown> | undefined;
    const twitter = metadata.twitter as Record<string, unknown> | undefined;

    expect(openGraph?.type).toBe("website");
    expect(openGraph?.locale).toBe("en_IN");
    expect(openGraph?.url).toBe("https://oando.co.in/products/workstations/");
    expect(twitter?.card).toBe("summary_large_image");

    const ogImages = openGraph?.images as Array<{ url: string; alt?: string; width?: number }>;
    expect(Array.isArray(ogImages)).toBe(true);
    expect(ogImages.length).toBeGreaterThan(0);
    // Explicit rule: do not fabricate width/height when assets vary
    expect(ogImages[0].width).toBeUndefined();
    expect(ogImages[0].alt).toBeDefined();
  });

  it("all static marketing pages satisfy character length bounds", () => {
    for (const entry of SEO01_STATIC_METADATA) {
      const title = metadataTitleString(entry.metadata);
      const desc = String(entry.metadata.description || "");

      expect(title.length, `Title too short for ${entry.path}`).toBeGreaterThanOrEqual(10);
      expect(title.length, `Title too long for ${entry.path}`).toBeLessThanOrEqual(80);
      expect(desc.length, `Description too short for ${entry.path}`).toBeGreaterThanOrEqual(30);
      expect(desc.length, `Description too long for ${entry.path}`).toBeLessThanOrEqual(220);
    }
  });
});

describe("SEO Standards Audit: Zero Orphan Navigation Coverage", () => {
  it("all static indexable paths are discoverable via header, footer, or HTML sitemap", () => {
    const headerHrefs = new Set(SITE_HEADER_PRIMARY_LINKS.map((link) => link.href.replace(/\/$/, "") || "/"));
    const footerHrefs = new Set(
      SITE_FOOTER_NAV.flatMap((col) => col.links).map((link) => link.href.replace(/\/$/, "") || "/"),
    );
    const htmlSitemapSections = buildSitemapSections();
    const htmlSitemapHrefs = new Set(
      htmlSitemapSections.flatMap((sec) => sec.links).map((link) => link.href.replace(/\/$/, "") || "/"),
    );

    const staticPaths = expectedStaticSitemapPaths();
    for (const path of staticPaths) {
      const normalizedPath = path.replace(/\/$/, "") || "/";
      const isDiscoverable =
        headerHrefs.has(normalizedPath) ||
        footerHrefs.has(normalizedPath) ||
        htmlSitemapHrefs.has(normalizedPath);

      expect(
        isDiscoverable,
        `Indexable path '${path}' is orphaned! It must be linked in Header, Footer, or HTML Sitemap.`,
      ).toBe(true);
    }
  });

  it("no private/admin/portal route is indexable or present in sitemap", () => {
    const sitemapPaths = expectedStaticSitemapPaths();
    for (const disallow of ROBOTS_DISALLOW_PREFIXES) {
      const prefix = disallow.replace(/\/$/, "");
      const leaked = sitemapPaths.filter((p) => p.startsWith(prefix));
      expect(leaked, `Disallowed prefix ${prefix} leaked into sitemap paths`).toEqual([]);
    }
  });
});
