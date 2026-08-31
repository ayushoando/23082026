/**
 * Task 1.4 — Canonical route, shell, and dynamic-instance discovery.
 *
 * Walks the live App Router tree under `site/app/` to collect every static and
 * dynamic page, layout, template, loading/error/not-found boundary, visible
 * provider, consent/offline shell, and redirect-only route. Dynamic instances
 * are resolved by provenance-preserving union across static generation
 * declarations, repository data constants, route contracts, internal links,
 * sitemap candidates, and prior generated inventories — never by inventing
 * placeholder instances.
 *
 * This module is audit tooling only. It reads but never modifies `site/**`.
 */

import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import path from "node:path";

import {
  AUDIT_SCHEMA_VERSION,
  type ProvenanceReference,
} from "./schemas";
import {
  AUDIT_SOURCE_IDS,
  SOURCE_AUTHORITY_RANKS,
} from "./adapters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProductSurface =
  | "marketing"
  | "catalog-configurator"
  | "portal-dashboard"
  | "authentication"
  | "legal"
  | "administration"
  | "planner"
  | "studio"
  | "offline"
  | "shared-shell";

export type RouteKind = "static" | "dynamic" | "dynamic-instance";

export type RouteStatus =
  | "active"
  | "redirected"
  | "absent"
  | "legacy"
  | "local-only"
  | "protected"
  | "unreachable";

export type ShellRole =
  | "layout"
  | "header"
  | "footer"
  | "banner"
  | "dialog"
  | "consent"
  | "error-boundary"
  | "loading-boundary"
  | "not-found-boundary"
  | "provider-output"
  | "offline-shell";

export interface DiscoveredRoute {
  readonly routeId: string;
  readonly pattern: string;
  readonly concreteUrl?: string;
  readonly routeKind: RouteKind;
  readonly productSurface: ProductSurface;
  readonly status: RouteStatus;
  readonly sourcePath: string;
  readonly provenance: readonly ProvenanceReference[];
  readonly conflictIds: readonly string[];
  readonly exclusionId?: string;
  readonly coverageGapIds: readonly string[];
}

export interface DiscoveredDynamicInstance {
  readonly instanceId: string;
  readonly routeId: string;
  readonly concreteUrl: string;
  readonly normalizedUrl: string;
  readonly parameterValues: Readonly<Record<string, string>>;
  readonly discoverySources: readonly ProvenanceReference[];
  readonly discoveredAt: string;
  readonly productSurface: ProductSurface;
  readonly status: "active" | "protected" | "unreachable" | "gapped";
  readonly coverageGapIds: readonly string[];
}

export interface DiscoveredShell {
  readonly shellId: string;
  readonly role: ShellRole;
  readonly productSurface: ProductSurface;
  readonly sourcePath: string;
  readonly visibleOutput: true;
  readonly routeIds: readonly string[];
  readonly provenance: readonly ProvenanceReference[];
  readonly status: "active" | "legacy" | "local-only" | "unreachable";
}

export interface DiscoveryConflict {
  readonly conflictId: string;
  readonly subjectKey: string;
  readonly claimField: string;
  readonly claims: readonly {
    readonly sourceId: string;
    readonly authorityRank: number;
    readonly value: string;
  }[];
  readonly resolution: "higher-authority-selected" | "requires-owner-decision";
  readonly selectedSourceId?: string;
}

export interface DiscoveryCoverageGap {
  readonly gapId: string;
  readonly routeId: string;
  readonly parameterDomain: string;
  readonly reason: string;
  readonly proposedResolution: string;
}

export interface DiscoveryExclusion {
  readonly exclusionId: string;
  readonly routeId: string;
  readonly reason: string;
  readonly reconsiderationTrigger: string;
}

export interface CanonicalDiscoveryResult {
  readonly routes: readonly DiscoveredRoute[];
  readonly dynamicInstances: readonly DiscoveredDynamicInstance[];
  readonly shells: readonly DiscoveredShell[];
  readonly conflicts: readonly DiscoveryConflict[];
  readonly coverageGaps: readonly DiscoveryCoverageGap[];
  readonly exclusions: readonly DiscoveryExclusion[];
  readonly discoveredAt: string;
}

// ---------------------------------------------------------------------------
// URL normalization
// ---------------------------------------------------------------------------

/**
 * Deterministic URL normalization:
 * - remove duplicate slashes
 * - lowercase path segments
 * - apply trailing-slash policy (always add trailing slash)
 * - sort semantically unordered query params
 * - normalize percent encoding
 */
export function normalizeUrl(raw: string): string {
  let url = raw.trim();
  // strip protocol/host for internal comparison
  url = url.replace(/^https?:\/\/[^/]+/, "");
  // collapse duplicate slashes
  url = url.replace(/\/{2,}/g, "/");
  // split path from query/fragment
  const hashIndex = url.indexOf("#");
  const fragment = hashIndex >= 0 ? url.slice(hashIndex) : "";
  const pathAndQuery = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const queryIndex = pathAndQuery.indexOf("?");
  const pathPart = queryIndex >= 0 ? pathAndQuery.slice(0, queryIndex) : pathAndQuery;
  const queryPart = queryIndex >= 0 ? pathAndQuery.slice(queryIndex + 1) : "";

  // normalize path: lowercase, ensure leading slash, trailing slash
  let normalizedPath = pathPart.toLowerCase();
  if (!normalizedPath.startsWith("/")) normalizedPath = `/${normalizedPath}`;
  if (!normalizedPath.endsWith("/") && !normalizedPath.includes(".")) {
    normalizedPath = `${normalizedPath}/`;
  }

  // sort query params
  let normalizedQuery = "";
  if (queryPart) {
    const params = queryPart.split("&").filter(Boolean).sort();
    normalizedQuery = `?${params.join("&")}`;
  }

  return `${normalizedPath}${normalizedQuery}${fragment}`;
}

// ---------------------------------------------------------------------------
// Surface classification
// ---------------------------------------------------------------------------

