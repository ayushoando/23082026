/**
 * Wave 1 — Task 2.1: Static link inventory.
 *
 * Statically extracts all link targets from site source files:
 *   - <a href="..."> and <Link href="..."> elements
 *   - router.push(...) and router.replace(...) calls
 *   - menu/nav/breadcrumb links from known data files
 *   - download links (.pdf, .xlsx, etc.)
 *   - fragment anchors (#id targets)
 *   - external URLs (protocol, opening behavior, security attributes)
 *   - tel: and mailto: links
 *
 * Internal targets are compared to the canonical route set from Wave 0.
 * External availability is recorded as an unresolved runtime claim.
 *
 * Requirements: 5.1-5.8, 20.1-20.4
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import { AUDIT_SCHEMA_VERSION } from "./schemas";

// ---------------------------------------------------------------------------
// Link target type
// ---------------------------------------------------------------------------

export type LinkTargetType =
  | "internal"
  | "external"
  | "tel"
  | "mailto"
  | "fragment"
  | "download"
  | "data"
  | "javascript"
  | "anchor-id"
  | "unknown";

export type LinkOpenBehavior = "same-tab" | "new-tab" | "unknown";

export type LinkResultClassification =
  | "conforming"
  | "nonconforming-missing-route"
  | "nonconforming-malformed"
  | "nonconforming-circular"
  | "nonconforming-external-no-rel"
  | "not-run-external-availability"
  | "not-run-runtime-required"
  | "requires-owner-decision";

export interface LinkInventoryRecord {
  readonly schemaVersion: typeof AUDIT_SCHEMA_VERSION;
  readonly recordType: "specialized-inventory";
  readonly recordId: string;
  readonly createdAt: string;
  readonly inventoryId: string;
  readonly inventoryKind: "link";
  readonly owner: string;
  readonly sourceLocator: string;
  readonly productSurface: string;
  readonly provenance: readonly {
    readonly sourceId: string;
    readonly sourceKind: string;
    readonly location: string;
    readonly discoveredAt: string;
    readonly authorityRank: number;
  }[];
  readonly applicableOccurrenceSelector: {
    readonly subjectIds: readonly string[];
    readonly stateIds: readonly string[];
    readonly viewportIds: readonly string[];
    readonly browserIds: readonly string[];
    readonly accessContextIds: readonly string[];
    readonly languageIds: readonly string[];
  };
  readonly status: "candidate" | "canonical" | "excluded" | "gapped";
  readonly payload: {
    readonly rawHref: string;
    readonly normalizedHref: string;
    readonly targetType: LinkTargetType;
    readonly visibleLabel: string;
    readonly accessibleName: string;
    readonly openBehavior: LinkOpenBehavior;
    readonly relAttributes: readonly string[];
    readonly isDownload: boolean;
    readonly downloadFileType: string | null;
    readonly fragmentId: string | null;
    readonly protocol: string | null;
    readonly isExternal: boolean;
    readonly externalOwner: string;
    readonly resultClassification: LinkResultClassification;
    readonly defectReason: string | null;
    readonly sourceKind: string;
    readonly routeMatch: string | null;
  };
  readonly coverageGapIds: readonly string[];
}

// ---------------------------------------------------------------------------
// Known canonical routes from Wave 0 (patterns only — no runtime walk)
// ---------------------------------------------------------------------------

const KNOWN_ROUTE_PATTERNS = new Set([
  "/",
  "/products",
  "/products/[category]",
  "/products/[category]/[product]",
  "/products/category/[slug]",
  "/solutions",
  "/solutions/[category]",
  "/planning",
  "/planner",
  "/planner/help",
  "/planner/features",
  "/planner/features/[slug]",
  "/contact",
  "/about",
  "/downloads",
  "/career",
  "/compare",
  "/trusted-by",
  "/showrooms",
  "/service",
  "/sitemap",
  "/sustainability",
  "/clients",
  "/choose-product",
  "/privacy",
  "/terms",
  "/refund-and-return-policy",
  "/quote-cart",
  "/access",
  "/portal",
  "/portal/[id]",
  "/portal/guest",
  "/portal/guest/view/[id]",
  "/dashboard",
  "/login",
  "/tools/meeting-room-capacity-calculator",
  "/tools/office-space-calculator",
  "/offline",
  "/admin",
  "/admin/catalog",
  "/admin/inventory",
  "/admin/analytics",
  "/admin/customer-queries",
  "/admin/features",
  "/admin/themes",
  "/admin/settings",
  "/admin/plans",
  "/admin/plans/[id]",
  "/admin/crm",
  "/admin/crm/clients",
  "/admin/crm/projects",
  "/admin/crm/projects/[id]",
  "/admin/crm/quotes",
  "/admin/price-books",
  "/admin/design-kit",
  "/admin/planner-catalog",
  "/admin/workspace-catalog",
  "/ooplanner",
  "/ooplanner/projects",
  "/ooplanner/projects/[id]",
  "/oostudio",
  // Redirect-only routes
  "/brochure",
  "/download-brochure",
  "/catalog",
  "/news",
  "/gallery",
  "/projects",
  "/portfolio",
  "/social",
  "/imprint",
  "/support-ivr",
  "/tracking",
  "/templates",
  "/oando-planner",
  "/buddy-planner",
  "/crm",
  "/ops",
  "/results",
]);

const _DYNAMIC_ROUTE_PARAMS_PATTERN = /\/\[[^\]]+\]/g;

/** Check if a normalized path matches any known route or dynamic route pattern */
function matchesKnownRoute(normalizedPath: string): string | null {
  // Strip trailing slash for comparison
  const p = normalizedPath.endsWith("/") && normalizedPath.length > 1
    ? normalizedPath.slice(0, -1)
    : normalizedPath;

  // Direct match
  if (KNOWN_ROUTE_PATTERNS.has(p)) return p;

  // Check dynamic patterns — try replacing segments that look like IDs
  for (const pattern of KNOWN_ROUTE_PATTERNS) {
    if (!pattern.includes("[")) continue;
    const segments = pattern.split("/");
    const pathSegments = p.split("/");
    if (segments.length !== pathSegments.length) continue;
    const matches = segments.every((seg, i) => {
      if (seg.startsWith("[") && seg.endsWith("]")) return true;
      return seg === pathSegments[i];
    });
    if (matches) return pattern;
  }
  return null;
}

