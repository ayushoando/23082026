/**
 * Wave 1 — Task 2.1: Foundational journey graph inventory.
 *
 * Extracts Primary Journey graph edges — entry points, primary actions,
 * terminal outcomes, form submission flows, auth/redirect flows, and
 * back/cancel/recovery paths.
 *
 * Every journey terminates in a documented outcome or explicit Coverage Gap.
 * Surface-crossing edges record destination, context-transfer contract, and
 * ownership. Access-context boundary crossings record authentication,
 * authorization, return path, and preserved context.
 *
 * Requirements: 6.1-6.7, 20.1-20.4
 */

import { createHash } from "node:crypto";
import { AUDIT_SCHEMA_VERSION } from "./schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JourneyNodeKind =
  | "entry"
  | "action"
  | "decision"
  | "terminal-success"
  | "terminal-failure"
  | "redirect"
  | "auth-gate"
  | "surface-crossing"
  | "recovery";

export type JourneyEdgeKind =
  | "navigation"
  | "form-submit"
  | "auth-redirect"
  | "cancel"
  | "back"
  | "recovery"
  | "conditional"
  | "surface-cross";

export type JourneyResultStatus =
  | "mapped"
  | "coverage-gap"
  | "requires-owner-decision";

export interface JourneyNode {
  readonly nodeId: string;
  readonly kind: JourneyNodeKind;
  readonly label: string;
  readonly route: string;
  readonly surface: string;
  readonly accessContextRequired: string | null;
  readonly description: string;
}

export interface JourneyEdge {
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly edgeKind: JourneyEdgeKind;
  readonly label: string;
  readonly trigger: string;
  readonly authRequired: boolean;
  readonly accessBoundary: string | null;
  readonly surfaceBoundary: string | null;
  readonly preservedContext: string | null;
  readonly returnPath: string | null;
}

export interface JourneyRecord {
  readonly schemaVersion: typeof AUDIT_SCHEMA_VERSION;
  readonly recordType: "specialized-inventory";
  readonly recordId: string;
  readonly createdAt: string;
  readonly inventoryId: string;
  readonly inventoryKind: "journey";
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
    readonly journeyId: string;
    readonly journeyName: string;
    readonly primaryJourney: boolean;
    readonly entryRoute: string;
    readonly terminalRoute: string | null;
    readonly terminalOutcome: string;
    readonly resultStatus: JourneyResultStatus;
    readonly nodes: readonly JourneyNode[];
    readonly edges: readonly JourneyEdge[];
    readonly requiresRuntime: boolean;
    readonly coverageGapReason: string | null;
    readonly surfacesTraversed: readonly string[];
    readonly accessContextsRequired: readonly string[];
  };
  readonly coverageGapIds: readonly string[];
}

function sha256Short(...parts: string[]): string {
  return createHash("sha256").update(parts.join("\0")).digest("hex").slice(0, 16);
}

function journeyId(name: string): string {
  return `journey.${sha256Short(name)}`;
}

function nodeId(route: string, kind: JourneyNodeKind, label: string): string {
  return `node.${sha256Short(route, kind, label)}`;
}

function makeNode(
  kind: JourneyNodeKind,
  label: string,
  route: string,
  surface: string,
  description: string,
  accessContextRequired: string | null = null,
): JourneyNode {
  return {
    nodeId: nodeId(route, kind, label),
    kind,
    label,
    route,
    surface,
    accessContextRequired,
    description,
  };
}

function makeEdge(
  fromNodeId: string,
  toNodeId: string,
  edgeKind: JourneyEdgeKind,
  label: string,
  trigger: string,
  options: {
    authRequired?: boolean;
    accessBoundary?: string | null;
    surfaceBoundary?: string | null;
    preservedContext?: string | null;
    returnPath?: string | null;
  } = {},
): JourneyEdge {
  return {
    fromNodeId,
    toNodeId,
    edgeKind,
    label,
    trigger,
    authRequired: options.authRequired ?? false,
    accessBoundary: options.accessBoundary ?? null,
    surfaceBoundary: options.surfaceBoundary ?? null,
    preservedContext: options.preservedContext ?? null,
    returnPath: options.returnPath ?? null,
  };
}

