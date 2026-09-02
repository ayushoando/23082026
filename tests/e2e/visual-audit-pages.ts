/**
 * Page manifest for the full-site visual audit.
 *
 * Single source of truth listing every route to capture at mobile (390w)
 * and desktop (1920w) viewports. Grouped by surface.
 *
 * Usage: imported by `visual-audit-full-site.spec.ts`.
 */

export interface AuditPage {
  /** URL path to navigate to */
  path: string;
  /** Human-readable label (also used in filenames) */
  label: string;
  /** Surface group: site | admin | studio | planner */
  group: "site" | "admin" | "studio" | "planner";
  /** Optional CSS selector or testid to wait for before capture */
  waitFor?: string;
}

export interface LinkFollowPage {
  /** URL of the list page to start from */
  listPath: string;
  /** CSS selector for the link to follow (first match used) */
  linkSelector: string;
  /** Human-readable label */
  label: string;
  /** Surface group */
  group: "site" | "admin" | "studio" | "planner";
  /** Optional selector to wait for on the destination page */
  waitFor?: string;
}

// ---------------------------------------------------------------------------
// Static + known-slug pages
// ---------------------------------------------------------------------------

export const PAGE_MANIFEST: AuditPage[] = [
  // ── Site (marketing) ─────────────────────────────────────────────────────
  { path: "/", label: "homepage", group: "site", waitFor: "#home-hero" },
  { path: "/about", label: "about", group: "site" },
  { path: "/access", label: "access", group: "site" },
  { path: "/career", label: "career", group: "site" },
  { path: "/choose-product", label: "choose-product", group: "site" },
  { path: "/portfolio", label: "portfolio", group: "site" },
  { path: "/compare", label: "compare", group: "site" },
  { path: "/contact", label: "contact", group: "site" },
  { path: "/dashboard", label: "dashboard", group: "site" },
  { path: "/downloads", label: "downloads", group: "site" },
  { path: "/login", label: "login", group: "site" },
  { path: "/planning", label: "planning", group: "site" },
  { path: "/planner", label: "planner-landing", group: "site" },
  { path: "/planner/features", label: "planner-features-index", group: "site" },
  { path: "/planner/help", label: "planner-help", group: "site" },
  { path: "/portal", label: "portal", group: "site" },
  { path: "/portal/guest", label: "portal-guest", group: "site" },
  { path: "/privacy", label: "privacy", group: "site" },
  { path: "/products", label: "products-catalog", group: "site", waitFor: '[data-testid="home-marketing-layout"]' },
  { path: "/quote-cart", label: "quote-cart", group: "site" },
  { path: "/refund-and-return-policy", label: "refund-return-policy", group: "site" },
  { path: "/service", label: "service", group: "site" },
  { path: "/showrooms", label: "showrooms", group: "site" },
  { path: "/sitemap", label: "sitemap", group: "site" },
  { path: "/solutions", label: "solutions", group: "site" },
  { path: "/sustainability", label: "sustainability", group: "site" },
  { path: "/terms", label: "terms", group: "site" },
  { path: "/trusted-by", label: "trusted-by", group: "site" },

  // ── Site — dynamic routes (representative samples) ───────────────────────
  { path: "/products/seating", label: "products-seating", group: "site", waitFor: '[data-testid="home-marketing-layout"]' },
  { path: "/solutions/seating", label: "solutions-seating", group: "site" },
  { path: "/solutions/workstations", label: "solutions-workstations", group: "site" },
  { path: "/planner/features/measure", label: "planner-feature-measure", group: "site" },
  { path: "/planner/features/catalog", label: "planner-feature-catalog", group: "site" },
  { path: "/planner/features/ai-assist", label: "planner-feature-ai-assist", group: "site" },
  { path: "/planner/features/export", label: "planner-feature-export", group: "site" },

  // ── Admin ────────────────────────────────────────────────────────────────
  { path: "/admin", label: "admin-home", group: "admin" },
  { path: "/admin/analytics", label: "admin-analytics", group: "admin" },
  { path: "/admin/catalog", label: "admin-catalog", group: "admin" },
  { path: "/admin/crm", label: "admin-crm", group: "admin" },
  { path: "/admin/crm/clients", label: "admin-crm-clients", group: "admin" },
  { path: "/admin/crm/projects", label: "admin-crm-projects", group: "admin" },
  { path: "/admin/crm/quotes", label: "admin-crm-quotes", group: "admin" },
  { path: "/admin/customer-queries", label: "admin-customer-queries", group: "admin" },
  { path: "/admin/design-kit", label: "admin-design-kit", group: "admin" },
  { path: "/admin/features", label: "admin-features", group: "admin" },
  { path: "/admin/inventory", label: "admin-inventory", group: "admin" },
  { path: "/admin/planner-catalog", label: "admin-planner-catalog", group: "admin" },
  { path: "/admin/plans", label: "admin-plans", group: "admin" },
  { path: "/admin/price-books", label: "admin-price-books", group: "admin" },
  { path: "/admin/settings", label: "admin-settings", group: "admin" },
  { path: "/admin/themes", label: "admin-themes", group: "admin" },
  { path: "/admin/workspace-catalog", label: "admin-workspace-catalog", group: "admin" },

  // ── Studio ───────────────────────────────────────────────────────────────
  { path: "/oostudio", label: "studio-shell", group: "studio" },

  // ── Planner (app) ────────────────────────────────────────────────────────
  { path: "/ooplanner", label: "planner-app-shell", group: "planner" },
  { path: "/ooplanner/projects", label: "planner-projects-list", group: "planner" },

  // ── Misc ─────────────────────────────────────────────────────────────────
  { path: "/offline", label: "offline", group: "site" },
];

// ---------------------------------------------------------------------------
// Link-follow pages (dynamic routes that need a real slug from list pages)
// ---------------------------------------------------------------------------

export const LINK_FOLLOW_PAGES: LinkFollowPage[] = [
  {
    listPath: "/products/seating",
    linkSelector: 'a[href^="/products/seating/"]',
    label: "product-detail-page",
    group: "site",
    waitFor: '[data-testid="home-marketing-layout"]',
  },
  {
    listPath: "/admin/plans",
    linkSelector: 'a[href^="/admin/plans/"]',
    label: "admin-plan-detail",
    group: "admin",
  },
  {
    listPath: "/admin/crm/projects",
    linkSelector: 'a[href^="/admin/crm/projects/"]',
    label: "admin-crm-project-detail",
    group: "admin",
  },
];