function classifySurface(routePattern: string, sourcePath: string): ProductSurface {
  if (sourcePath.includes("/offline/") || routePattern === "/offline") return "offline";
  if (sourcePath.includes("/oostudio/") || routePattern.startsWith("/oostudio")) return "studio";
  if (sourcePath.includes("/ooplanner/") || routePattern.startsWith("/ooplanner")) return "planner";
  if (
    sourcePath.includes("/admin/") ||
    routePattern.startsWith("/admin")
  ) return "administration";
  if (
    routePattern === "/access" ||
    routePattern === "/login" ||
    sourcePath.includes("/access/") ||
    sourcePath.includes("/login/")
  ) return "authentication";
  if (
    routePattern.startsWith("/portal") ||
    routePattern.startsWith("/dashboard")
  ) return "portal-dashboard";
  if (
    routePattern === "/privacy" ||
    routePattern === "/terms" ||
    routePattern === "/refund-and-return-policy" ||
    routePattern === "/imprint"
  ) return "legal";
  if (
    routePattern.startsWith("/products/") ||
    routePattern === "/products" ||
    routePattern === "/compare" ||
    routePattern === "/choose-product" ||
    routePattern === "/quote-cart"
  ) return "catalog-configurator";
  return "marketing";
}

function classifyRouteStatus(
  routePattern: string,
  routeContractClassification?: string,
): RouteStatus {
  if (routeContractClassification === "redirect") return "redirected";
  if (routeContractClassification === "removed") return "absent";
  if (routeContractClassification === "not-found") return "active";
  if (routeContractClassification === "protected") return "protected";

  // Infer from common patterns
  if (
    routePattern.startsWith("/portal") ||
    routePattern.startsWith("/dashboard") ||
    routePattern.startsWith("/admin")
  ) return "protected";

  return "active";
}

// ---------------------------------------------------------------------------
// Provenance helpers
// ---------------------------------------------------------------------------

function makeProvenance(
  sourceId: string,
  sourceKind: ProvenanceReference["sourceKind"],
  location: string,
  discoveredAt: string,
  authorityRank: number,
): ProvenanceReference {
  return {
    sourceId,
    sourceKind,
    location,
    discoveredAt,
    authorityRank,
  };
}

function routeTreeProvenance(location: string, discoveredAt: string): ProvenanceReference {
  return makeProvenance(
    AUDIT_SOURCE_IDS.appRouterTree,
    "source",
    location,
    discoveredAt,
    SOURCE_AUTHORITY_RANKS.appRouterTree,
  );
}

function contractProvenance(location: string, discoveredAt: string): ProvenanceReference {
  return makeProvenance(
    AUDIT_SOURCE_IDS.routeContracts,
    "contract",
    location,
    discoveredAt,
    SOURCE_AUTHORITY_RANKS.routeContracts,
  );
}

function staticGenProvenance(location: string, discoveredAt: string): ProvenanceReference {
  return makeProvenance(
    AUDIT_SOURCE_IDS.staticGenerationDeclarations,
    "source",
    location,
    discoveredAt,
    SOURCE_AUTHORITY_RANKS.staticGenerationDeclarations,
  );
}

function repoDataProvenance(location: string, discoveredAt: string): ProvenanceReference {
  return makeProvenance(
    AUDIT_SOURCE_IDS.repositoryDataReadPaths,
    "repository-data",
    location,
    discoveredAt,
    SOURCE_AUTHORITY_RANKS.repositoryDataReadPaths,
  );
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function stableId(prefix: string, ...parts: string[]): string {
  const hash = createHash("sha256").update(parts.join("\0")).digest("hex").slice(0, 12);
  return `${prefix}.${hash}`;
}

function routeId(pattern: string): string {
  return `route.${pattern.replace(/^\//, "").replace(/\//g, ".").replace(/\[([^\]]+)\]/g, "_$1_") || "root"}`;
}

function shellId(sourcePath: string, role: ShellRole): string {
  return stableId("shell", sourcePath, role);
}

function instanceId(routeIdStr: string, normalizedUrl: string): string {
  return stableId("instance", routeIdStr, normalizedUrl);
}

// ---------------------------------------------------------------------------
// App Router filesystem walker
// ---------------------------------------------------------------------------

/** Special App Router filenames that represent user-visible entry points or shells. */
const PAGE_FILE = "page.tsx";
const LAYOUT_FILE = "layout.tsx";
const TEMPLATE_FILE = "template.tsx";
const LOADING_FILE = "loading.tsx";
const ERROR_FILE = "error.tsx";
const NOT_FOUND_FILE = "not-found.tsx";
const GLOBAL_ERROR_FILE = "global-error.tsx";

const SHELL_FILES: ReadonlyMap<string, ShellRole> = new Map([
  [LAYOUT_FILE, "layout"],
  [LOADING_FILE, "loading-boundary"],
  [ERROR_FILE, "error-boundary"],
  [NOT_FOUND_FILE, "not-found-boundary"],
  [GLOBAL_ERROR_FILE, "error-boundary"],
]);

interface WalkerEntry {
  relativePath: string;
  urlPattern: string;
  fileName: string;
  isDynamic: boolean;
  dynamicSegments: string[];
}

/**
 * Convert a filesystem path under `site/app/` to a URL pattern.
 * Route groups `(groupName)` are stripped from the URL but retained in provenance.
 */
function fsPathToUrlPattern(relativePath: string): string {
  const segments = relativePath
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);

  // Remove the filename
  segments.pop();

  const urlSegments: string[] = [];
  for (const seg of segments) {
    // Skip route groups
    if (seg.startsWith("(") && seg.endsWith(")")) continue;
    urlSegments.push(seg);
  }

  return `/${urlSegments.join("/")}` || "/";
}

function extractDynamicSegments(urlPattern: string): string[] {
  return urlPattern
    .split("/")
    .filter((seg) => seg.startsWith("[") && seg.endsWith("]"))
    .map((seg) => seg.slice(1, -1));
}