// ---------------------------------------------------------------------------
// URL normalization (mirrors discovery.ts normalizeUrl)
// ---------------------------------------------------------------------------

export function normalizeInternalHref(raw: string): string {
  if (!raw || raw.startsWith("http") || raw.startsWith("tel:") || raw.startsWith("mailto:")) {
    return raw;
  }
  let url = raw.trim();
  // Collapse duplicate slashes
  url = url.replace(/\/{2,}/g, "/");
  // Split path from query/fragment
  const hashIndex = url.indexOf("#");
  const fragment = hashIndex >= 0 ? url.slice(hashIndex) : "";
  const pathAndQuery = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const queryIndex = pathAndQuery.indexOf("?");
  const pathPart = queryIndex >= 0 ? pathAndQuery.slice(0, queryIndex) : pathAndQuery;
  const queryPart = queryIndex >= 0 ? pathAndQuery.slice(queryIndex + 1) : "";

  let normalizedPath = pathPart.toLowerCase();
  if (!normalizedPath.startsWith("/")) normalizedPath = `/${normalizedPath}`;

  let normalizedQuery = "";
  if (queryPart) {
    const params = queryPart.split("&").filter(Boolean).sort();
    normalizedQuery = `?${params.join("&")}`;
  }
  return `${normalizedPath}${normalizedQuery}${fragment}`;
}

// ---------------------------------------------------------------------------
// Static link extraction from source text
// ---------------------------------------------------------------------------

