/**
 * Wave 1 — Task 2.1: Static navigation inventory.
 *
 * Extracts global navigation (header, skip links), local navigation (breadcrumbs,
 * in-page), footer nav, mobile navigation, back/cancel/recovery actions,
 * social links, and bottom tab bar from source.
 *
 * Requirements: 6.1-6.7, 20.1-20.4
 */

import { createHash } from "node:crypto";
import { AUDIT_SCHEMA_VERSION } from "./schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NavigationKind =
  | "global-header"
  | "mobile-drawer"
  | "mobile-tab-bar"
  | "mega-menu"
  | "footer-nav"
  | "footer-legal"
  | "footer-social"
  | "footer-brand"
  | "skip-link"
  | "breadcrumb"
  | "in-page-toc"
  | "back-action"
  | "cancel-action"
  | "recovery-action"
  | "auth-flow"
  | "cta-block"
  | "contextual-nav";

export type NavItemStatus = "active" | "redirected" | "missing-route" | "external" | "runtime-only";

export interface NavItemRecord {
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
    readonly navigationKind: NavigationKind;
    readonly label: string;
    readonly href: string;
    readonly isActive: string;
    readonly hasMegaMenu: boolean;
    readonly position: number;
    readonly group: string;
    readonly accessContextRequired: string | null;
    readonly navItemStatus: NavItemStatus;
    readonly defectReason: string | null;
    readonly accessibleName: string;
    readonly icon: string | null;
  };
  readonly coverageGapIds: readonly string[];
}

function sha256Short(...parts: string[]): string {
  return createHash("sha256").update(parts.join("\0")).digest("hex").slice(0, 16);
}

function stableInventoryId(kind: NavigationKind, sourceLocator: string, label: string, position: number): string {
  return `inv.nav.${sha256Short(kind, sourceLocator, label, String(position))}`;
}

function makeNavRecord(
  navKind: NavigationKind,
  label: string,
  href: string,
  sourceLocator: string,
  surface: string,
  group: string,
  position: number,
  options: {
    hasMegaMenu?: boolean;
    accessContextRequired?: string | null;
    navItemStatus?: NavItemStatus;
    defectReason?: string | null;
    accessibleName?: string;
    icon?: string | null;
  },
  discoveredAt: string,
): NavItemRecord {
  const inventoryId = stableInventoryId(navKind, sourceLocator, label, position);
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "specialized-inventory",
    recordId: `record.${inventoryId}`,
    createdAt: discoveredAt,
    inventoryId,
    inventoryKind: "link",
    owner: surface === "shared-shell" ? "site-navigation" : surface,
    sourceLocator,
    productSurface: surface,
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
      accessContextIds: options.accessContextRequired
        ? [options.accessContextRequired]
        : [],
      languageIds: [],
    },
    status: "canonical",
    payload: {
      navigationKind: navKind,
      label,
      href,
      isActive: "runtime-dependent",
      hasMegaMenu: options.hasMegaMenu ?? false,
      position,
      group,
      accessContextRequired: options.accessContextRequired ?? null,
      navItemStatus: options.navItemStatus ?? "active",
      defectReason: options.defectReason ?? null,
      accessibleName: options.accessibleName ?? label,
      icon: options.icon ?? null,
    },
    coverageGapIds: [],
  };
}

// ---------------------------------------------------------------------------
// Navigation inventory builder
// ---------------------------------------------------------------------------