function makeJourneyRecord(
  journeyName: string,
  primaryJourney: boolean,
  entryRoute: string,
  terminalRoute: string | null,
  terminalOutcome: string,
  sourceLocator: string,
  surface: string,
  nodes: readonly JourneyNode[],
  edges: readonly JourneyEdge[],
  options: {
    resultStatus?: JourneyResultStatus;
    requiresRuntime?: boolean;
    coverageGapReason?: string | null;
    surfacesTraversed?: readonly string[];
    accessContextsRequired?: readonly string[];
    subjectIds?: readonly string[];
    accessContextIds?: readonly string[];
  },
  discoveredAt: string,
): JourneyRecord {
  const jId = journeyId(journeyName);
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "specialized-inventory",
    recordId: `record.${jId}`,
    createdAt: discoveredAt,
    inventoryId: jId,
    inventoryKind: "journey",
    owner: surface,
    sourceLocator,
    productSurface: surface,
    provenance: [{
      sourceId: "source.route-contracts",
      sourceKind: "contract",
      location: sourceLocator,
      discoveredAt,
      authorityRank: 40,
    }],
    applicableOccurrenceSelector: {
      subjectIds: options.subjectIds ?? [],
      stateIds: [],
      viewportIds: [],
      browserIds: [],
      accessContextIds: options.accessContextIds ?? [],
      languageIds: [],
    },
    status: "canonical",
    payload: {
      journeyId: jId,
      journeyName,
      primaryJourney,
      entryRoute,
      terminalRoute,
      terminalOutcome,
      resultStatus: options.resultStatus ?? "mapped",
      nodes,
      edges,
      requiresRuntime: options.requiresRuntime ?? false,
      coverageGapReason: options.coverageGapReason ?? null,
      surfacesTraversed: options.surfacesTraversed ?? [surface],
      accessContextsRequired: options.accessContextsRequired ?? ["access.public-guest"],
    },
    coverageGapIds: options.coverageGapReason ? [`gap.journey.${jId}`] : [],
  };
}

// ---------------------------------------------------------------------------
// Journey inventory builder
// ---------------------------------------------------------------------------