function sha256Short(...parts: string[]): string {
  return createHash("sha256").update(parts.join("\0")).digest("hex").slice(0, 16);
}

function stableInventoryId(sourceLocator: string, rawHref: string): string {
  return `inv.link.${sha256Short(sourceLocator, rawHref)}`;
}

function detectTargetType(href: string): LinkTargetType {
  if (!href || href.trim() === "") return "unknown";
  if (href.startsWith("tel:")) return "tel";
  if (href.startsWith("mailto:")) return "mailto";
  if (href.startsWith("data:")) return "data";
  if (href.startsWith("javascript:")) return "javascript";
  if (href.startsWith("#")) return "fragment";
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
    return "external";
  }
  // Check for download extensions
  const ext = href.split("?")[0].split(".").pop()?.toLowerCase();
  const downloadExtensions = new Set(["pdf", "xlsx", "xls", "csv", "docx", "doc", "zip", "png", "jpg", "jpeg", "webp", "svg"]);
  if (ext && downloadExtensions.has(ext) && (href.startsWith("/") || href.startsWith("."))) {
    return "download";
  }
  if (href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
    return "internal";
  }
  return "unknown";
}

function detectDownloadFileType(href: string): string | null {
  const ext = href.split("?")[0].split(".").pop()?.toLowerCase();
  const downloadExtensions = new Set(["pdf", "xlsx", "xls", "csv", "docx", "doc", "zip"]);
  return (ext && downloadExtensions.has(ext)) ? ext : null;
}

function classifyLinkResult(
  href: string,
  targetType: LinkTargetType,
  openBehavior: LinkOpenBehavior,
  relAttributes: readonly string[],
): { classification: LinkResultClassification; defectReason: string | null; routeMatch: string | null } {
  if (targetType === "external") {
    // External links without rel="noopener noreferrer" when opening in new tab
    if (openBehavior === "new-tab" && !relAttributes.includes("noopener")) {
      return {
        classification: "nonconforming-external-no-rel",
        defectReason: "External link opens in new tab without rel='noopener noreferrer'.",
        routeMatch: null,
      };
    }
    // External availability is a runtime claim
    return { classification: "not-run-external-availability", defectReason: null, routeMatch: null };
  }

  if (targetType === "tel" || targetType === "mailto") {
    return { classification: "not-run-runtime-required", defectReason: null, routeMatch: null };
  }

  if (targetType === "fragment") {
    return { classification: "not-run-runtime-required", defectReason: null, routeMatch: null };
  }

  if (targetType === "download") {
    return { classification: "conforming", defectReason: null, routeMatch: null };
  }

  if (targetType === "javascript" || targetType === "data") {
    return {
      classification: "nonconforming-malformed",
      defectReason: `Link uses unsafe href scheme: ${targetType}`,
      routeMatch: null,
    };
  }

  if (targetType === "unknown" || !href) {
    return {
      classification: "nonconforming-malformed",
      defectReason: `Link has empty or unrecognized href: "${href}"`,
      routeMatch: null,
    };
  }

  if (targetType === "internal") {
    // Strip query/fragment for route matching
    const pathOnly = href.split("?")[0].split("#")[0];
    const normalized = normalizeInternalHref(pathOnly);
    const strippedPath = normalized.endsWith("/") && normalized.length > 1
      ? normalized.slice(0, -1)
      : normalized;

    const routeMatch = matchesKnownRoute(strippedPath);
    if (!routeMatch) {
      return {
        classification: "nonconforming-missing-route",
        defectReason: `Internal link target "${href}" does not match any known route pattern.`,
        routeMatch: null,
      };
    }
    // Circular: href resolves to the same page — allowed but noted
    return { classification: "conforming", defectReason: null, routeMatch };
  }

  return { classification: "conforming", defectReason: null, routeMatch: null };
}

// ---------------------------------------------------------------------------
// Surface classification (mirrors discovery.ts)
// ---------------------------------------------------------------------------