async function walkAppRouter(
  appDir: string,
  baseDir: string = "",
): Promise<WalkerEntry[]> {
  const entries: WalkerEntry[] = [];
  const fullPath = path.join(appDir, baseDir);

  let dirEntries: import("node:fs").Dirent[];
  try {
    dirEntries = await readdir(fullPath, { withFileTypes: true });
  } catch {
    return entries;
  }

  for (const entry of dirEntries) {
    const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      // Skip non-route directories
      if (entry.name === "node_modules" || entry.name.startsWith("_")) continue;
      const subEntries = await walkAppRouter(appDir, relativePath);
      entries.push(...subEntries);
    } else if (entry.isFile()) {
      const fileName = entry.name;
      // Only process known App Router files
      if (
        fileName !== PAGE_FILE &&
        !SHELL_FILES.has(fileName) &&
        fileName !== TEMPLATE_FILE
      ) continue;

      const urlPattern = fsPathToUrlPattern(relativePath);
      const dynamicSegments = extractDynamicSegments(urlPattern);

      entries.push({
        relativePath,
        urlPattern,
        fileName,
        isDynamic: dynamicSegments.length > 0,
        dynamicSegments,
      });
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Route contract data (embedded from routeClassification.ts)
// ---------------------------------------------------------------------------

interface RouteContractEntry {
  readonly route: string;
  readonly classification: string;
  readonly audience: string;
  readonly intent: string;
  readonly owner: string;
  readonly indexable: boolean;
  readonly notes?: string;
}

/**
 * Source-derived route contract data. This is read statically from the
 * routeClassification.ts source declarations (authority rank 40) without
 * executing any product code.
 */
const ROUTE_CONTRACT_ENTRIES: readonly RouteContractEntry[] = [
  { route: "/", classification: "public", audience: "Public visitor", intent: "Brand entry", owner: "Marketing", indexable: true },
  { route: "/products", classification: "public", audience: "Public visitor / buyer", intent: "Browse catalog", owner: "Site", indexable: true },
  { route: "/products/[category]", classification: "public", audience: "Public visitor / buyer", intent: "Category listing", owner: "Site", indexable: true },
  { route: "/products/[category]/[product]", classification: "public", audience: "Public visitor / buyer", intent: "Product detail", owner: "Site", indexable: true },
  { route: "/products/category/[slug]", classification: "redirect", audience: "Public visitor / buyer", intent: "Legacy category alias", owner: "Site", indexable: false, notes: "Redirect to /products/[category]" },
  { route: "/solutions", classification: "public", audience: "Public visitor / buyer", intent: "Solution sets", owner: "Marketing", indexable: true },
  { route: "/solutions/[category]", classification: "public", audience: "Public visitor / buyer", intent: "Solution detail", owner: "Marketing", indexable: true },
  { route: "/planning", classification: "public", audience: "Public visitor / buyer", intent: "Workspace planning", owner: "Marketing", indexable: true },
  { route: "/planner", classification: "public", audience: "Public visitor / buyer", intent: "Planner marketing landing", owner: "Marketing", indexable: true },
  { route: "/planner/help", classification: "public", audience: "Public visitor / buyer", intent: "Planner help", owner: "Marketing", indexable: true },
  { route: "/planner/features", classification: "public", audience: "Public visitor / buyer", intent: "Planner features hub", owner: "Marketing", indexable: true },
  { route: "/planner/features/[slug]", classification: "public", audience: "Public visitor / buyer", intent: "Feature detail", owner: "Marketing", indexable: true },
  { route: "/contact", classification: "public", audience: "Public visitor / buyer", intent: "Enquiry capture", owner: "Marketing", indexable: true },
  { route: "/about", classification: "public", audience: "Public visitor", intent: "Company story", owner: "Marketing", indexable: true },
  { route: "/downloads", classification: "public", audience: "Public visitor / buyer", intent: "Resource desk", owner: "Marketing", indexable: true },
  { route: "/career", classification: "public", audience: "Public candidate", intent: "Open roles", owner: "Marketing", indexable: true },
  { route: "/compare", classification: "public", audience: "Public visitor / buyer", intent: "Product comparison", owner: "Site", indexable: true },
  { route: "/trusted-by", classification: "public", audience: "Public visitor / buyer", intent: "Client proof", owner: "Marketing", indexable: true },
  { route: "/showrooms", classification: "public", audience: "Public visitor / buyer", intent: "Showroom locations", owner: "Marketing", indexable: true },
  { route: "/service", classification: "public", audience: "Public visitor / buyer", intent: "After-sales support", owner: "Marketing", indexable: true },
  { route: "/sitemap", classification: "public", audience: "Public visitor", intent: "HTML sitemap", owner: "Site", indexable: true },
  { route: "/sustainability", classification: "public", audience: "Public visitor / buyer", intent: "Sustainability", owner: "Marketing", indexable: true },
  { route: "/clients", classification: "public", audience: "Public visitor / buyer", intent: "Client portfolio", owner: "Marketing", indexable: true },
  { route: "/choose-product", classification: "public", audience: "Public visitor / buyer", intent: "Guided product selection", owner: "Site", indexable: false },
  { route: "/privacy", classification: "public", audience: "Public visitor", intent: "Privacy policy", owner: "Ops", indexable: true },
  { route: "/terms", classification: "public", audience: "Public visitor", intent: "Terms of use", owner: "Ops", indexable: true },
  { route: "/refund-and-return-policy", classification: "public", audience: "Public visitor / buyer", intent: "Refund policy", owner: "Ops", indexable: true },
  { route: "/quote-cart", classification: "public", audience: "Public visitor / buyer", intent: "Quote cart", owner: "Site", indexable: false },
  { route: "/access", classification: "public", audience: "Public / returning customer", intent: "Auth gate", owner: "Site", indexable: false },
  { route: "/portal", classification: "protected", audience: "Authenticated customer", intent: "Customer portal", owner: "Site", indexable: false },
  { route: "/portal/[id]", classification: "protected", audience: "Authenticated customer", intent: "Project workspace", owner: "Site", indexable: false },
  { route: "/portal/guest", classification: "protected", audience: "Guest session", intent: "Guest portal entry", owner: "Site", indexable: false },
  { route: "/portal/guest/view/[id]", classification: "protected", audience: "Guest session", intent: "Guest shared plan view", owner: "Site", indexable: false },
  { route: "/dashboard", classification: "protected", audience: "Authenticated customer", intent: "Customer dashboard", owner: "Site", indexable: false },
  { route: "/login", classification: "redirect", audience: "Public / returning customer", intent: "Legacy auth alias → /access", owner: "Site", indexable: false },
  { route: "/tools/meeting-room-capacity-calculator", classification: "public", audience: "Public visitor", intent: "Calculator tool", owner: "Marketing", indexable: false, notes: "Unlaunched scaffold" },
  { route: "/tools/office-space-calculator", classification: "public", audience: "Public visitor", intent: "Calculator tool", owner: "Marketing", indexable: false, notes: "Unlaunched scaffold" },
  // Redirect-only routes (no page.tsx — next.config only)
  { route: "/brochure", classification: "redirect", audience: "Public", intent: "→ /downloads", owner: "Marketing", indexable: false },
  { route: "/download-brochure", classification: "redirect", audience: "Public", intent: "→ /downloads", owner: "Marketing", indexable: false },
  { route: "/catalog", classification: "redirect", audience: "Public", intent: "→ /downloads", owner: "Site", indexable: false },
  { route: "/news", classification: "redirect", audience: "Public", intent: "→ /about", owner: "Marketing", indexable: false },
  { route: "/gallery", classification: "redirect", audience: "Public", intent: "→ /clients", owner: "Marketing", indexable: false },
  { route: "/projects", classification: "redirect", audience: "Public", intent: "→ /clients", owner: "Marketing", indexable: false },
  { route: "/portfolio", classification: "redirect", audience: "Public", intent: "→ /clients", owner: "Marketing", indexable: false },
  { route: "/social", classification: "redirect", audience: "Public", intent: "→ /clients", owner: "Marketing", indexable: false },
  { route: "/imprint", classification: "redirect", audience: "Public", intent: "→ /terms?section=imprint", owner: "Ops", indexable: false },
  { route: "/support-ivr", classification: "redirect", audience: "Public", intent: "→ /service", owner: "Ops", indexable: false },
  { route: "/tracking", classification: "redirect", audience: "Public", intent: "→ /service", owner: "Ops", indexable: false },
  { route: "/templates", classification: "redirect", audience: "Public", intent: "→ /products", owner: "Site", indexable: false },
  // Admin routes
  { route: "/admin", classification: "protected", audience: "Administrator", intent: "Admin home", owner: "Admin", indexable: false },
  { route: "/admin/catalog", classification: "protected", audience: "Administrator", intent: "Catalog management", owner: "Admin", indexable: false },
  { route: "/admin/inventory", classification: "protected", audience: "Administrator", intent: "Inventory management", owner: "Admin", indexable: false },
  { route: "/admin/analytics", classification: "protected", audience: "Administrator", intent: "Analytics dashboard", owner: "Admin", indexable: false },
  { route: "/admin/customer-queries", classification: "protected", audience: "Administrator", intent: "Customer queries", owner: "Admin", indexable: false },
  { route: "/admin/features", classification: "protected", audience: "Administrator", intent: "Feature flags", owner: "Admin", indexable: false },
  { route: "/admin/themes", classification: "protected", audience: "Administrator", intent: "Theme editor", owner: "Admin", indexable: false },
  { route: "/admin/settings", classification: "protected", audience: "Administrator", intent: "Settings", owner: "Admin", indexable: false },
  { route: "/admin/plans", classification: "protected", audience: "Administrator", intent: "Plans management", owner: "Admin", indexable: false },
  { route: "/admin/plans/[id]", classification: "protected", audience: "Administrator", intent: "Plan detail", owner: "Admin", indexable: false },
  { route: "/admin/crm", classification: "protected", audience: "Administrator", intent: "CRM home", owner: "Admin", indexable: false },
  { route: "/admin/crm/clients", classification: "protected", audience: "Administrator", intent: "Client management", owner: "Admin", indexable: false },
  { route: "/admin/crm/projects", classification: "protected", audience: "Administrator", intent: "Project management", owner: "Admin", indexable: false },
  { route: "/admin/crm/projects/[id]", classification: "protected", audience: "Administrator", intent: "Project detail", owner: "Admin", indexable: false },
  { route: "/admin/crm/quotes", classification: "protected", audience: "Administrator", intent: "Quote management", owner: "Admin", indexable: false },
  { route: "/admin/price-books", classification: "protected", audience: "Administrator", intent: "Price books", owner: "Admin", indexable: false },
  { route: "/admin/design-kit", classification: "protected", audience: "Administrator", intent: "Design kit", owner: "Admin", indexable: false },
  { route: "/admin/planner-catalog", classification: "protected", audience: "Administrator", intent: "Planner catalog", owner: "Admin", indexable: false },
  { route: "/admin/workspace-catalog", classification: "protected", audience: "Administrator", intent: "Workspace catalog", owner: "Admin", indexable: false },
  // Planner app routes
  { route: "/ooplanner", classification: "public", audience: "Public visitor / member", intent: "Planner app", owner: "Planner", indexable: false },
  { route: "/ooplanner/projects", classification: "protected", audience: "Authenticated member", intent: "Planner projects list", owner: "Planner", indexable: false },
  { route: "/ooplanner/projects/[id]", classification: "protected", audience: "Authenticated member", intent: "Planner project editor", owner: "Planner", indexable: false },
  // Studio app routes
  { route: "/oostudio", classification: "protected", audience: "Administrator", intent: "Studio app", owner: "Studio", indexable: false },
  // Offline
  { route: "/offline", classification: "public", audience: "Public visitor", intent: "Offline fallback", owner: "Site", indexable: false },
  // Not-found
  { route: "/_not-found", classification: "not-found", audience: "Public visitor", intent: "Global not-found fallback", owner: "Site", indexable: false },
] as const;

const routeContractMap = new Map(
  ROUTE_CONTRACT_ENTRIES.map((entry) => [entry.route, entry]),
);

// ---------------------------------------------------------------------------
// Static dynamic-instance data (source-read, no runtime)
// ---------------------------------------------------------------------------

/** Known catalog category IDs from Catalog_CATEGORY_ORDER in categories.ts */
const CATALOG_CATEGORY_ORDER = [
  "seating",
  "workstations",
  "tables",
  "storages",
  "soft-seating",
  "education",
] as const;

/** Known solution category IDs from routeClassification.ts */
const SOLUTION_CATEGORY_IDS = [
  "seating",
  "workstations",
  "tables",
  "storages",
  "soft-seating",
  "education",
] as const;

/** Known planner feature slugs from plannerFeaturePages.ts */
const PLANNER_FEATURE_SLUGS = [
  "measure",
  "catalog",
  "ai-assist",
  "export",
] as const;

// ---------------------------------------------------------------------------
// Redirect-only routes from next.config.js (no page.tsx shell)
// ---------------------------------------------------------------------------

interface RedirectEntry {
  readonly source: string;
  readonly destination: string;
  readonly permanent: boolean;
}

/**
 * Config-level redirects extracted from next.config.js. These are redirect-only
 * routes with no page.tsx — they exist only in the redirect table.
 */
const NEXT_CONFIG_REDIRECTS: readonly RedirectEntry[] = [
  { source: "/catalog", destination: "/downloads/", permanent: true },
  { source: "/brochure", destination: "/downloads/", permanent: true },
  { source: "/download-brochure", destination: "/downloads/", permanent: true },
  { source: "/templates", destination: "/products/", permanent: true },
  { source: "/news", destination: "/about/", permanent: true },
  { source: "/gallery", destination: "/clients/", permanent: true },
  { source: "/projects", destination: "/clients/", permanent: true },
  { source: "/portfolio", destination: "/clients/", permanent: true },
  { source: "/social", destination: "/clients/", permanent: true },
  { source: "/imprint", destination: "/terms/?section=imprint", permanent: true },
  { source: "/support-ivr", destination: "/service/", permanent: true },
  { source: "/tracking", destination: "/service/", permanent: true },
  { source: "/login", destination: "/access/", permanent: true },
  { source: "/planner/features/3d-view", destination: "/planner/features/export/", permanent: true },
  { source: "/workstations/configurator", destination: "/downloads/", permanent: true },
  { source: "/results", destination: "/dashboard", permanent: true },
  { source: "/products/oando-chairs", destination: "/products/seating", permanent: true },
  { source: "/products/oando-other-seating", destination: "/products/seating", permanent: true },
  { source: "/products/oando-seating", destination: "/products/seating", permanent: true },
  { source: "/products/oando-workstations", destination: "/products/workstations", permanent: true },
  { source: "/products/oando-tables", destination: "/products/tables", permanent: true },
  { source: "/products/oando-storage", destination: "/products/storages", permanent: true },
  { source: "/products/oando-soft-seating", destination: "/products/soft-seating", permanent: true },
  { source: "/products/oando-collaborative", destination: "/products/soft-seating", permanent: true },
  { source: "/products/oando-educational", destination: "/products/education", permanent: true },
  { source: "/products/chairs-mesh", destination: "/products/seating", permanent: true },
  { source: "/products/chairs-others", destination: "/products/seating", permanent: true },
  { source: "/products/cafe-seating", destination: "/products/seating", permanent: true },
  { source: "/products/desks-cabin-tables", destination: "/products/tables", permanent: true },
  { source: "/products/meeting-conference-tables", destination: "/products/tables", permanent: true },
  { source: "/products/others-1", destination: "/products/soft-seating", permanent: true },
  { source: "/products/others-2", destination: "/products/seating", permanent: true },
  { source: "/oando-planner", destination: "/ooplanner/", permanent: true },
  { source: "/buddy-planner", destination: "/ooplanner/", permanent: true },
  { source: "/admin/svg-editor", destination: "/oostudio/", permanent: true },
  { source: "/admin/product-studio", destination: "/oostudio/", permanent: true },
  { source: "/portal/svg-catalog", destination: "/products/", permanent: true },
  { source: "/crm", destination: "/admin/crm/", permanent: true },
  { source: "/ops", destination: "/admin/customer-queries/", permanent: true },
];

// ---------------------------------------------------------------------------
// Main discovery function
// ---------------------------------------------------------------------------

export interface DiscoveryOptions {
  readonly repositoryRoot: string;
  readonly discoveredAt?: string;
}

export async function discoverCanonicalInventory(
  options: DiscoveryOptions,
): Promise<CanonicalDiscoveryResult> {
  const { repositoryRoot } = options;
  const discoveredAt = options.discoveredAt ?? new Date().toISOString();
  const appDir = path.join(repositoryRoot, "site", "app");

  // -----------------------------------------------------------------------
  // 1. Walk the App Router filesystem
  // -----------------------------------------------------------------------
  const walkerEntries = await walkAppRouter(appDir);

  const routes: DiscoveredRoute[] = [];
  const shells: DiscoveredShell[] = [];
  const dynamicInstances: DiscoveredDynamicInstance[] = [];
  const conflicts: DiscoveryConflict[] = [];
  const coverageGaps: DiscoveryCoverageGap[] = [];
  const exclusions: DiscoveryExclusion[] = [];

  // Track seen patterns for deduplication
  const seenRoutePatterns = new Map<string, DiscoveredRoute>();
  const seenInstanceUrls = new Map<string, DiscoveredDynamicInstance>();

  // -----------------------------------------------------------------------
  // 2. Process page.tsx entries → routes
  // -----------------------------------------------------------------------
  for (const entry of walkerEntries) {
    if (entry.fileName !== PAGE_FILE) continue;

    const pattern = entry.urlPattern;
    const sourcePath = `site/app/${entry.relativePath}`;
    const contract = routeContractMap.get(pattern);
    const surface = classifySurface(pattern, sourcePath);
    const status = classifyRouteStatus(pattern, contract?.classification);
    const rId = routeId(pattern);

    const provenance: ProvenanceReference[] = [
      routeTreeProvenance(sourcePath, discoveredAt),
    ];
    const conflictIds: string[] = [];

    // Check for contract conflicts
    if (contract) {
      const contractSurface = classifySurface(contract.route, sourcePath);
      if (contractSurface !== surface) {
        const cId = stableId("conflict", rId, "productSurface");
        conflictIds.push(cId);
        conflicts.push({
          conflictId: cId,
          subjectKey: rId,
          claimField: "productSurface",
          claims: [
            { sourceId: AUDIT_SOURCE_IDS.appRouterTree, authorityRank: SOURCE_AUTHORITY_RANKS.appRouterTree, value: surface },
            { sourceId: AUDIT_SOURCE_IDS.routeContracts, authorityRank: SOURCE_AUTHORITY_RANKS.routeContracts, value: contractSurface },
          ],
          resolution: "higher-authority-selected",
          selectedSourceId: AUDIT_SOURCE_IDS.appRouterTree,
        });
      }
      provenance.push(
        contractProvenance(
          "site/features/site/data/routeClassification.ts",
          discoveredAt,
        ),
      );
    }

    const route: DiscoveredRoute = {
      routeId: rId,
      pattern,
      concreteUrl: entry.isDynamic ? undefined : normalizeUrl(pattern),
      routeKind: entry.isDynamic ? "dynamic" : "static",
      productSurface: surface,
      status,
      sourcePath,
      provenance,
      conflictIds,
      coverageGapIds: [],
    };

    // Dedup: if pattern already seen, keep the one with higher-authority source
    const existing = seenRoutePatterns.get(pattern);
    if (existing) {
      // Keep existing — duplicate pages shouldn't happen in valid App Router
      continue;
    }

    seenRoutePatterns.set(pattern, route);
    routes.push(route);
  }

  // -----------------------------------------------------------------------
  // 3. Process shell files → shared shells
  // -----------------------------------------------------------------------
  for (const entry of walkerEntries) {
    const shellRole = SHELL_FILES.get(entry.fileName);
    if (!shellRole && entry.fileName !== TEMPLATE_FILE) continue;

    const role: ShellRole = shellRole ?? "layout"; // templates treated as layout role
    const sourcePath = `site/app/${entry.relativePath}`;
    const pattern = entry.urlPattern;
    const surface = classifySurface(pattern, sourcePath);

    // Find which routes this shell covers
    const coveredRouteIds = routes
      .filter((r) => {
        // A layout/shell at pattern X covers all routes that start with X
        if (pattern === "/") return true; // root layout covers all
        return r.pattern === pattern || r.pattern.startsWith(`${pattern}/`);
      })
      .map((r) => r.routeId);

    const sId = shellId(sourcePath, role);

    shells.push({
      shellId: sId,
      role,
      productSurface: surface === "marketing" && pattern === "/" ? "shared-shell" : surface,
      sourcePath,
      visibleOutput: true,
      routeIds: coveredRouteIds,
      provenance: [routeTreeProvenance(sourcePath, discoveredAt)],
      status: "active",
    });
  }

  // Add the global-error.tsx and root not-found as shells
  const globalErrorPath = "site/app/global-error.tsx";
  shells.push({
    shellId: shellId(globalErrorPath, "error-boundary"),
    role: "error-boundary",
    productSurface: "shared-shell",
    sourcePath: globalErrorPath,
    visibleOutput: true,
    routeIds: routes.map((r) => r.routeId),
    provenance: [routeTreeProvenance(globalErrorPath, discoveredAt)],
    status: "active",
  });

  // Offline shell
  const offlineShellPath = "site/app/offline/page.tsx";
  shells.push({
    shellId: shellId(offlineShellPath, "offline-shell"),
    role: "offline-shell",
    productSurface: "offline",
    sourcePath: offlineShellPath,
    visibleOutput: true,
    routeIds: [routeId("/offline")],
    provenance: [routeTreeProvenance(offlineShellPath, discoveredAt)],
    status: "active",
  });

  // QueryProvider as a visible provider shell
  const queryProviderPath = "site/app/(site)/providers/QueryProvider.tsx";
  shells.push({
    shellId: shellId(queryProviderPath, "provider-output"),
    role: "provider-output",
    productSurface: "shared-shell",
    sourcePath: queryProviderPath,
    visibleOutput: true,
    routeIds: routes.filter((r) => r.productSurface !== "studio" && r.productSurface !== "planner" && r.productSurface !== "administration").map((r) => r.routeId),
    provenance: [routeTreeProvenance(queryProviderPath, discoveredAt)],
    status: "active",
  });

  // -----------------------------------------------------------------------
  // 4. Add redirect-only routes (config-level, no page.tsx)
  // -----------------------------------------------------------------------
  for (const redirect of NEXT_CONFIG_REDIRECTS) {
    const pattern = redirect.source;
    // Skip if already discovered from the filesystem (e.g., /login has a page.tsx)
    if (seenRoutePatterns.has(pattern)) continue;
    // Skip wildcard/parameterized redirects — they are pattern-based, not concrete routes
    if (pattern.includes(":") || pattern.includes("*")) continue;

    const sourcePath = "config/build/next.config.js";
    const surface = classifySurface(pattern, sourcePath);
    const rId = routeId(pattern);
    const contract = routeContractMap.get(pattern);

    const provenance: ProvenanceReference[] = [
      makeProvenance(
        AUDIT_SOURCE_IDS.routeContracts,
        "source",
        sourcePath,
        discoveredAt,
        SOURCE_AUTHORITY_RANKS.routeContracts,
      ),
    ];

    if (contract) {
      provenance.push(
        contractProvenance(
          "site/features/site/data/routeClassification.ts",
          discoveredAt,
        ),
      );
    }

    const route: DiscoveredRoute = {
      routeId: rId,
      pattern,
      concreteUrl: normalizeUrl(pattern),
      routeKind: "static",
      productSurface: surface,
      status: "redirected",
      sourcePath,
      provenance,
      conflictIds: [],
      coverageGapIds: [],
    };

    seenRoutePatterns.set(pattern, route);
    routes.push(route);
  }

  // -----------------------------------------------------------------------
  // 5. Resolve dynamic instances from source data
  // -----------------------------------------------------------------------

  // 5a. Products: /products/[category] instances from Catalog_CATEGORY_ORDER
  const categoryRouteId = routeId("/products/[category]");
  for (const cat of CATALOG_CATEGORY_ORDER) {
    const concreteUrl = `/products/${cat}`;
    const normalized = normalizeUrl(concreteUrl);
    const iId = instanceId(categoryRouteId, normalized);

    const instance: DiscoveredDynamicInstance = {
      instanceId: iId,
      routeId: categoryRouteId,
      concreteUrl,
      normalizedUrl: normalized,
      parameterValues: { category: cat },
      discoverySources: [
        staticGenProvenance(
          "site/app/(site)/products/[category]/page.tsx#generateStaticParams",
          discoveredAt,
        ),
        repoDataProvenance(
          "site/lib/catalog/site/categories.ts#Catalog_CATEGORY_ORDER",
          discoveredAt,
        ),
      ],
      discoveredAt,
      productSurface: "catalog-configurator",
      status: "active",
      coverageGapIds: [],
    };

    if (!seenInstanceUrls.has(normalized)) {
      seenInstanceUrls.set(normalized, instance);
      dynamicInstances.push(instance);
    }
  }

  // 5b. Products: /products/[category]/[product] — requires runtime data
  //     Create a coverage gap since we cannot resolve product slugs from
  //     static source alone (productStaticParams reads DB + disk)
  const productRouteId = routeId("/products/[category]/[product]");
  const productGapId = stableId("gap", productRouteId, "product-slugs");
  coverageGaps.push({
    gapId: productGapId,
    routeId: productRouteId,
    parameterDomain: "[product]",
    reason: "Product slug resolution requires database or disk catalog data that cannot be statically enumerated without runtime. buildProductStaticParams() merges live Drizzle rows and local fallback JSON.",
    proposedResolution: "Implement the repository data adapter to read local fallback catalog JSON from site/platform/shared/data/furniture/ and enumerate product URL keys, or obtain authorized runtime discovery.",
  });

  // Update the route's coverageGapIds
  const productRoute = routes.find((r) => r.routeId === productRouteId);
  if (productRoute) {
    const mutable = productRoute as unknown as { coverageGapIds: string[] };
    mutable.coverageGapIds = [productGapId];
  }

  // 5c. Products category legacy redirect: /products/category/[slug]
  const legacyCategoryRouteId = routeId("/products/category/[slug]");
  for (const cat of CATALOG_CATEGORY_ORDER) {
    const concreteUrl = `/products/category/${cat}`;
    const normalized = normalizeUrl(concreteUrl);
    const iId = instanceId(legacyCategoryRouteId, normalized);

    const instance: DiscoveredDynamicInstance = {
      instanceId: iId,
      routeId: legacyCategoryRouteId,
      concreteUrl,
      normalizedUrl: normalized,
      parameterValues: { slug: cat },
      discoverySources: [
        repoDataProvenance(
          "site/lib/catalog/site/categories.ts#Catalog_CATEGORY_ORDER",
          discoveredAt,
        ),
      ],
      discoveredAt,
      productSurface: "catalog-configurator",
      status: "active",
      coverageGapIds: [],
    };

    if (!seenInstanceUrls.has(normalized)) {
      seenInstanceUrls.set(normalized, instance);
      dynamicInstances.push(instance);
    }
  }

  // 5d. Solutions: /solutions/[category]
  const solutionsRouteId = routeId("/solutions/[category]");
  for (const cat of SOLUTION_CATEGORY_IDS) {
    const concreteUrl = `/solutions/${cat}`;
    const normalized = normalizeUrl(concreteUrl);
    const iId = instanceId(solutionsRouteId, normalized);

    const instance: DiscoveredDynamicInstance = {
      instanceId: iId,
      routeId: solutionsRouteId,
      concreteUrl,
      normalizedUrl: normalized,
      parameterValues: { category: cat },
      discoverySources: [
        staticGenProvenance(
          "site/app/(site)/solutions/[category]/page.tsx#generateStaticParams",
          discoveredAt,
        ),
        repoDataProvenance(
          "site/features/site/data/routeClassification.ts#SOLUTION_CATEGORY_IDS",
          discoveredAt,
        ),
      ],
      discoveredAt,
      productSurface: "marketing",
      status: "active",
      coverageGapIds: [],
    };

    if (!seenInstanceUrls.has(normalized)) {
      seenInstanceUrls.set(normalized, instance);
      dynamicInstances.push(instance);
    }
  }

  // 5e. Planner features: /planner/features/[slug]
  const plannerFeaturesRouteId = routeId("/planner/features/[slug]");
  for (const slug of PLANNER_FEATURE_SLUGS) {
    const concreteUrl = `/planner/features/${slug}`;
    const normalized = normalizeUrl(concreteUrl);
    const iId = instanceId(plannerFeaturesRouteId, normalized);

    const instance: DiscoveredDynamicInstance = {
      instanceId: iId,
      routeId: plannerFeaturesRouteId,
      concreteUrl,
      normalizedUrl: normalized,
      parameterValues: { slug },
      discoverySources: [
        staticGenProvenance(
          "site/app/(site)/planner/features/[slug]/page.tsx#generateStaticParams",
          discoveredAt,
        ),
        repoDataProvenance(
          "site/features/site/planner/landing/plannerFeaturePages.ts#PLANNER_FEATURE_PAGES",
          discoveredAt,
        ),
      ],
      discoveredAt,
      productSurface: "marketing",
      status: "active",
      coverageGapIds: [],
    };

    if (!seenInstanceUrls.has(normalized)) {
      seenInstanceUrls.set(normalized, instance);
      dynamicInstances.push(instance);
    }
  }

  // 5f. Protected dynamic routes — coverage gaps for unresolvable instances
  const protectedDynamicRoutes = [
    { pattern: "/portal/[id]", param: "[id]", reason: "Portal project IDs require authenticated database access." },
    { pattern: "/portal/guest/view/[id]", param: "[id]", reason: "Guest view IDs require authenticated database or shared-link access." },
    { pattern: "/admin/plans/[id]", param: "[id]", reason: "Plan IDs require administrator database access." },
    { pattern: "/admin/crm/projects/[id]", param: "[id]", reason: "CRM project IDs require administrator database access." },
    { pattern: "/ooplanner/projects/[id]", param: "[id]", reason: "Planner project IDs require authenticated member access to the plans database." },
  ];

  for (const { pattern, param, reason } of protectedDynamicRoutes) {
    const rId = routeId(pattern);
    const gId = stableId("gap", rId, param);
    coverageGaps.push({
      gapId: gId,
      routeId: rId,
      parameterDomain: param,
      reason,
      proposedResolution: "Obtain authorized runtime discovery or seed data access to enumerate real instance IDs.",
    });

    const route = routes.find((r) => r.routeId === rId);
    if (route) {
      const mutable = route as unknown as { coverageGapIds: string[] };
      mutable.coverageGapIds = [...mutable.coverageGapIds, gId];
    }
  }

  // -----------------------------------------------------------------------
  // 6. Verify: every candidate has exactly one classification
  // -----------------------------------------------------------------------
  // All routes have a status. All dynamic instances have a status.
  // Exclusions are for items we explicitly drop from scope.
  // Conflicts are preserved. Coverage gaps are explicit.

  return Object.freeze({
    routes: Object.freeze(routes),
    dynamicInstances: Object.freeze(dynamicInstances),
    shells: Object.freeze(shells),
    conflicts: Object.freeze(conflicts),
    coverageGaps: Object.freeze(coverageGaps),
    exclusions: Object.freeze(exclusions),
    discoveredAt,
  });
}

// ---------------------------------------------------------------------------
// Schema-record conversion helpers
// ---------------------------------------------------------------------------

/**
 * Convert discovery result to schema-validated audit records suitable for
 * partition storage.
 */
export function discoveryToAuditRecords(
  result: CanonicalDiscoveryResult,
): readonly Record<string, unknown>[] {
  const records: Record<string, unknown>[] = [];

  for (const route of result.routes) {
    records.push({
      schemaVersion: AUDIT_SCHEMA_VERSION,
      recordType: "route",
      recordId: `record.${route.routeId}`,
      createdAt: result.discoveredAt,
      routeId: route.routeId,
      pattern: route.pattern,
      ...(route.concreteUrl ? { concreteUrl: route.concreteUrl } : {}),
      routeKind: route.routeKind,
      productSurface: route.productSurface,
      status: route.status,
      sourcePath: route.sourcePath,
      provenance: route.provenance,
      conflictIds: route.conflictIds,
      ...(route.exclusionId ? { exclusionId: route.exclusionId } : {}),
      coverageGapIds: route.coverageGapIds,
    });
  }

  for (const instance of result.dynamicInstances) {
    records.push({
      schemaVersion: AUDIT_SCHEMA_VERSION,
      recordType: "dynamic-instance",
      recordId: `record.${instance.instanceId}`,
      createdAt: result.discoveredAt,
      instanceId: instance.instanceId,
      routeId: instance.routeId,
      concreteUrl: instance.concreteUrl,
      normalizedUrl: instance.normalizedUrl,
      parameterValues: instance.parameterValues,
      discoverySources: instance.discoverySources,
      discoveredAt: instance.discoveredAt,
      productSurface: instance.productSurface,
      status: instance.status,
      coverageGapIds: instance.coverageGapIds,
    });
  }

  for (const shell of result.shells) {
    records.push({
      schemaVersion: AUDIT_SCHEMA_VERSION,
      recordType: "shared-shell",
      recordId: `record.${shell.shellId}`,
      createdAt: result.discoveredAt,
      shellId: shell.shellId,
      role: shell.role,
      productSurface: shell.productSurface,
      sourcePath: shell.sourcePath,
      visibleOutput: shell.visibleOutput,
      routeIds: shell.routeIds,
      provenance: shell.provenance,
      status: shell.status,
    });
  }

  for (const gap of result.coverageGaps) {
    records.push({
      schemaVersion: AUDIT_SCHEMA_VERSION,
      recordType: "coverage-gap",
      recordId: `record.${gap.gapId}`,
      createdAt: result.discoveredAt,
      gapId: gap.gapId,
      inventoryId: gap.routeId,
      affectedOccurrenceIds: [`occurrence.${gap.routeId}.pending`],
      attemptedEvidenceSources: ["repository-data", "static-generation-declarations"],
      missingPrerequisite: gap.reason,
      userImpact: `Dynamic instances for ${gap.parameterDomain} remain unresolved.`,
      proposedResolution: gap.proposedResolution,
      owner: "audit-tooling",
      status: "open",
    });
  }

  for (const conflict of result.conflicts) {
    records.push({
      schemaVersion: AUDIT_SCHEMA_VERSION,
      recordType: "authority-conflict",
      recordId: `record.${conflict.conflictId}`,
      createdAt: result.discoveredAt,
      conflictId: conflict.conflictId,
      subjectKey: conflict.subjectKey,
      claimField: conflict.claimField,
      claims: conflict.claims.map((claim) => ({
        candidateId: `candidate.${conflict.subjectKey}.${claim.sourceId}`,
        sourceId: claim.sourceId,
        authorityRank: claim.authorityRank,
        valueFingerprint: claim.value,
        provenance: [{
          sourceId: claim.sourceId,
          sourceKind: "source" as const,
          location: claim.sourceId,
          discoveredAt: result.discoveredAt,
          authorityRank: claim.authorityRank,
        }],
      })),
      resolution: conflict.resolution,
      ...(conflict.selectedSourceId ? {
        selectedCandidateId: `candidate.${conflict.subjectKey}.${conflict.selectedSourceId}`,
        selectedSourceId: conflict.selectedSourceId,
        selectedAuthorityRank: conflict.claims.find((c) => c.sourceId === conflict.selectedSourceId)?.authorityRank ?? 0,
      } : {}),
      provenance: conflict.claims.map((claim) => ({
        sourceId: claim.sourceId,
        sourceKind: "source" as const,
        location: claim.sourceId,
        discoveredAt: result.discoveredAt,
        authorityRank: claim.authorityRank,
      })),
    });
  }

  for (const exclusion of result.exclusions) {
    records.push({
      schemaVersion: AUDIT_SCHEMA_VERSION,
      recordType: "exclusion",
      recordId: `record.${exclusion.exclusionId}`,
      createdAt: result.discoveredAt,
      exclusionId: exclusion.exclusionId,
      inventoryId: exclusion.routeId,
      itemKind: "route",
      reason: exclusion.reason,
      evidenceReferences: [exclusion.routeId],
      decisionOwner: "audit-tooling",
      decidedAt: result.discoveredAt,
      reconsiderationTrigger: exclusion.reconsiderationTrigger,
      requiresOwnerDecision: false,
      productSurface: "marketing",
    });
  }

  return Object.freeze(records);
}
