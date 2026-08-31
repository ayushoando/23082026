/**
 * Wave 1 — Task 2.1: Static state inventory.
 *
 * Extracts source-visible state variants for routes and shells:
 *   - Loading states (loading.tsx files, skeleton components)
 *   - Error states (error.tsx, global-error.tsx, error boundaries)
 *   - Not-found states (not-found.tsx)
 *   - Empty states (source-visible no-data messages)
 *   - Offline states (service worker, offline page)
 *   - Success states (confirmation messages)
 *   - Auth-required states (redirect-to-login patterns)
 *
 * Requirements: 7.1-7.7, 20.1-20.4
 */

import { createHash } from "node:crypto";
import { AUDIT_SCHEMA_VERSION } from "./schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StateVariantKind =
  | "loading"
  | "error"
  | "not-found"
  | "empty"
  | "offline"
  | "success"
  | "auth-required"
  | "forbidden"
  | "default"
  | "skeleton"
  | "pending"
  | "stale";

export type StateEvidenceKind =
  | "file-existence"
  | "component-usage"
  | "source-pattern"
  | "redirect-pattern"
  | "boundary-declaration";

export interface StateRecord {
  readonly schemaVersion: typeof AUDIT_SCHEMA_VERSION;
  readonly recordType: "specialized-inventory";
  readonly recordId: string;
  readonly createdAt: string;
  readonly inventoryId: string;
  readonly inventoryKind: "state";
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
    readonly stateVariantKind: StateVariantKind;
    readonly stateId: string;
    readonly routePattern: string;
    readonly description: string;
    readonly evidenceKind: StateEvidenceKind;
    readonly isRuntimeVerifiable: boolean;
    readonly recoveryAction: string | null;
    readonly recoveryTarget: string | null;
    readonly showsUserMessage: boolean;
    readonly userMessage: string | null;
    readonly hasRetryBehavior: boolean;
  };
  readonly coverageGapIds: readonly string[];
}

function sha256Short(...parts: string[]): string {
  return createHash("sha256").update(parts.join("\0")).digest("hex").slice(0, 16);
}

function stableInventoryId(stateKind: StateVariantKind, routePattern: string, sourceLocator: string): string {
  return `inv.state.${sha256Short(stateKind, routePattern, sourceLocator)}`;
}

function makeStateRecord(
  stateKind: StateVariantKind,
  routePattern: string,
  sourceLocator: string,
  surface: string,
  description: string,
  evidenceKind: StateEvidenceKind,
  options: {
    isRuntimeVerifiable?: boolean;
    recoveryAction?: string | null;
    recoveryTarget?: string | null;
    showsUserMessage?: boolean;
    userMessage?: string | null;
    hasRetryBehavior?: boolean;
    stateIdSuffix?: string;
    subjectIds?: readonly string[];
    accessContextIds?: readonly string[];
  },
  discoveredAt: string,
): StateRecord {
  const stateId = `state.${stateKind}${options.stateIdSuffix ? `.${options.stateIdSuffix}` : ""}`;
  const inventoryId = stableInventoryId(stateKind, routePattern, sourceLocator);
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "specialized-inventory",
    recordId: `record.${inventoryId}`,
    createdAt: discoveredAt,
    inventoryId,
    inventoryKind: "state",
    owner: surface,
    sourceLocator,
    productSurface: surface,
    provenance: [{
      sourceId: "source.app-router-tree",
      sourceKind: "source",
      location: sourceLocator,
      discoveredAt,
      authorityRank: 10,
    }],
    applicableOccurrenceSelector: {
      subjectIds: options.subjectIds ?? [],
      stateIds: [stateId],
      viewportIds: [],
      browserIds: [],
      accessContextIds: options.accessContextIds ?? [],
      languageIds: [],
    },
    status: "canonical",
    payload: {
      stateVariantKind: stateKind,
      stateId,
      routePattern,
      description,
      evidenceKind,
      isRuntimeVerifiable: options.isRuntimeVerifiable ?? true,
      recoveryAction: options.recoveryAction ?? null,
      recoveryTarget: options.recoveryTarget ?? null,
      showsUserMessage: options.showsUserMessage ?? false,
      userMessage: options.userMessage ?? null,
      hasRetryBehavior: options.hasRetryBehavior ?? false,
    },
    coverageGapIds: [],
  };
}

