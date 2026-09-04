import {
  PLANNER_MARKETING_SITEMAP_PATHS,
  PUBLIC_INDEXABLE_STATIC_PATHS,
  SOLUTION_CATEGORY_IDS,
} from "@/features/site/data/routeClassification";
import { SOLUTION_CATEGORIES } from "@/features/site/data/solutionsPage";
import { getCatalogCategoryLabel } from "@/lib/catalog/site/categories";

export type SitemapLink = { href: string; label: string };

export type SitemapSection = {
  heading: string;
  links: readonly SitemapLink[];
};

export type SitemapDuplicateHref = {
  href: string;
  sections: readonly string[];
};

export type SitemapConceptualOverlap = {
  slug: string;
  productHref: string;
  solutionHref: string;
  productSection: string;
  solutionSection: string;
};

/**
 * Admin portal routes for internal tracking only — never emitted on the public
 * HTML sitemap or in the XML sitemap. The HTML sitemap is a public page; listing
 * staff-only surfaces there advertises routes that should stay undiscoverable
 * (Google's sitemap guidance: a sitemap should contain only canonical URLs you
 * want indexed). Admin routes are already `noindex` + auth-guarded; the CSV
 * export keeps them visible to ops without a public link.
 */
export const ADMIN_HTML_SITEMAP_PATHS = [
  "/admin",
  "/admin/analytics",
  "/admin/catalog",
  "/admin/crm",
  "/admin/crm/clients",
  "/admin/crm/projects",
  "/admin/crm/quotes",
  "/admin/customer-queries",
  "/admin/design-kit",
  "/admin/features",
  "/admin/inventory",
  "/admin/planner-catalog",
  "/admin/plans",
  "/admin/price-books",
  "/oostudio",
  "/oostudio/new",
  "/admin/settings",
  "/admin/themes",
  "/admin/workspace-catalog",
] as const;

const STATIC_PATH_LABELS: Record<string, string> = {
  "/": "Home",
  "/products": "All products",
  "/solutions": "Solutions overview",
  "/about": "About Us",
  "/portfolio": "Portfolio",
  "/clients": "Clients",
  "/contact": "Contact Us",
  "/service": "Service & after-sales",
  "/showrooms": "Showrooms",
  "/sustainability": "Sustainability",
  "/trusted-by": "Trusted by",
  "/career": "Careers",
  "/planning": "Planning service",
  "/tools/office-space-calculator": "Office space calculator",
  "/tools/meeting-room-capacity-calculator": "Meeting room capacity calculator",
  "/faq": "FAQ",
  "/compare": "Compare",
  "/downloads": "Resource desk",
  "/privacy": "Privacy policy",
  "/terms": "Terms",
  "/refund-and-return-policy": "Refund policy",
  "/sitemap": "This sitemap",
};

const PLANNER_PATH_LABELS: Record<string, string> = {
  "/planner": "Planner overview",
  "/planner/help": "Planner help",
  "/planner/features": "Planner features",
  "/planner/features/measure": "Measure",
  "/planner/features/catalog": "Catalog",
  "/planner/features/ai-assist": "AI assist",
  "/planner/features/export": "Export",
};

const ADMIN_PATH_LABELS: Record<string, string> = {
  "/admin": "Admin home",
  "/admin/analytics": "Analytics",
  "/admin/catalog": "Catalog",
  "/admin/crm": "CRM overview",
  "/admin/crm/clients": "CRM clients",
  "/admin/crm/projects": "CRM projects",
  "/admin/crm/quotes": "CRM quotes",
  "/admin/customer-queries": "Customer queries",
  "/admin/design-kit": "Design kit",
  "/admin/features": "Feature flags",
  "/admin/inventory": "Inventory",
  "/admin/planner-catalog": "Planner catalog",
  "/admin/plans": "Plans",
  "/admin/price-books": "Price books",
  "/oostudio": "Product studio",
  "/oostudio/new": "New product",
  "/admin/settings": "Settings",
  "/admin/themes": "Themes",
  "/admin/workspace-catalog": "Workspace catalog",
};

const COMPANY_SERVICE_PATHS = [
  "/about",
  "/portfolio",
  "/clients",
  "/contact",
  "/service",
  "/showrooms",
  "/sustainability",
  "/trusted-by",
  "/career",
  "/planning",
  "/tools/office-space-calculator",
  "/tools/meeting-room-capacity-calculator",
  "/faq",
  "/compare",
  "/downloads",
] as const;

const LEGAL_PATHS = ["/privacy", "/terms", "/refund-and-return-policy", "/sitemap"] as const;

function titleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function labelForPath(path: string): string {
  if (STATIC_PATH_LABELS[path]) {
    return STATIC_PATH_LABELS[path];
  }
  if (PLANNER_PATH_LABELS[path]) {
    return PLANNER_PATH_LABELS[path];
  }
  if (ADMIN_PATH_LABELS[path]) {
    return ADMIN_PATH_LABELS[path];
  }

  const solutionCategory = SOLUTION_CATEGORIES.find((category) => category.href === path);
  if (solutionCategory) {
    return solutionCategory.title;
  }

  const lastSegment = path.split("/").filter(Boolean).pop();
  return lastSegment ? titleCaseFromSlug(lastSegment) : path;
}

function linkForPath(path: string): SitemapLink {
  return { href: path, label: labelForPath(path) };
}

function indexableCompanyPaths(): string[] {
  return COMPANY_SERVICE_PATHS.filter((path) => PUBLIC_INDEXABLE_STATIC_PATHS.includes(path));
}

