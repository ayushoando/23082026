import { SITE_URL } from "@/lib/siteUrl";

const RFC_9727_PROFILE = "https://www.rfc-editor.org/info/rfc9727";

export const API_CATALOG_CONTENT_TYPE =
  `application/linkset+json; profile="${RFC_9727_PROFILE}"`;

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "head";

export type ApiCatalogEntry = {
  path: string;
  summary: string;
  methods: readonly HttpMethod[];
};

/** Physical route.ts files under site/app/api. Kept in lockstep by unit test. */
export const DISK_API_ROUTES: readonly ApiCatalogEntry[] = [
  { path: "/api", summary: "Service root status", methods: ["get"] },
  { path: "/api/health", summary: "Liveness probe", methods: ["get"] },
  { path: "/api/csrf", summary: "CSRF token", methods: ["get"] },
  { path: "/api/products", summary: "Product listing", methods: ["get"] },
  { path: "/api/products/filter", summary: "Product filter", methods: ["get"] },
  { path: "/api/categories", summary: "Category list", methods: ["get"] },
  { path: "/api/nav-categories", summary: "Navigation category tree", methods: ["get"] },
  { path: "/api/nav-search", summary: "Site search", methods: ["get", "post"] },
  { path: "/api/business-stats", summary: "Business statistics", methods: ["get"] },
  { path: "/api/theme/active", summary: "Active theme tokens", methods: ["get"] },
  { path: "/api/theme/manage", summary: "Theme management", methods: ["get", "post"] },
  { path: "/api/features", summary: "Feature flags", methods: ["get"] },
  { path: "/api/filter", summary: "Authenticated catalog filter", methods: ["post"] },
  { path: "/api/tracking", summary: "Client analytics events", methods: ["post"] },
  { path: "/api/log-error", summary: "Client error ingest", methods: ["post"] },
  { path: "/api/metrics", summary: "Prometheus metrics (env-gated in production)", methods: ["get"] },
  { path: "/api/audit", summary: "Audit event ingest", methods: ["post"] },
  { path: "/api/customer-queries", summary: "Contact form submit", methods: ["post"] },
  { path: "/api/customer-queries/manage", summary: "Contact query queue", methods: ["get", "patch"] },
  { path: "/api/exports", summary: "Authenticated exports", methods: ["post"] },
  { path: "/api/ai-advisor", summary: "Authenticated AI advisor", methods: ["post"] },
  { path: "/api/generate-alt", summary: "Authenticated alt-text generation", methods: ["post"] },
  { path: "/api/git-user", summary: "Authenticated git user", methods: ["get"] },
  { path: "/api/configurator/smart-wizard", summary: "Authenticated configurator wizard", methods: ["post"] },
  { path: "/api/dev-tools/lighthouse", summary: "Dev Lighthouse probe", methods: ["get"] },
  { path: "/api/dev/auth-bypass-status", summary: "Dev auth-bypass status", methods: ["get"] },
  { path: "/api/plans", summary: "Authenticated plans collection", methods: ["get", "post"] },
  { path: "/api/plans/{id}", summary: "Authenticated plan document", methods: ["get", "put", "delete"] },
  { path: "/api/Planner/projects", summary: "Planner projects collection", methods: ["get", "post"] },
  { path: "/api/Planner/projects/{id}", summary: "Planner project document", methods: ["get", "patch", "delete"] },
  { path: "/api/Planner/handoff", summary: "Planner BOQ handoff", methods: ["post"] },
  { path: "/api/Planner/catalog", summary: "Planner catalog read", methods: ["get"] },
  { path: "/api/Planner/catalog/upload", summary: "Planner catalog upload", methods: ["post"] },
  { path: "/api/Planner/sketch-to-plan", summary: "Planner sketch-to-plan", methods: ["post"] },
  { path: "/api/Studio/furniture", summary: "Studio furniture collection", methods: ["get", "post"] },
  { path: "/api/Studio/furniture/{id}", summary: "Studio furniture item", methods: ["get", "patch", "delete"] },
  { path: "/api/Studio/furniture/{id}/publish", summary: "Studio furniture publish", methods: ["post"] },
  { path: "/api/Studio/furniture/upload", summary: "Studio furniture upload", methods: ["post"] },
  { path: "/api/Studio/ai/generate", summary: "Studio AI generate", methods: ["post"] },
  { path: "/api/Studio/ai/restyle", summary: "Studio AI restyle", methods: ["post"] },
  { path: "/api/Studio/ai/suggest", summary: "Studio AI suggest", methods: ["post"] },
  { path: "/api/admin/analytics", summary: "Admin analytics", methods: ["get"] },
  { path: "/api/admin/features", summary: "Admin feature flags", methods: ["get", "patch"] },
  { path: "/api/admin/indexnow", summary: "IndexNow search engine submission", methods: ["post"] },
  { path: "/api/admin/themes", summary: "Admin themes", methods: ["get"] },
  { path: "/api/admin/themes/publish", summary: "Admin theme publish", methods: ["post"] },
  { path: "/api/admin/plans", summary: "Admin plans collection", methods: ["get", "patch", "delete"] },
  { path: "/api/admin/plans/{id}", summary: "Admin plan document", methods: ["get", "patch"] },
  { path: "/api/admin/price-books", summary: "Admin price books", methods: ["get"] },
  { path: "/api/admin/price-books/{bookId}", summary: "Admin price book", methods: ["get"] },
  { path: "/api/admin/price-books/{bookId}/action", summary: "Admin price-book action", methods: ["post"] },
  { path: "/api/admin/catalogs/{type}", summary: "Admin catalogs collection", methods: ["get", "post"] },
  { path: "/api/admin/catalogs/{type}/{id}", summary: "Admin catalog item", methods: ["patch", "delete"] },
  { path: "/api/files/catalog/{path}", summary: "Catalog asset bytes", methods: ["get"] },
  { path: "/api/files/furniture/{filename}", summary: "Furniture asset bytes", methods: ["get"] },
  { path: "/api/files/projects/{filename}", summary: "Project file bytes", methods: ["get"] },
  { path: "/api/files/exports/{filename}", summary: "Export file bytes", methods: ["get"] },
  { path: "/api/files/uploads/{filename}", summary: "Upload file bytes", methods: ["get"] },
] as const;