export function buildNavigationInventory(discoveredAt: string): readonly NavItemRecord[] {
  const records: NavItemRecord[] = [];

  // -------------------------------------------------------------------------
  // 1. Global header primary navigation (SITE_NAV_LINKS)
  // -------------------------------------------------------------------------
  const headerPrimaryNav = [
    { label: "Products", href: "/products", hasMegaMenu: true },
    { label: "Solutions", href: "/solutions" },
    { label: "Clients", href: "/clients" },
    { label: "Planner", href: "/planner" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  headerPrimaryNav.forEach((item, idx) => {
    records.push(makeNavRecord(
      "global-header",
      item.label,
      item.href,
      "site/features/site/data/navigation.ts#SITE_NAV_LINKS",
      "shared-shell",
      "header-primary",
      idx + 1,
      { hasMegaMenu: item.hasMegaMenu ?? false },
      discoveredAt,
    ));
  });

  // -------------------------------------------------------------------------
  // 2. Header CTA links
  // -------------------------------------------------------------------------
  const headerCTAs = [
    { label: "Get Quote", href: "/contact" },
    { label: "View Products", href: "/products" },
  ];

  headerCTAs.forEach((item, idx) => {
    records.push(makeNavRecord(
      "global-header",
      item.label,
      item.href,
      "site/features/site/data/navigation.ts#SITE_CTA_LINKS",
      "shared-shell",
      "header-cta",
      idx + 1,
      {},
      discoveredAt,
    ));
  });

  // -------------------------------------------------------------------------
  // 3. Auth link
  // -------------------------------------------------------------------------
  records.push(makeNavRecord(
    "auth-flow",
    "Sign in",
    "/access",
    "site/features/site/data/navigation.ts#SITE_AUTH_LINK",
    "authentication",
    "header-auth",
    1,
    { accessContextRequired: null, accessibleName: "Sign in to your account" },
    discoveredAt,
  ));

  // -------------------------------------------------------------------------
  // 4. Mobile tab bar (MOBILE_TABS)
  // -------------------------------------------------------------------------
  const mobileTabs = [
    { label: "Home", href: "/", icon: "House" },
    { label: "Catalog", href: "/products", icon: "SquaresFour" },
    { label: "Planner", href: "/ooplanner", icon: "PencilSimple" },
    { label: "About Us", href: "/about", icon: "Buildings" },
    { label: "Account", href: "/access", icon: "UserCircle" },
  ];

  mobileTabs.forEach((tab, idx) => {
    records.push(makeNavRecord(
      "mobile-tab-bar",
      tab.label,
      tab.href,
      "site/features/site/data/navigation.ts#MOBILE_TABS",
      "shared-shell",
      "mobile-tabs",
      idx + 1,
      { icon: tab.icon, accessibleName: tab.label },
      discoveredAt,
    ));
  });

  // -------------------------------------------------------------------------
  // 5. Mega menu — product categories
  // -------------------------------------------------------------------------
  const megaMenuCategories = [
    { label: "Seating", href: "/products/seating" },
    { label: "Workstations", href: "/products/workstations" },
    { label: "Tables", href: "/products/tables" },
    { label: "Storages", href: "/products/storages" },
    { label: "Soft Seating", href: "/products/soft-seating" },
    { label: "Education", href: "/products/education" },
  ];

  megaMenuCategories.forEach((item, idx) => {
    records.push(makeNavRecord(
      "mega-menu",
      item.label,
      item.href,
      "site/components/site/Header.tsx#HeaderProductsMegaMenu",
      "catalog-configurator",
      "mega-menu-categories",
      idx + 1,
      {},
      discoveredAt,
    ));
  });

  // Mega menu featured cards
  const megaFeatured = [
    { label: "Ergonomic Seating", href: "/products/seating" },
    { label: "Modular Workstations", href: "/products/workstations" },
    { label: "Need Help Choosing?", href: "/products" },
  ];

  megaFeatured.forEach((item, idx) => {
    records.push(makeNavRecord(
      "mega-menu",
      item.label,
      item.href,
      "site/features/site/data/navigation.ts#SITE_NAV_FEATURED_CARDS",
      "catalog-configurator",
      "mega-menu-featured",
      idx + 1,
      {},
      discoveredAt,
    ));
  });

  // -------------------------------------------------------------------------
  // 6. Footer navigation columns
  // -------------------------------------------------------------------------
  const footerProductLinks = [
    { label: "All Products", href: "/products" },
    { label: "Solutions", href: "/solutions" },
    { label: "Clients", href: "/clients" },
    { label: "Planner", href: "/planner" },
    { label: "Planner help", href: "/planner/help" },
    { label: "Member dashboard", href: "/dashboard" },
  ];

  footerProductLinks.forEach((item, idx) => {
    records.push(makeNavRecord(
      "footer-nav",
      item.label,
      item.href,
      "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Products",
      "shared-shell",
      "footer-products",
      idx + 1,
      {
        accessContextRequired:
          item.href === "/dashboard" ? "access.authenticated-customer" : null,
      },
      discoveredAt,
    ));
  });

  const footerCompanyLinks = [
    { label: "About Us", href: "/about" },
    { label: "Trusted By", href: "/trusted-by" },
    { label: "Sustainability", href: "/sustainability" },
    { label: "Showrooms", href: "/showrooms" },
    { label: "Careers", href: "/career" },
  ];

  footerCompanyLinks.forEach((item, idx) => {
    records.push(makeNavRecord(
      "footer-nav",
      item.label,
      item.href,
      "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Company",
      "shared-shell",
      "footer-company",
      idx + 1,
      {},
      discoveredAt,
    ));
  });

  const footerServiceLinks = [
    { label: "Contact", href: "/contact" },
    { label: "After Sales", href: "/service" },
    { label: "Downloads", href: "/downloads" },
  ];

  footerServiceLinks.forEach((item, idx) => {
    records.push(makeNavRecord(
      "footer-nav",
      item.label,
      item.href,
      "site/components/site/Footer.tsx#SITE_FOOTER_NAV.Services",
      "shared-shell",
      "footer-services",
      idx + 1,
      {},
      discoveredAt,
    ));
  });

  // -------------------------------------------------------------------------
  // 7. Footer legal links
  // -------------------------------------------------------------------------
  const footerLegalLinks = [
    { label: "Refund Policy", href: "/refund-and-return-policy" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Sitemap", href: "/sitemap" },
  ];

  footerLegalLinks.forEach((item, idx) => {
    records.push(makeNavRecord(
      "footer-legal",
      item.label,
      item.href,
      "site/components/site/Footer.tsx#footer-legal",
      "legal",
      "footer-legal",
      idx + 1,
      {},
      discoveredAt,
    ));
  });

  // -------------------------------------------------------------------------
  // 8. Footer social links (external)
  // -------------------------------------------------------------------------
  const socialLinks = [
    { label: "YouTube", href: "https://www.youtube.com/channel/UCehXuPNAXkyfODPCwyAU1gQ" },
    { label: "Facebook", href: "https://www.facebook.com/oandofurniture" },
  ];

  socialLinks.forEach((item, idx) => {
    records.push(makeNavRecord(
      "footer-social",
      item.label,
      item.href,
      "site/features/site/data/contact.ts#SITE_CONTACT.socialLinks",
      "shared-shell",
      "footer-social",
      idx + 1,
      { navItemStatus: "external", accessibleName: `${item.label} (opens in new tab)` },
      discoveredAt,
    ));
  });

  // -------------------------------------------------------------------------
  // 9. Footer brand logo (home link)
  // -------------------------------------------------------------------------
  records.push(makeNavRecord(
    "footer-brand",
    "One&Only Home",
    "/",
    "site/components/site/Footer.tsx#brand-logo",
    "shared-shell",
    "footer-brand",
    1,
    { accessibleName: "One and Only — return to homepage" },
    discoveredAt,
  ));

  // -------------------------------------------------------------------------
  // 10. Error recovery actions (SiteErrorBoundary)
  // -------------------------------------------------------------------------
  records.push(makeNavRecord(
    "recovery-action",
    "Reload Page",
    "javascript:reload",
    "site/components/site/SiteErrorBoundary.tsx#handleReload",
    "shared-shell",
    "error-boundary",
    1,
    {
      navItemStatus: "runtime-only",
      defectReason: null,
      accessibleName: "Reload the current page",
    },
    discoveredAt,
  ));

  records.push(makeNavRecord(
    "recovery-action",
    "Go to Homepage",
    "/",
    "site/components/site/SiteErrorBoundary.tsx#handleGoHome",
    "shared-shell",
    "error-boundary",
    2,
    { accessibleName: "Navigate to the homepage after an error" },
    discoveredAt,
  ));

  // -------------------------------------------------------------------------
  // 11. Quote cart chrome — back/continue actions
  // -------------------------------------------------------------------------
  records.push(makeNavRecord(
    "back-action",
    "Continue Shopping",
    "/products",
    "site/components/site/QuoteCartChrome.tsx#back-to-products",
    "catalog-configurator",
    "quote-cart-chrome",
    1,
    { accessibleName: "Continue browsing products" },
    discoveredAt,
  ));

  // -------------------------------------------------------------------------
  // 12. Contextual navigation — Choose product (entry to planner/configurator)
  // -------------------------------------------------------------------------
  records.push(makeNavRecord(
    "contextual-nav",
    "Guest Planner Entry",
    "/choose-product?mode=guest",
    "site/features/site/data/productSuite.ts#PRODUCT_SUITE.planner.routes.guestChooser",
    "catalog-configurator",
    "planner-entry",
    1,
    { accessibleName: "Start planning as a guest" },
    discoveredAt,
  ));

  // -------------------------------------------------------------------------
  // 13. Mobile drawer links (same as primary + more options)
  // -------------------------------------------------------------------------
  const mobileDrawerLinks = [
    { label: "Products", href: "/products" },
    { label: "Solutions", href: "/solutions" },
    { label: "Clients", href: "/clients" },
    { label: "Planner", href: "/planner" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Showrooms", href: "/showrooms" },
    { label: "Downloads", href: "/downloads" },
    { label: "Sign in", href: "/access" },
  ];

  mobileDrawerLinks.forEach((item, idx) => {
    records.push(makeNavRecord(
      "mobile-drawer",
      item.label,
      item.href,
      "site/components/site/MobileNavDrawer.tsx#drawer-links",
      "shared-shell",
      "mobile-drawer",
      idx + 1,
      {},
      discoveredAt,
    ));
  });

  return Object.freeze(records);
}