function classifySurface(filePath: string): string {
  if (filePath.includes("/offline/") || filePath.includes("\\offline\\")) return "offline";
  if (filePath.includes("/oostudio/") || filePath.includes("\\oostudio\\")) return "studio";
  if (filePath.includes("/ooplanner/") || filePath.includes("\\ooplanner\\")) return "planner";
  if (filePath.includes("/admin/") || filePath.includes("\\admin\\")) return "administration";
  if (filePath.includes("/access/") || filePath.includes("\\access\\")) return "authentication";
  if (filePath.includes("/portal/") || filePath.includes("\\portal\\") ||
    filePath.includes("/dashboard/") || filePath.includes("\\dashboard\\")) return "portal-dashboard";
  if (filePath.includes("components/site") || filePath.includes("features/site")) return "shared-shell";
  return "marketing";
}

// ---------------------------------------------------------------------------
// Static source scanner
// ---------------------------------------------------------------------------

interface RawLinkExtraction {
  readonly rawHref: string;
  readonly visibleLabel: string;
  readonly openBehavior: LinkOpenBehavior;
  readonly relAttributes: readonly string[];
  readonly isDownload: boolean;
  readonly sourceKind: string;
  readonly line: number;
}

/** Extract link hrefs from TSX source using patterns. NOT a full AST parser. */
function extractLinksFromSource(source: string): RawLinkExtraction[] {
  const results: RawLinkExtraction[] = [];

  // Pattern 1: <Link href="..." or <Link href={...} (Next.js Link)
  const nextLinkPattern = /<Link\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = nextLinkPattern.exec(source)) !== null) {
    const href = m[1].trim();
    if (!href) continue;
    const snippet = m[0];
    const hasTarget = /target=["']_blank["']/.test(snippet);
    const relMatch = /rel=["']([^"']+)["']/.exec(snippet);
    const relAttrs = relMatch ? relMatch[1].split(/\s+/) : [];
    results.push({
      rawHref: href,
      visibleLabel: "",
      openBehavior: hasTarget ? "new-tab" : "same-tab",
      relAttributes: relAttrs,
      isDownload: /download/.test(snippet),
      sourceKind: "next-link",
      line: source.slice(0, m.index).split("\n").length,
    });
  }

  // Pattern 2: <a href="..." (native anchor)
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  while ((m = anchorPattern.exec(source)) !== null) {
    const href = m[1].trim();
    if (!href) continue;
    const snippet = m[0];
    const hasTarget = /target=["']_blank["']/.test(snippet);
    const relMatch = /rel=["']([^"']+)["']/.exec(snippet);
    const relAttrs = relMatch ? relMatch[1].split(/\s+/) : [];
    results.push({
      rawHref: href,
      visibleLabel: "",
      openBehavior: hasTarget ? "new-tab" : "same-tab",
      relAttributes: relAttrs,
      isDownload: /\bdownload\b/.test(snippet),
      sourceKind: "anchor",
      line: source.slice(0, m.index).split("\n").length,
    });
  }

  // Pattern 3: router.push("...") or router.replace("...")
  const routerPattern = /router\.(?:push|replace)\(\s*["']([^"']+)["']/gi;
  while ((m = routerPattern.exec(source)) !== null) {
    const href = m[1].trim();
    if (!href) continue;
    results.push({
      rawHref: href,
      visibleLabel: "",
      openBehavior: "same-tab",
      relAttributes: [],
      isDownload: false,
      sourceKind: "router-action",
      line: source.slice(0, m.index).split("\n").length,
    });
  }

  // Pattern 4: href={`/...'} template literals with simple path
  const templateHrefPattern = /href=\{`(\/[^`]*)`\}/gi;
  while ((m = templateHrefPattern.exec(source)) !== null) {
    const href = m[1].trim();
    if (!href || href.includes("${")) continue; // skip dynamic
    results.push({
      rawHref: href,
      visibleLabel: "",
      openBehavior: "same-tab",
      relAttributes: [],
      isDownload: false,
      sourceKind: "template-href",
      line: source.slice(0, m.index).split("\n").length,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Directory walker
// ---------------------------------------------------------------------------

async function collectSourceFiles(root: string, extensions = [".tsx", ".ts"]): Promise<string[]> {
  const files: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries: import("node:fs").Dirent[];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        await walk(fullPath);
      } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  await walk(root);
  return files;
}

// ---------------------------------------------------------------------------
// Known static links from navigation data (compiled from source exploration)
// ---------------------------------------------------------------------------

interface StaticNavLink {
  readonly href: string;
  readonly label: string;
  readonly sourceLocator: string;
  readonly openBehavior: LinkOpenBehavior;
  readonly relAttributes: readonly string[];
  readonly isDownload: boolean;
  readonly sourceKind: string;
}

/** All known static navigation links derived from source exploration */
export function getKnownStaticLinks(): readonly StaticNavLink[] {
  return [
    // Header primary nav
    { href: "/products", label: "Products", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/solutions", label: "Solutions", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/clients", label: "Clients", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/planner", label: "Planner", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/about", label: "About", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/contact", label: "Contact", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    // Header CTA
    { href: "/contact", label: "Get Quote", sourceLocator: "site/features/site/data/navigation.ts#SITE_CTA_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/products", label: "View Products", sourceLocator: "site/features/site/data/navigation.ts#SITE_CTA_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    // Auth link
    { href: "/access", label: "Sign in", sourceLocator: "site/features/site/data/navigation.ts#SITE_AUTH_LINK", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    // Mobile tabs
    { href: "/", label: "Home", sourceLocator: "site/features/site/data/navigation.ts#MOBILE_TABS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "mobile-tab" },
    { href: "/products", label: "Catalog", sourceLocator: "site/features/site/data/navigation.ts#MOBILE_TABS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "mobile-tab" },
    { href: "/ooplanner", label: "Planner", sourceLocator: "site/features/site/data/navigation.ts#MOBILE_TABS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "mobile-tab" },
    { href: "/about", label: "About Us", sourceLocator: "site/features/site/data/navigation.ts#MOBILE_TABS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "mobile-tab" },
    { href: "/access", label: "Account", sourceLocator: "site/features/site/data/navigation.ts#MOBILE_TABS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "mobile-tab" },
    // Mega menu featured cards
    { href: "/products/seating", label: "Ergonomic Seating", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_FEATURED_CARDS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/products/workstations", label: "Modular Workstations", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_FEATURED_CARDS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/products", label: "Need Help Choosing?", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_FEATURED_CARDS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    // Search fallback links
    { href: "/products", label: "All Products", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_SEARCH_FALLBACK_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/solutions", label: "Solutions", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_SEARCH_FALLBACK_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/clients", label: "Clients", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_SEARCH_FALLBACK_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/planner", label: "Planner", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_SEARCH_FALLBACK_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/planner/help", label: "Planner help", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_SEARCH_FALLBACK_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/trusted-by", label: "Trusted By", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_SEARCH_FALLBACK_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/sustainability", label: "Sustainability", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_SEARCH_FALLBACK_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/contact", label: "Contact", sourceLocator: "site/features/site/data/navigation.ts#SITE_NAV_SEARCH_FALLBACK_LINKS", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    // Footer nav - Products col
    { href: "/products", label: "All Products", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Products", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    { href: "/solutions", label: "Solutions", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Products", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    { href: "/clients", label: "Clients", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Products", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    { href: "/planner", label: "Planner", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Products", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    { href: "/planner/help", label: "Planner help", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Products", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    { href: "/dashboard", label: "Member dashboard", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Products", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    // Footer nav - Company col
    { href: "/about", label: "About Us", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Company", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    { href: "/trusted-by", label: "Trusted By", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Company", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    { href: "/sustainability", label: "Sustainability", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Company", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    { href: "/showrooms", label: "Showrooms", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Company", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    { href: "/career", label: "Careers", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Company", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    // Footer nav - Services col
    { href: "/contact", label: "Contact", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Services", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    { href: "/service", label: "After Sales", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Services", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    { href: "/downloads", label: "Downloads", sourceLocator: "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Services", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-nav" },
    // Footer legal links
    { href: "/refund-and-return-policy", label: "Refund Policy", sourceLocator: "site/components/site/Footer.tsx#legal", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-legal" },
    { href: "/privacy", label: "Privacy Policy", sourceLocator: "site/components/site/Footer.tsx#legal", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-legal" },
    { href: "/terms", label: "Terms", sourceLocator: "site/components/site/Footer.tsx#legal", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-legal" },
    { href: "/sitemap", label: "Sitemap", sourceLocator: "site/components/site/Footer.tsx#legal", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-legal" },
    // Footer brand/logo link
    { href: "/", label: "One&Only Home", sourceLocator: "site/components/site/Footer.tsx#brand-logo", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "footer-logo" },
    // Social links (external, new-tab)
    { href: "https://www.youtube.com/channel/UCehXuPNAXkyfODPCwyAU1gQ", label: "YouTube", sourceLocator: "site/features/site/data/contact.ts#SITE_CONTACT.socialLinks", openBehavior: "new-tab", relAttributes: ["noopener", "noreferrer"], isDownload: false, sourceKind: "social-link" },
    { href: "https://www.facebook.com/oandofurniture", label: "Facebook", sourceLocator: "site/features/site/data/contact.ts#SITE_CONTACT.socialLinks", openBehavior: "new-tab", relAttributes: ["noopener", "noreferrer"], isDownload: false, sourceKind: "social-link" },
    // Contact links
    { href: "tel:+919031022875", label: "Support Phone", sourceLocator: "site/components/site/Footer.tsx#contact-phone", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "tel-link" },
    { href: "mailto:sales@oando.co.in", label: "Sales Email", sourceLocator: "site/components/site/Footer.tsx#contact-email", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "mailto-link" },
    // Error recovery links (SiteErrorBoundary)
    { href: "/", label: "Go to Homepage", sourceLocator: "site/components/site/SiteErrorBoundary.tsx#handleGoHome", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "error-recovery" },
    // Choose-product / planner entry
    { href: "/choose-product?mode=guest", label: "Guest Planner Entry", sourceLocator: "site/features/site/data/productSuite.ts#PRODUCT_SUITE.planner.routes.guestChooser", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    { href: "/ooplanner", label: "Planner Canvas", sourceLocator: "site/features/site/data/productSuite.ts#PRODUCT_SUITE.planner.routes.canvas", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "nav-data" },
    // Footer conversion panel links
    { href: "/planning", label: "Guided Planner", sourceLocator: "site/features/site/data/contact.ts#FOOTER_CONVERSION_PANEL.actions", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "cta-link" },
    { href: "/downloads", label: "Open Resource Desk", sourceLocator: "site/features/site/data/contact.ts#FOOTER_CONVERSION_PANEL.actions", openBehavior: "same-tab", relAttributes: [], isDownload: false, sourceKind: "cta-link" },
  ];
}

// ---------------------------------------------------------------------------
// Main: build link inventory records
// ---------------------------------------------------------------------------

export interface LinkInventoryOptions {
  readonly repositoryRoot: string;
  readonly discoveredAt: string;
  readonly scanSourceFiles?: boolean;
}

export async function buildLinkInventory(
  options: LinkInventoryOptions,
): Promise<readonly LinkInventoryRecord[]> {
  const { repositoryRoot, discoveredAt } = options;
  const records: LinkInventoryRecord[] = [];
  const seenKeys = new Set<string>();

  function addLink(
    rawHref: string,
    visibleLabel: string,
    sourceLocator: string,
    openBehavior: LinkOpenBehavior,
    relAttributes: readonly string[],
    isDownload: boolean,
    sourceKind: string,
  ): void {
    const dedupeKey = `${sourceLocator}::${rawHref}`;
    if (seenKeys.has(dedupeKey)) return;
    seenKeys.add(dedupeKey);

    const normalizedHref = normalizeInternalHref(rawHref);
    const targetType = detectTargetType(rawHref);
    const fragmentId = rawHref.startsWith("#") ? rawHref.slice(1) : (rawHref.includes("#") ? rawHref.split("#")[1] : null);
    const downloadFileType = isDownload || targetType === "download" ? detectDownloadFileType(rawHref) : null;
    const protocol = (targetType === "external") ? (rawHref.startsWith("https") ? "https" : rawHref.startsWith("http") ? "http" : null) : null;
    const { classification, defectReason, routeMatch } = classifyLinkResult(rawHref, targetType, openBehavior, relAttributes);
    const fileSurface = classifySurface(sourceLocator);
    const inventoryId = stableInventoryId(sourceLocator, rawHref);

    records.push({
      schemaVersion: AUDIT_SCHEMA_VERSION,
      recordType: "specialized-inventory",
      recordId: `record.${inventoryId}`,
      createdAt: discoveredAt,
      inventoryId,
      inventoryKind: "link",
      owner: fileSurface === "shared-shell" ? "site-navigation" : fileSurface,
      sourceLocator,
      productSurface: fileSurface,
      provenance: [{
        sourceId: "source.internal-links",
        sourceKind: "internal-link",
        location: sourceLocator,
        discoveredAt,
        authorityRank: 50,
      }],
      applicableOccurrenceSelector: {
        subjectIds: [],
        stateIds: ["state.default"],
        viewportIds: [],
        browserIds: [],
        accessContextIds: [],
        languageIds: [],
      },
      status: "canonical",
      payload: {
        rawHref,
        normalizedHref,
        targetType,
        visibleLabel,
        accessibleName: visibleLabel,
        openBehavior,
        relAttributes,
        isDownload: isDownload || targetType === "download",
        downloadFileType,
        fragmentId,
        protocol,
        isExternal: targetType === "external",
        externalOwner: targetType === "external" ? "external" : "",
        resultClassification: classification,
        defectReason,
        sourceKind,
        routeMatch,
      },
      coverageGapIds: [],
    });
  }

  // Add all known static navigation links
  const staticLinks = getKnownStaticLinks();
  for (const link of staticLinks) {
    addLink(
      link.href,
      link.label,
      link.sourceLocator,
      link.openBehavior,
      link.relAttributes,
      link.isDownload,
      link.sourceKind,
    );
  }

  // Optionally scan source files for additional links
  if (options.scanSourceFiles !== false) {
    const scanRoots = [
      path.join(repositoryRoot, "site", "components", "site"),
      path.join(repositoryRoot, "site", "components", "shared"),
      path.join(repositoryRoot, "site", "app", "(site)"),
    ];

    for (const scanRoot of scanRoots) {
      let sourceFiles: string[];
      try {
        sourceFiles = await collectSourceFiles(scanRoot);
      } catch {
        continue;
      }

      for (const filePath of sourceFiles) {
        let source: string;
        try {
          source = await readFile(filePath, "utf8");
        } catch {
          continue;
        }

        const relPath = filePath.replace(repositoryRoot + path.sep, "").replaceAll("\\", "/");
        const extractions = extractLinksFromSource(source);

        for (const extraction of extractions) {
          // Skip already-known static links that came from nav data
          addLink(
            extraction.rawHref,
            extraction.visibleLabel,
            `${relPath}:${extraction.line}`,
            extraction.openBehavior,
            extraction.relAttributes,
            extraction.isDownload,
            extraction.sourceKind,
          );
        }
      }
    }
  }

  return Object.freeze(records);
}