/** next.config.js beforeFiles rewrites that still expose extra /api URLs. */
export const REWRITE_API_ALIASES: readonly ApiCatalogEntry[] = [
  { path: "/api/admin/svg-editor", summary: "Rewrite alias of /api/Studio/furniture", methods: ["get", "post"] },
  { path: "/api/admin/svg-editor/furniture", summary: "Rewrite alias of /api/Studio/furniture", methods: ["get", "post"] },
  { path: "/api/admin/svg-editor/furniture/{path}", summary: "Rewrite alias of /api/Studio/furniture/{path}", methods: ["get", "post", "patch", "delete"] },
  { path: "/api/admin/svg-editor/{path}", summary: "Rewrite alias of /api/Studio/furniture", methods: ["get", "post"] },
  { path: "/api/admin/product-studio", summary: "Rewrite alias of /api/Studio/furniture", methods: ["get", "post"] },
  { path: "/api/admin/product-studio/furniture", summary: "Rewrite alias of /api/Studio/furniture", methods: ["get", "post"] },
  { path: "/api/admin/product-studio/furniture/{path}", summary: "Rewrite alias of /api/Studio/furniture/{path}", methods: ["get", "post", "patch", "delete"] },
  { path: "/api/admin/product-studio/{path}", summary: "Rewrite alias of /api/Studio/furniture", methods: ["get", "post"] },
] as const;