export function buildJourneyInventory(discoveredAt: string): readonly JourneyRecord[] {
  const records: JourneyRecord[] = [];

  // =========================================================================
  // 1. Browse Products Journey (Primary)
  // =========================================================================
  {
    const n1 = makeNode("entry", "Homepage", "/", "marketing", "User arrives at the homepage.");
    const n2 = makeNode("action", "Products Nav Click", "/products", "catalog-configurator", "User clicks Products in the header nav.");
    const n3 = makeNode("action", "Category Browse", "/products/[category]", "catalog-configurator", "User selects a product category.");
    const n4 = makeNode("action", "Product Detail View", "/products/[category]/[product]", "catalog-configurator", "User opens a product detail page.");
    const n5 = makeNode("terminal-success", "Add to Quote Cart", "/quote-cart", "catalog-configurator", "User adds a product to the quote cart.");

    const nodes = [n1, n2, n3, n4, n5];
    const edges = [
      makeEdge(n1.nodeId, n2.nodeId, "navigation", "Products nav click", "Click header nav 'Products'"),
      makeEdge(n2.nodeId, n3.nodeId, "navigation", "Category selection", "Click category card or mega menu item"),
      makeEdge(n3.nodeId, n4.nodeId, "navigation", "Product selection", "Click product card"),
      makeEdge(n4.nodeId, n5.nodeId, "navigation", "Add to quote cart", "Click 'Add to cart' or 'Get Quote'"),
    ];

    records.push(makeJourneyRecord(
      "Browse Products",
      true,
      "/",
      "/quote-cart",
      "User has added desired products to the quote cart.",
      "site/features/site/data/routeClassification.ts",
      "catalog-configurator",
      nodes,
      edges,
      {
        surfacesTraversed: ["marketing", "catalog-configurator"],
        accessContextsRequired: ["access.public-guest"],
        requiresRuntime: false,
      },
      discoveredAt,
    ));
  }

  // =========================================================================
  // 2. Configure and Request Quote Journey (Primary)
  // =========================================================================
  {
    const n1 = makeNode("entry", "Products Catalog", "/products", "catalog-configurator", "User is in the catalog.");
    const n2 = makeNode("action", "Product Detail", "/products/[category]/[product]", "catalog-configurator", "User views product detail.");
    const n3 = makeNode("action", "Add to Quote", "/quote-cart", "catalog-configurator", "User adds product to quote cart.");
    const n4 = makeNode("action", "View Cart", "/quote-cart", "catalog-configurator", "User reviews quote cart contents.");
    const n5 = makeNode("action", "Contact Form", "/contact", "marketing", "User navigates to contact to submit quote.");
    const n6 = makeNode("terminal-success", "Quote Submitted", "/contact", "marketing", "User submits the enquiry/quote form.");

    const nodes = [n1, n2, n3, n4, n5, n6];
    const edges = [
      makeEdge(n1.nodeId, n2.nodeId, "navigation", "Product detail", "Click product card"),
      makeEdge(n2.nodeId, n3.nodeId, "navigation", "Add to quote cart", "Click 'Get Quote'"),
      makeEdge(n3.nodeId, n4.nodeId, "navigation", "View cart", "Click cart icon or banner"),
      makeEdge(n4.nodeId, n5.nodeId, "navigation", "Proceed to contact", "Click 'Request Quote' or 'Contact'", { surfaceBoundary: "catalog-configurator→marketing" }),
      makeEdge(n5.nodeId, n6.nodeId, "form-submit", "Submit enquiry", "Submit contact form"),
    ];

    records.push(makeJourneyRecord(
      "Configure and Request Quote",
      true,
      "/products",
      "/contact",
      "User has submitted a quote enquiry. They will receive a sales follow-up.",
      "site/features/site/data/routeClassification.ts",
      "catalog-configurator",
      nodes,
      edges,
      {
        surfacesTraversed: ["catalog-configurator", "marketing"],
        accessContextsRequired: ["access.public-guest"],
        requiresRuntime: true,
      },
      discoveredAt,
    ));
  }

  // =========================================================================
  // 3. Authentication Journey (Primary)
  // =========================================================================
  {
    const n1 = makeNode("entry", "Login/Access Page", "/access", "authentication", "User arrives at the sign-in page.");
    const n2 = makeNode("action", "Submit Credentials", "/access", "authentication", "User submits email/password or OTP.");
    const n3 = makeNode("decision", "Auth Success?", "/access", "authentication", "Server validates credentials.");
    const n4 = makeNode("terminal-success", "Portal/Dashboard Redirect", "/portal", "portal-dashboard", "User is redirected to portal or return-to URL after successful auth.", "access.authenticated-customer");
    const n5 = makeNode("terminal-failure", "Auth Error", "/access", "authentication", "Authentication failed — invalid credentials or server error.");
    const n6 = makeNode("recovery", "Retry Sign-in", "/access", "authentication", "User corrects credentials and retries.");

    const nodes = [n1, n2, n3, n4, n5, n6];
    const edges = [
      makeEdge(n1.nodeId, n2.nodeId, "form-submit", "Submit credentials", "Submit sign-in form"),
      makeEdge(n2.nodeId, n3.nodeId, "conditional", "Validate credentials", "Server-side auth validation"),
      makeEdge(n3.nodeId, n4.nodeId, "auth-redirect", "Auth success redirect", "Redirect to return-to URL or /portal", {
        authRequired: true,
        accessBoundary: "public-guest→authenticated-customer",
        surfaceBoundary: "authentication→portal-dashboard",
        preservedContext: "return-to URL from query param",
        returnPath: "/portal",
      }),
      makeEdge(n3.nodeId, n5.nodeId, "conditional", "Auth failure", "Server returns 401 or error"),
      makeEdge(n5.nodeId, n6.nodeId, "recovery", "Retry", "User corrects and resubmits"),
      makeEdge(n6.nodeId, n2.nodeId, "form-submit", "Re-submit credentials", "User retries sign-in"),
    ];

    records.push(makeJourneyRecord(
      "Authentication",
      true,
      "/access",
      "/portal",
      "User is authenticated and redirected to their portal dashboard.",
      "site/app/(site)/access/page.tsx",
      "authentication",
      nodes,
      edges,
      {
        surfacesTraversed: ["authentication", "portal-dashboard"],
        accessContextsRequired: ["access.public-guest"],
        requiresRuntime: true,
      },
      discoveredAt,
    ));
  }

  // =========================================================================
  // 4. Use the Planner Journey (Primary)
  // =========================================================================
  {
    const n1 = makeNode("entry", "Planner Marketing Page", "/planner", "marketing", "User lands on the Planner marketing page.");
    const n2 = makeNode("action", "Choose Entry Mode", "/choose-product", "catalog-configurator", "User selects guest or authenticated planner entry.");
    const n3 = makeNode("action", "Open Planner Canvas", "/ooplanner", "planner", "User accesses the Planner canvas.");
    const n4 = makeNode("action", "Design Floor Plan", "/ooplanner", "planner", "User creates/edits the floor plan.");
    const n5 = makeNode("terminal-success", "Export/Share", "/ooplanner", "planner", "User exports or shares the plan.", "access.planner-member");
    const n6 = makeNode("terminal-success", "Save Plan", "/ooplanner/projects", "planner", "User saves the plan to their projects.", "access.planner-member");

    const nodes = [n1, n2, n3, n4, n5, n6];
    const edges = [
      makeEdge(n1.nodeId, n2.nodeId, "navigation", "Start Planner", "Click 'Start Planning' or 'Open Planner'"),
      makeEdge(n2.nodeId, n3.nodeId, "navigation", "Guest entry", "Select guest mode → /ooplanner", {
        surfaceBoundary: "marketing→planner",
        accessBoundary: "public-guest→planner-entry",
      }),
      makeEdge(n3.nodeId, n4.nodeId, "navigation", "Use canvas", "Interact with canvas"),
      makeEdge(n4.nodeId, n5.nodeId, "action", "Export plan", "Click export/share button", { requiresRuntime: true } as object),
      makeEdge(n4.nodeId, n6.nodeId, "auth-redirect", "Save plan", "Save requires authentication", {
        authRequired: true,
        accessBoundary: "public-guest→planner-member",
        returnPath: "/ooplanner",
      }),
    ];

    records.push(makeJourneyRecord(
      "Use the Planner",
      true,
      "/planner",
      "/ooplanner",
      "User has created or edited a floor plan and exported or saved it.",
      "site/features/site/data/routeClassification.ts",
      "planner",
      nodes,
      edges,
      {
        surfacesTraversed: ["marketing", "catalog-configurator", "planner"],
        accessContextsRequired: ["access.public-guest", "access.planner-member"],
        requiresRuntime: true,
        resultStatus: "coverage-gap",
        coverageGapReason: "Planner canvas actions (design, export, save) require runtime browser execution for full journey verification. Static source confirms entry and navigation edges only.",
      },
      discoveredAt,
    ));
  }

  // =========================================================================
  // 5. Client Portal Journey (Primary)
  // =========================================================================
  {
    const n1 = makeNode("entry", "Portal", "/portal", "portal-dashboard", "Authenticated customer accesses their portal.", "access.authenticated-customer");
    const n2 = makeNode("action", "View Project", "/portal/[id]", "portal-dashboard", "Customer opens a specific project.", "access.authenticated-customer");
    const n3 = makeNode("action", "Review Plan", "/portal/[id]", "portal-dashboard", "Customer reviews the floor plan in their portal workspace.", "access.authenticated-customer");
    const n4 = makeNode("terminal-success", "Approve or Comment", "/portal/[id]", "portal-dashboard", "Customer approves or comments on the plan.", "access.authenticated-customer");

    const nodes = [n1, n2, n3, n4];
    const edges = [
      makeEdge(n1.nodeId, n2.nodeId, "navigation", "Open project", "Click project card"),
      makeEdge(n2.nodeId, n3.nodeId, "navigation", "Review plan", "View embedded plan"),
      makeEdge(n3.nodeId, n4.nodeId, "action", "Approve/comment", "Submit feedback"),
    ];

    records.push(makeJourneyRecord(
      "Client Portal",
      true,
      "/portal",
      "/portal/[id]",
      "Customer has reviewed and provided feedback on their project plan.",
      "site/app/(site)/portal/layout.tsx",
      "portal-dashboard",
      nodes,
      edges,
      {
        surfacesTraversed: ["portal-dashboard"],
        accessContextsRequired: ["access.authenticated-customer"],
        requiresRuntime: true,
        resultStatus: "coverage-gap",
        coverageGapReason: "Portal project IDs require authenticated database access to enumerate. Runtime verification is required for complete portal journey validation.",
      },
      discoveredAt,
    ));
  }

  // =========================================================================
  // 6. Marketing to Catalog Navigation (foundational edge)
  // =========================================================================
  {
    const n1 = makeNode("entry", "Homepage", "/", "marketing", "User on the homepage.");
    const n2 = makeNode("action", "Hero CTA or Nav", "/products", "catalog-configurator", "User clicks a primary CTA or nav item to enter the catalog.");

    const nodes = [n1, n2];
    const edges = [
      makeEdge(n1.nodeId, n2.nodeId, "surface-cross", "Enter catalog", "Click 'View Products' or Products nav", {
        surfaceBoundary: "marketing→catalog-configurator",
        preservedContext: "None — fresh catalog entry",
      }),
    ];

    records.push(makeJourneyRecord(
      "Marketing to Catalog",
      false,
      "/",
      "/products",
      "User enters the catalog from marketing.",
      "site/features/site/data/navigation.ts#SITE_NAV_LINKS",
      "marketing",
      nodes,
      edges,
      {
        surfacesTraversed: ["marketing", "catalog-configurator"],
        accessContextsRequired: ["access.public-guest"],
      },
      discoveredAt,
    ));
  }

  // =========================================================================
  // 7. Session Expiry Recovery Journey
  // =========================================================================
  {
    const n1 = makeNode("entry", "Protected Route", "/portal", "portal-dashboard", "User attempts to access a protected route.", "access.authenticated-customer");
    const n2 = makeNode("auth-gate", "Session Expired Gate", "/access", "authentication", "Session check fails — user is redirected to /access with return path.");
    const n3 = makeNode("action", "Re-authenticate", "/access", "authentication", "User re-enters credentials.");
    const n4 = makeNode("terminal-success", "Return to Protected Route", "/portal", "portal-dashboard", "User is redirected back to the original protected route.", "access.authenticated-customer");

    const nodes = [n1, n2, n3, n4];
    const edges = [
      makeEdge(n1.nodeId, n2.nodeId, "auth-redirect", "Session expiry redirect", "Server detects expired session", {
        authRequired: true,
        accessBoundary: "authenticated→expired",
        surfaceBoundary: "portal-dashboard→authentication",
        preservedContext: "return-to URL preserved as query param",
        returnPath: "/access?returnTo=/portal",
      }),
      makeEdge(n2.nodeId, n3.nodeId, "form-submit", "Re-authenticate", "User submits credentials on /access"),
      makeEdge(n3.nodeId, n4.nodeId, "auth-redirect", "Restore session", "Redirect to return-to URL", {
        authRequired: true,
        accessBoundary: "expired→re-authenticated",
        preservedContext: "return-to URL from query param",
      }),
    ];

    records.push(makeJourneyRecord(
      "Session Expiry Recovery",
      false,
      "/portal",
      "/portal",
      "User re-authenticates and returns to their protected route with session restored.",
      "site/app/(site)/access/page.tsx",
      "authentication",
      nodes,
      edges,
      {
        surfacesTraversed: ["portal-dashboard", "authentication"],
        accessContextsRequired: ["access.authenticated-customer"],
        requiresRuntime: true,
      },
      discoveredAt,
    ));
  }

  // =========================================================================
  // 8. Contact Form Journey
  // =========================================================================
  {
    const n1 = makeNode("entry", "Contact Page", "/contact", "marketing", "User navigates to the contact page.");
    const n2 = makeNode("action", "Fill Contact Form", "/contact", "marketing", "User completes the enquiry form fields.");
    const n3 = makeNode("action", "Submit Form", "/contact", "marketing", "User submits the form.");
    const n4 = makeNode("decision", "Validation", "/contact", "marketing", "Client-side and server-side validation.");
    const n5 = makeNode("terminal-success", "Success Message", "/contact", "marketing", "Form submitted successfully — confirmation displayed.");
    const n6 = makeNode("terminal-failure", "Validation Error", "/contact", "marketing", "Form has validation errors — user must correct and resubmit.");

    const nodes = [n1, n2, n3, n4, n5, n6];
    const edges = [
      makeEdge(n1.nodeId, n2.nodeId, "navigation", "Fill form", "User enters fields"),
      makeEdge(n2.nodeId, n3.nodeId, "form-submit", "Submit", "Click submit button"),
      makeEdge(n3.nodeId, n4.nodeId, "conditional", "Validate", "Client-side pre-submission validation"),
      makeEdge(n4.nodeId, n5.nodeId, "conditional", "Validation passes", "Submit to API"),
      makeEdge(n4.nodeId, n6.nodeId, "conditional", "Validation fails", "Show field errors, preserve input"),
      makeEdge(n6.nodeId, n2.nodeId, "recovery", "Correct and retry", "User corrects errors"),
    ];

    records.push(makeJourneyRecord(
      "Contact Form Submission",
      true,
      "/contact",
      "/contact",
      "User has submitted an enquiry. A confirmation message is displayed.",
      "site/app/(site)/contact/page.tsx",
      "marketing",
      nodes,
      edges,
      {
        surfacesTraversed: ["marketing"],
        accessContextsRequired: ["access.public-guest"],
        requiresRuntime: true,
      },
      discoveredAt,
    ));
  }

  // =========================================================================
  // 9. Guest Portal / Shared Plan Journey
  // =========================================================================
  {
    const n1 = makeNode("entry", "Guest Portal Entry", "/portal/guest", "portal-dashboard", "Guest user accesses a shared plan link.");
    const n2 = makeNode("action", "View Shared Plan", "/portal/guest/view/[id]", "portal-dashboard", "Guest views the shared plan.");
    const n3 = makeNode("terminal-success", "Plan Reviewed", "/portal/guest/view/[id]", "portal-dashboard", "Guest has reviewed the shared plan.");

    const nodes = [n1, n2, n3];
    const edges = [
      makeEdge(n1.nodeId, n2.nodeId, "navigation", "View plan", "Follow shared plan link"),
      makeEdge(n2.nodeId, n3.nodeId, "navigation", "Review plan", "View embedded plan"),
    ];

    records.push(makeJourneyRecord(
      "Guest Shared Plan View",
      false,
      "/portal/guest",
      "/portal/guest/view/[id]",
      "Guest has reviewed the shared plan.",
      "site/app/(site)/portal/guest/view/[id]/page.tsx",
      "portal-dashboard",
      nodes,
      edges,
      {
        surfacesTraversed: ["portal-dashboard"],
        accessContextsRequired: ["access.public-guest"],
        requiresRuntime: true,
        resultStatus: "coverage-gap",
        coverageGapReason: "Guest view IDs require shared-link tokens not available for static enumeration.",
      },
      discoveredAt,
    ));
  }

  return Object.freeze(records);
}