function indexableLegalPaths(): string[] {
  return LEGAL_PATHS.filter((path) => PUBLIC_INDEXABLE_STATIC_PATHS.includes(path));
}

export function getSitemapDuplicateHrefs(
  sections: readonly SitemapSection[],
): SitemapDuplicateHref[] {
  const byHref = new Map<string, string[]>();

  for (const section of sections) {
    for (const link of section.links) {
      const headings = byHref.get(link.href) ?? [];
      if (!headings.includes(section.heading)) {
        headings.push(section.heading);
      }
      byHref.set(link.href, headings);
    }
  }

  return [...byHref.entries()]
    .filter(([, headings]) => headings.length > 1)
    .map(([href, headings]) => ({ href, sections: headings }));
}

export function getSitemapConceptualOverlaps(
  sections: readonly SitemapSection[],
): SitemapConceptualOverlap[] {
  const productSection = sections.find((section) => section.heading === "Products & catalog");
  const solutionSection = sections.find((section) => section.heading === "Solutions");
  if (!productSection || !solutionSection) {
    return [];
  }

  const overlaps: SitemapConceptualOverlap[] = [];

  for (const id of SOLUTION_CATEGORY_IDS) {
    const productHref = `/products/${id}`;
    const solutionHref = `/solutions/${id}`;
    const hasProduct = productSection.links.some((link) => link.href === productHref);
    const hasSolution = solutionSection.links.some((link) => link.href === solutionHref);
    if (hasProduct && hasSolution) {
      overlaps.push({
        slug: id,
        productHref,
        solutionHref,
        productSection: productSection.heading,
        solutionSection: solutionSection.heading,
      });
    }
  }

  return overlaps;
}

export function buildSitemapSections(): SitemapSection[] {
  const productCategoryLinks: SitemapLink[] = SOLUTION_CATEGORY_IDS.map((id) => ({
    href: `/products/${id}`,
    label: getCatalogCategoryLabel(id, id),
  }));

  const productsLinks: SitemapLink[] = [
    linkForPath("/"),
    linkForPath("/products"),
    ...productCategoryLinks,
  ];

  const plannerLinks: SitemapLink[] = PLANNER_MARKETING_SITEMAP_PATHS.map((path) =>
    linkForPath(path),
  );

  const companyLinks: SitemapLink[] = indexableCompanyPaths().map((path) => linkForPath(path));

  const legalLinks: SitemapLink[] = [
    ...indexableLegalPaths().map((path) => linkForPath(path)),
    { href: "/sitemap.xml", label: "XML sitemap" },
  ];

  // Public HTML sitemap — indexable marketing/planner/product routes only.
  // Admin routes stay in ADMIN_HTML_SITEMAP_PATHS for the ops CSV export, but
  // are never linked from the public page (they are noindex + auth-guarded).
  return [
    { heading: "Products & catalog", links: productsLinks },
    { heading: "Planner", links: plannerLinks },
    { heading: "Company & service", links: companyLinks },
    { heading: "Legal & policies", links: legalLinks },
  ];
}

export function getHtmlSitemapHrefs(sections: readonly SitemapSection[]): string[] {
  return sections.flatMap((section) => section.links.map((link) => link.href));
}

export type SitemapCsvRow = {
  section: string;
  path: string;
  label: string;
  audience: "public" | "admin";
  inXmlSitemap: "yes" | "no";
  conceptualPairSlug: string;
};

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function conceptualPairSlugForPath(path: string): string {
  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (productMatch && SOLUTION_CATEGORY_IDS.includes(productMatch[1] as (typeof SOLUTION_CATEGORY_IDS)[number])) {
    return productMatch[1];
  }
  const solutionMatch = path.match(/^\/solutions\/([^/]+)$/);
  if (solutionMatch && SOLUTION_CATEGORY_IDS.includes(solutionMatch[1] as (typeof SOLUTION_CATEGORY_IDS)[number])) {
    return solutionMatch[1];
  }
  return "";
}

export function buildSitemapCsvRows(sections?: readonly SitemapSection[]): SitemapCsvRow[] {
  const resolvedSections = sections ?? buildSitemapSections();

  const publicRows: SitemapCsvRow[] = resolvedSections.flatMap((section) =>
    section.links.map((link) => ({
      section: section.heading,
      path: link.href,
      label: link.label,
      audience: "public" as const,
      inXmlSitemap: link.href === "/sitemap.xml" ? "no" as const : "yes" as const,
      conceptualPairSlug: conceptualPairSlugForPath(link.href),
    })),
  );

  // Admin routes are tracked in the ops CSV only — never linked from the
  // public HTML sitemap (they are noindex + auth-guarded).
  const adminRows: SitemapCsvRow[] = ADMIN_HTML_SITEMAP_PATHS.map((path) => ({
    section: "Admin",
    path,
    label: ADMIN_PATH_LABELS[path] ?? labelForPath(path),
    audience: "admin",
    inXmlSitemap: "no",
    conceptualPairSlug: conceptualPairSlugForPath(path),
  }));

  return [...publicRows, ...adminRows];
}

export function buildSitemapCsv(sections?: readonly SitemapSection[]): string {
  const header = [
    "section",
    "path",
    "label",
    "audience",
    "in_xml_sitemap",
    "conceptual_pair_slug",
  ];
  const rows = buildSitemapCsvRows(sections).map((row) =>
    [
      row.section,
      row.path,
      row.label,
      row.audience,
      row.inXmlSitemap,
      row.conceptualPairSlug,
    ].map(csvEscape).join(","),
  );

  return `${header.join(",")}\n${rows.join("\n")}\n`;
}