/** HTTP discovery/docs endpoints outside site/app/api. */
export const DISCOVERY_ENDPOINTS: readonly ApiCatalogEntry[] = [
  { path: "/.well-known/api-catalog", summary: "RFC 9727 API catalog", methods: ["get", "head"] },
  { path: "/.well-known/security.txt", summary: "RFC 9116 security.txt", methods: ["get"] },
  { path: "/security.txt", summary: "RFC 9116 security.txt alias", methods: ["get"] },
  { path: "/openapi.json", summary: "OpenAPI 3.1 for this catalog", methods: ["get"] },
  { path: "/api-docs", summary: "Human-readable API list", methods: ["get"] },
  { path: "/robots.txt", summary: "Robots rules", methods: ["get"] },
  { path: "/sitemap.xml", summary: "XML sitemap", methods: ["get"] },
] as const;

export const API_CATALOG_ENTRIES: readonly ApiCatalogEntry[] = [
  ...DISK_API_ROUTES,
  ...REWRITE_API_ALIASES,
  ...DISCOVERY_ENDPOINTS,
];

/** @deprecated Use API_CATALOG_ENTRIES. */
export function catalogOrigin(siteUrl: string = SITE_URL): string {
  return siteUrl.replace(/\/+$/, "");
}

export function apiCatalogHref(origin: string = catalogOrigin()): string {
  return `${origin}/.well-known/api-catalog`;
}

export function apiCatalogLinkHeader(origin: string = catalogOrigin()): string {
  return `<${apiCatalogHref(origin)}>; rel="api-catalog"`;
}

type LinkTarget = { href: string; type: string };

export type ApiCatalogLinkset = {
  linkset: Array<{
    anchor: string;
    "service-desc": LinkTarget[];
    "service-doc": LinkTarget[];
    status: LinkTarget[];
  }>;
};

export function buildApiCatalogLinkset(
  origin: string = catalogOrigin(),
): ApiCatalogLinkset {
  const spec: LinkTarget = {
    href: `${origin}/openapi.json`,
    type: "application/json",
  };
  const docs: LinkTarget = {
    href: `${origin}/api-docs`,
    type: "text/markdown",
  };
  const health: LinkTarget = {
    href: `${origin}/api/health`,
    type: "application/json",
  };

  return {
    linkset: API_CATALOG_ENTRIES.map((entry) => ({
      anchor: `${origin}${entry.path}`,
      "service-desc": [spec],
      "service-doc": [docs],
      status: [health],
    })),
  };
}

export function buildPublicOpenApiDocument(
  origin: string = catalogOrigin(),
): Record<string, unknown> {
  const paths: Record<string, unknown> = {};
  for (const entry of API_CATALOG_ENTRIES) {
    const operations: Record<string, unknown> = {};
    for (const method of entry.methods) {
      operations[method] = {
        summary: entry.summary,
        responses: {
          "200": { description: "OK" },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
          "429": { description: "Rate limited" },
        },
      };
    }
    paths[entry.path] = operations;
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Oando APIs",
      version: "1.0.0",
      description:
        "Complete route catalog from site/app/api. Many endpoints require staff auth.",
    },
    servers: [{ url: origin }],
    paths,
  };
}

export function buildPublicApiDocsMarkdown(
  origin: string = catalogOrigin(),
): string {
  const lines = [
    "# Oando APIs",
    "",
    "Complete list of `site/app/api` routes. Many require a staff session.",
    "",
    `- Catalog: ${apiCatalogHref(origin)}`,
    `- OpenAPI: ${origin}/openapi.json`,
    `- Health: ${origin}/api/health`,
    "",
    "| Path | Methods | Purpose |",
    "| --- | --- | --- |",
    ...API_CATALOG_ENTRIES.map(
      (entry) =>
        `| \`${entry.path}\` | ${entry.methods.map((method) => method.toUpperCase()).join(", ")} | ${entry.summary} |`,
    ),
    "",
  ];
  return lines.join("\n");
}