// ---------------------------------------------------------------------------
// State inventory builder
// ---------------------------------------------------------------------------

export function buildStateInventory(discoveredAt: string): readonly StateRecord[] {
  const records: StateRecord[] = [];

  // =========================================================================
  // 1. LOADING STATES (from loading.tsx files)
  // =========================================================================

  // Site root loading
  records.push(makeStateRecord(
    "loading",
    "/",
    "site/app/(site)/loading.tsx",
    "marketing",
    "Root site loading boundary. Shows skeleton or spinner while the (site) segment loads.",
    "file-existence",
    {
      isRuntimeVerifiable: true,
      recoveryAction: null,
      recoveryTarget: null,
      showsUserMessage: false,
      stateIdSuffix: "site-root",
    },
    discoveredAt,
  ));

  // Products loading
  records.push(makeStateRecord(
    "loading",
    "/products",
    "site/app/(site)/products/loading.tsx",
    "catalog-configurator",
    "Products section loading boundary. Shows while catalog data loads.",
    "file-existence",
    {
      isRuntimeVerifiable: true,
      recoveryAction: null,
      stateIdSuffix: "products",
    },
    discoveredAt,
  ));

  // Category loading
  records.push(makeStateRecord(
    "loading",
    "/products/[category]",
    "site/app/(site)/products/[category]/loading.tsx",
    "catalog-configurator",
    "Product category loading boundary. Shows skeleton while category products load.",
    "file-existence",
    {
      isRuntimeVerifiable: true,
      recoveryAction: null,
      stateIdSuffix: "product-category",
    },
    discoveredAt,
  ));

  // =========================================================================
  // 2. ERROR STATES (from error.tsx files and boundaries)
  // =========================================================================

  // Site root error
  records.push(makeStateRecord(
    "error",
    "/",
    "site/app/(site)/error.tsx",
    "marketing",
    "Root site error boundary. Catches unhandled errors in the (site) route segment.",
    "file-existence",
    {
      isRuntimeVerifiable: true,
      recoveryAction: "Reload Page",
      recoveryTarget: null,
      showsUserMessage: true,
      userMessage: "Something went wrong. Try reloading the page.",
      hasRetryBehavior: true,
      stateIdSuffix: "site-root",
    },
    discoveredAt,
  ));

  // Products error
  records.push(makeStateRecord(
    "error",
    "/products",
    "site/app/(site)/products/error.tsx",
    "catalog-configurator",
    "Products error boundary. Catches errors within the catalog section.",
    "file-existence",
    {
      isRuntimeVerifiable: true,
      recoveryAction: "Reload",
      hasRetryBehavior: true,
      stateIdSuffix: "products",
    },
    discoveredAt,
  ));

  // Global error (wraps root layout)
  records.push(makeStateRecord(
    "error",
    "*",
    "site/components/site/SiteErrorBoundary.tsx",
    "shared-shell",
    "Global React error boundary. Shows 'Something went wrong' with Reload and Go to Homepage buttons.",
    "component-usage",
    {
      isRuntimeVerifiable: true,
      recoveryAction: "Reload Page | Go to Homepage",
      recoveryTarget: "/",
      showsUserMessage: true,
      userMessage: "Our systems encountered an unexpected error while rendering this page. Don't worry, your progress and session details remain intact.",
      hasRetryBehavior: true,
      stateIdSuffix: "global-react",
    },
    discoveredAt,
  ));

  // =========================================================================
  // 3. NOT-FOUND STATES (from not-found.tsx files)
  // =========================================================================

  // Root not-found
  records.push(makeStateRecord(
    "not-found",
    "/_not-found",
    "site/app/not-found.tsx",
    "marketing",
    "Root 404 not-found page. Shown when no route matches the requested URL.",
    "file-existence",
    {
      isRuntimeVerifiable: true,
      recoveryAction: "Go to homepage",
      recoveryTarget: "/",
      showsUserMessage: true,
      userMessage: "Page not found.",
      stateIdSuffix: "root",
    },
    discoveredAt,
  ));

  // Site not-found
  records.push(makeStateRecord(
    "not-found",
    "/_not-found",
    "site/app/(site)/not-found.tsx",
    "marketing",
    "Site segment not-found boundary. Shown for marketing and catalog routes that do not exist.",
    "file-existence",
    {
      isRuntimeVerifiable: true,
      recoveryAction: "Go to homepage",
      recoveryTarget: "/",
      showsUserMessage: true,
      stateIdSuffix: "site",
    },
    discoveredAt,
  ));

  // =========================================================================
  // 4. OFFLINE STATES
  // =========================================================================

  // Offline page
  records.push(makeStateRecord(
    "offline",
    "/offline",
    "site/app/offline/page.tsx",
    "offline",
    "Service worker offline fallback page. Shown when the user is offline and the page is not cached.",
    "file-existence",
    {
      isRuntimeVerifiable: true,
      recoveryAction: "Retry when online",
      hasRetryBehavior: true,
      showsUserMessage: true,
      userMessage: "You're offline. Please check your connection.",
      stateIdSuffix: "service-worker",
    },
    discoveredAt,
  ));

  // =========================================================================
  // 5. AUTH-REQUIRED STATES
  // =========================================================================

  // Portal auth required
  records.push(makeStateRecord(
    "auth-required",
    "/portal",
    "site/app/(site)/portal/layout.tsx",
    "portal-dashboard",
    "Portal routes require authenticated session. Unauthenticated users are redirected to /access.",
    "boundary-declaration",
    {
      isRuntimeVerifiable: true,
      recoveryAction: "Sign in",
      recoveryTarget: "/access",
      showsUserMessage: true,
      userMessage: "Sign in to access your portal.",
      accessContextIds: ["access.public-guest"],
      stateIdSuffix: "portal",
    },
    discoveredAt,
  ));

  // Admin auth required
  records.push(makeStateRecord(
    "auth-required",
    "/admin",
    "site/app/admin/layout.tsx",
    "administration",
    "Admin routes require authenticated administrator session. Unauthenticated users are redirected.",
    "boundary-declaration",
    {
      isRuntimeVerifiable: true,
      recoveryAction: "Sign in",
      recoveryTarget: "/access",
      showsUserMessage: true,
      accessContextIds: ["access.public-guest", "access.authenticated-customer"],
      stateIdSuffix: "admin",
    },
    discoveredAt,
  ));

  // Dashboard auth required
  records.push(makeStateRecord(
    "auth-required",
    "/dashboard",
    "site/app/(site)/dashboard/layout.tsx",
    "portal-dashboard",
    "Dashboard requires authenticated customer session.",
    "boundary-declaration",
    {
      isRuntimeVerifiable: true,
      recoveryAction: "Sign in",
      recoveryTarget: "/access",
      accessContextIds: ["access.public-guest"],
      stateIdSuffix: "dashboard",
    },
    discoveredAt,
  ));

  // Planner projects auth required
  records.push(makeStateRecord(
    "auth-required",
    "/ooplanner/projects",
    "site/app/ooplanner/projects/page.tsx",
    "planner",
    "Planner projects list requires authenticated member session.",
    "boundary-declaration",
    {
      isRuntimeVerifiable: true,
      recoveryAction: "Sign in",
      recoveryTarget: "/access",
      accessContextIds: ["access.public-guest"],
      stateIdSuffix: "planner-projects",
    },
    discoveredAt,
  ));

  // =========================================================================
  // 6. EMPTY STATES (source-visible no-data patterns)
  // =========================================================================

  // Quote cart empty
  records.push(makeStateRecord(
    "empty",
    "/quote-cart",
    "site/app/(site)/quote-cart/page.tsx",
    "catalog-configurator",
    "Quote cart empty state. Shown when no items have been added to the cart.",
    "source-pattern",
    {
      isRuntimeVerifiable: true,
      recoveryAction: "Browse Products",
      recoveryTarget: "/products",
      showsUserMessage: true,
      userMessage: "Your quote cart is empty.",
      stateIdSuffix: "quote-cart",
    },
    discoveredAt,
  ));

  // Portal empty
  records.push(makeStateRecord(
    "empty",
    "/portal",
    "site/app/(site)/portal/page.tsx",
    "portal-dashboard",
    "Portal empty state. Shown when the authenticated user has no projects.",
    "source-pattern",
    {
      isRuntimeVerifiable: true,
      recoveryAction: "Create new plan",
      recoveryTarget: "/ooplanner",
      showsUserMessage: true,
      stateIdSuffix: "portal-no-projects",
    },
    discoveredAt,
  ));

  // Admin plans empty
  records.push(makeStateRecord(
    "empty",
    "/admin/plans",
    "site/app/admin/plans/page.tsx",
    "administration",
    "Admin plans list empty state.",
    "source-pattern",
    {
      isRuntimeVerifiable: true,
      stateIdSuffix: "admin-plans",
    },
    discoveredAt,
  ));

  // Compare page empty
  records.push(makeStateRecord(
    "empty",
    "/compare",
    "site/app/(site)/compare/page.tsx",
    "catalog-configurator",
    "Compare page empty state — no products selected for comparison yet.",
    "source-pattern",
    {
      isRuntimeVerifiable: true,
      recoveryAction: "Browse Products",
      recoveryTarget: "/products",
      showsUserMessage: true,
      userMessage: "No products selected for comparison.",
      stateIdSuffix: "compare-empty",
    },
    discoveredAt,
  ));

  // =========================================================================
  // 7. SUCCESS/CONFIRMATION STATES
  // =========================================================================

  // Contact form success
  records.push(makeStateRecord(
    "success",
    "/contact",
    "site/app/(site)/contact/page.tsx",
    "marketing",
    "Contact form submission success state. Shown after successful enquiry submission.",
    "source-pattern",
    {
      isRuntimeVerifiable: true,
      showsUserMessage: true,
      userMessage: "Your enquiry has been sent. We'll get back to you soon.",
      hasRetryBehavior: false,
      stateIdSuffix: "contact-submitted",
    },
    discoveredAt,
  ));

  // Access (login) success → redirect
  records.push(makeStateRecord(
    "success",
    "/access",
    "site/app/(site)/access/page.tsx",
    "authentication",
    "Authentication success state. After successful sign-in, user is redirected to portal/dashboard.",
    "redirect-pattern",
    {
      isRuntimeVerifiable: true,
      recoveryAction: null,
      recoveryTarget: "/portal",
      showsUserMessage: false,
      stateIdSuffix: "auth-success",
    },
    discoveredAt,
  ));

  // =========================================================================
  // 8. PENDING/LOADING STATES (UI-level from source patterns)
  // =========================================================================

  // Navigation transition
  records.push(makeStateRecord(
    "loading",
    "*",
    "site/components/site/Header.tsx#navigation-loading",
    "shared-shell",
    "Header navigation loading state during route transitions. Managed by Next.js router.",
    "component-usage",
    {
      isRuntimeVerifiable: true,
      stateIdSuffix: "navigation-transition",
    },
    discoveredAt,
  ));

  // Search panel loading
  records.push(makeStateRecord(
    "loading",
    "*",
    "site/components/site/Header.tsx#search-loading",
    "shared-shell",
    "Header search panel loading state. Shows spinner while search results are fetched.",
    "component-usage",
    {
      isRuntimeVerifiable: true,
      stateIdSuffix: "search-panel",
    },
    discoveredAt,
  ));

  // Maintenance banner
  records.push(makeStateRecord(
    "stale",
    "*",
    "site/components/site/MaintenanceBanner.tsx",
    "shared-shell",
    "Maintenance banner shell. Conditionally displayed across all marketing routes during maintenance periods.",
    "component-usage",
    {
      isRuntimeVerifiable: true,
      showsUserMessage: true,
      userMessage: "The site is currently undergoing maintenance. Some features may be unavailable.",
      stateIdSuffix: "maintenance-banner",
    },
    discoveredAt,
  ));

  // Consent undecided
  records.push(makeStateRecord(
    "pending",
    "*",
    "site/components/site/CookieConsentBar.tsx",
    "shared-shell",
    "Cookie/analytics consent bar. Shown when user has not yet made a consent decision.",
    "component-usage",
    {
      isRuntimeVerifiable: true,
      showsUserMessage: true,
      userMessage: "We use analytics cookies to improve your experience.",
      stateIdSuffix: "consent-undecided",
    },
    discoveredAt,
  ));

  return Object.freeze(records);
}
