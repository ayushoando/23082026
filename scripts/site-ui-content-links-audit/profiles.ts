/**
 * Task 1.5 — Profile registries, applicability decisions, and exact
 * occurrence expansion.
 *
 * Defines versioned viewport, browser/OS/AT, access, language, consent, and
 * performance profile registries; implements applicability rules for all State
 * Variants and audit dimensions; and generates the exact state × viewport ×
 * browser × access × language Cartesian product for each route, dynamic
 * instance, and shell WITHOUT representative substitution.
 *
 * Stable occurrence/finding IDs are SHA-256 fingerprints of all dimension
 * values. A `profileVersion` fingerprint in every record ensures profile
 * changes invalidate only dependent rows.
 *
 * This module is audit tooling only. It never modifies `site/**`.
 *
 * Requirements: 3.1-3.9, 7.1, 9.1-9.2, 17.3, 19.6-19.8, 22.8, 26.2
 */

import { createHash } from "node:crypto";

import {
  AUDIT_SCHEMA_VERSION,
} from "./schemas";
import {
  type DiscoveredRoute,
  type DiscoveredDynamicInstance,
  type DiscoveredShell,
  type ProductSurface,
} from "./discovery";

// ---------------------------------------------------------------------------
// Registry version constants
// ---------------------------------------------------------------------------

export const PROFILE_REGISTRY_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Viewport profiles  (Req 3.2, 9.1)
// ---------------------------------------------------------------------------

export interface ViewportProfile {
  readonly profileId: string;
  readonly label: string;
  readonly enabled: boolean;
  readonly width: number;
  readonly height: number;
  readonly orientation: "portrait" | "landscape";
  readonly devicePixelRatio: number;
  readonly inputMode: "mouse" | "touch" | "keyboard";
  readonly zoomLevel: number;
}

export const VIEWPORT_PROFILES: readonly ViewportProfile[] = [
  {
    profileId: "viewport.desktop-1440",
    label: "Desktop 1440 × 900",
    enabled: true,
    width: 1440,
    height: 900,
    orientation: "landscape",
    devicePixelRatio: 1,
    inputMode: "mouse",
    zoomLevel: 1,
  },
  {
    profileId: "viewport.desktop-1280",
    label: "Desktop 1280 × 800",
    enabled: true,
    width: 1280,
    height: 800,
    orientation: "landscape",
    devicePixelRatio: 1,
    inputMode: "mouse",
    zoomLevel: 1,
  },
  {
    profileId: "viewport.tablet-768",
    label: "Tablet 768 × 1024",
    enabled: true,
    width: 768,
    height: 1024,
    orientation: "portrait",
    devicePixelRatio: 2,
    inputMode: "touch",
    zoomLevel: 1,
  },
  {
    profileId: "viewport.mobile-390",
    label: "Mobile 390 × 844",
    enabled: true,
    width: 390,
    height: 844,
    orientation: "portrait",
    devicePixelRatio: 3,
    inputMode: "touch",
    zoomLevel: 1,
  },
  {
    profileId: "viewport.mobile-375",
    label: "Mobile 375 × 667",
    enabled: true,
    width: 375,
    height: 667,
    orientation: "portrait",
    devicePixelRatio: 2,
    inputMode: "touch",
    zoomLevel: 1,
  },
] as const;

// ---------------------------------------------------------------------------
// Browser profiles  (Req 3.3, 9.2)
// ---------------------------------------------------------------------------

export interface BrowserProfile {
  readonly profileId: string;
  readonly label: string;
  readonly enabled: boolean;
  readonly browserFamily: string;
  readonly browserVersion: string;
  readonly renderingEngine: string;
  readonly operatingSystem: string;
  readonly assistiveTechnology: string | null;
}

export const BROWSER_PROFILES: readonly BrowserProfile[] = [
  {
    profileId: "browser.chrome-latest",
    label: "Chrome Latest / Windows 11",
    enabled: true,
    browserFamily: "Chrome",
    browserVersion: "latest",
    renderingEngine: "Blink",
    operatingSystem: "Windows 11",
    assistiveTechnology: null,
  },
  {
    profileId: "browser.firefox-latest",
    label: "Firefox Latest / Windows 11",
    enabled: true,
    browserFamily: "Firefox",
    browserVersion: "latest",
    renderingEngine: "Gecko",
    operatingSystem: "Windows 11",
    assistiveTechnology: null,
  },
  {
    profileId: "browser.safari-latest",
    label: "Safari Latest / macOS Sonoma",
    enabled: true,
    browserFamily: "Safari",
    browserVersion: "latest",
    renderingEngine: "WebKit",
    operatingSystem: "macOS Sonoma",
    assistiveTechnology: null,
  },
  {
    profileId: "browser.edge-latest",
    label: "Edge Latest / Windows 11",
    enabled: true,
    browserFamily: "Edge",
    browserVersion: "latest",
    renderingEngine: "Blink",
    operatingSystem: "Windows 11",
    assistiveTechnology: null,
  },
] as const;

// ---------------------------------------------------------------------------
// Access context profiles  (Req 3.4, 19.6-19.7)
// ---------------------------------------------------------------------------

export type AccessContextId =
  | "access.public-guest"
  | "access.authenticated-customer"
  | "access.authenticated-admin"
  | "access.planner-member"
  | "access.studio-user";

export interface AccessProfile {
  readonly profileId: AccessContextId;
  readonly label: string;
  readonly enabled: boolean;
  readonly description: string;
  /** Surfaces where this access context is applicable */
  readonly applicableSurfaces: readonly ProductSurface[];
}

export const ACCESS_PROFILES: readonly AccessProfile[] = [
  {
    profileId: "access.public-guest",
    label: "Public Guest",
    enabled: true,
    description:
      "Unauthenticated visitor with no session, no roles, and no prior consent decision.",
    applicableSurfaces: [
      "marketing",
      "catalog-configurator",
      "authentication",
      "legal",
      "offline",
      "shared-shell",
    ],
  },
  {
    profileId: "access.authenticated-customer",
    label: "Authenticated Customer",
    enabled: true,
    description: "Authenticated portal user with standard customer role.",
    applicableSurfaces: [
      "marketing",
      "catalog-configurator",
      "portal-dashboard",
      "authentication",
      "legal",
      "offline",
      "shared-shell",
    ],
  },
  {
    profileId: "access.authenticated-admin",
    label: "Authenticated Administrator",
    enabled: true,
    description: "Authenticated staff user with full administration role.",
    applicableSurfaces: [
      "administration",
      "marketing",
      "catalog-configurator",
      "authentication",
      "legal",
      "offline",
      "shared-shell",
    ],
  },
  {
    profileId: "access.planner-member",
    label: "Planner Member",
    enabled: true,
    description: "Authenticated user with Planner product access.",
    applicableSurfaces: [
      "planner",
      "marketing",
      "catalog-configurator",
      "authentication",
      "offline",
      "shared-shell",
    ],
  },
  {
    profileId: "access.studio-user",
    label: "Studio User",
    enabled: true,
    description: "Authenticated user with Studio (product configuration) access.",
    applicableSurfaces: [
      "studio",
      "marketing",
      "catalog-configurator",
      "authentication",
      "offline",
      "shared-shell",
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Language context profiles  (Req 3.5)
// ---------------------------------------------------------------------------

export type LanguageId = "en" | "hi";

export interface LanguageProfile {
  readonly profileId: LanguageId;
  readonly label: string;
  readonly enabled: boolean;
  readonly bcp47: string;
}

export const LANGUAGE_PROFILES: readonly LanguageProfile[] = [
  {
    profileId: "en",
    label: "English",
    enabled: true,
    bcp47: "en",
  },
  {
    profileId: "hi",
    label: "Hindi",
    enabled: true,
    bcp47: "hi",
  },
] as const;

// ---------------------------------------------------------------------------
// Consent profiles  (Req 17.3)
// ---------------------------------------------------------------------------

export interface ConsentProfile {
  readonly profileId: string;
  readonly label: string;
  readonly enabled: boolean;
  readonly description: string;
}

export const CONSENT_PROFILES: readonly ConsentProfile[] = [
  {
    profileId: "consent.granted",
    label: "Consent Granted",
    enabled: true,
    description: "User has explicitly accepted all analytics and tracking consent.",
  },
  {
    profileId: "consent.denied",
    label: "Consent Denied",
    enabled: true,
    description: "User has explicitly rejected all analytics and tracking consent.",
  },
  {
    profileId: "consent.not-set",
    label: "Consent Not Set",
    enabled: true,
    description: "User has not yet made a consent decision (undecided / banner visible).",
  },
] as const;

// ---------------------------------------------------------------------------
// Performance profiles  (Req 22.8)
// ---------------------------------------------------------------------------

export interface PerformanceProfile {
  readonly profileId: string;
  readonly label: string;
  readonly enabled: boolean;
  readonly description: string;
  readonly downloadMbps: number | null;
  readonly uploadMbps: number | null;
  readonly latencyMs: number | null;
  readonly isOffline: boolean;
}

export const PERFORMANCE_PROFILES: readonly PerformanceProfile[] = [
  {
    profileId: "perf.fast-4g",
    label: "Fast 4G",
    enabled: true,
    description: "Standard fast mobile network (approx. 30 Mbps down).",
    downloadMbps: 30,
    uploadMbps: 15,
    latencyMs: 50,
    isOffline: false,
  },
  {
    profileId: "perf.slow-3g",
    label: "Slow 3G",
    enabled: true,
    description: "Throttled slow mobile network (approx. 400 kbps down).",
    downloadMbps: 0.4,
    uploadMbps: 0.4,
    latencyMs: 400,
    isOffline: false,
  },
  {
    profileId: "perf.offline",
    label: "Offline",
    enabled: true,
    description: "No network connectivity; service worker or offline fallback applies.",
    downloadMbps: 0,
    uploadMbps: 0,
    latencyMs: null,
    isOffline: true,
  },
] as const;

// ---------------------------------------------------------------------------
// State variants  (Req 3.1, 7.1)
// ---------------------------------------------------------------------------

export type StateVariantId =
  | "state.default"
  | "state.loading"
  | "state.empty"
  | "state.error"
  | "state.not-found"
  | "state.offline"
  | "state.logged-in"
  | "state.logged-out";

export interface StateVariant {
  readonly stateId: StateVariantId;
  readonly label: string;
  /** Surfaces for which this state is applicable. Empty means all surfaces. */
  readonly applicableSurfaces: readonly ProductSurface[];
  /** When true, this state applies to every route/instance/shell on applicable surfaces. */
  readonly universal: boolean;
}

export const STATE_VARIANTS: readonly StateVariant[] = [
  {
    stateId: "state.default",
    label: "Default (loaded, populated, authenticated as applicable)",
    applicableSurfaces: [],
    universal: true,
  },
  {
    stateId: "state.loading",
    label: "Loading / skeleton / pending",
    applicableSurfaces: [],
    universal: true,
  },
  {
    stateId: "state.empty",
    label: "Empty (no items, zero results, blank canvas)",
    applicableSurfaces: [
      "catalog-configurator",
      "portal-dashboard",
      "administration",
      "planner",
      "studio",
    ],
    universal: false,
  },
  {
    stateId: "state.error",
    label: "Server error / unexpected failure",
    applicableSurfaces: [],
    universal: true,
  },
  {
    stateId: "state.not-found",
    label: "Not found (404 boundary)",
    applicableSurfaces: [],
    universal: true,
  },
  {
    stateId: "state.offline",
    label: "Offline / no network fallback",
    applicableSurfaces: ["offline", "shared-shell", "marketing", "catalog-configurator"],
    universal: false,
  },
  {
    stateId: "state.logged-in",
    label: "Authenticated session view",
    applicableSurfaces: [
      "portal-dashboard",
      "administration",
      "planner",
      "studio",
      "authentication",
      "shared-shell",
    ],
    universal: false,
  },
  {
    stateId: "state.logged-out",
    label: "Unauthenticated / session-expired view",
    applicableSurfaces: [
      "portal-dashboard",
      "administration",
      "planner",
      "studio",
      "authentication",
      "shared-shell",
    ],
    universal: false,
  },
] as const;

// ---------------------------------------------------------------------------
// Audit dimensions
// ---------------------------------------------------------------------------

export type AuditDimensionId =
  | "dim.route-link-integrity"
  | "dim.navigation-journeys"
  | "dim.fallback-state"
  | "dim.copy-ia"
  | "dim.responsive-layout"
  | "dim.accessibility"
  | "dim.visual-design"
  | "dim.forms"
  | "dim.assets"
  | "dim.metadata-seo"
  | "dim.performance"
  | "dim.runtime-errors"
  | "dim.analytics-consent"
  | "dim.security-privacy";

export interface AuditDimension {
  readonly dimensionId: AuditDimensionId;
  readonly label: string;
  readonly requiresRuntime: boolean;
}

export const AUDIT_DIMENSIONS: readonly AuditDimension[] = [
  { dimensionId: "dim.route-link-integrity", label: "Route and link integrity", requiresRuntime: false },
  { dimensionId: "dim.navigation-journeys", label: "Navigation and journeys", requiresRuntime: false },
  { dimensionId: "dim.fallback-state", label: "Fallback and state behavior", requiresRuntime: true },
  { dimensionId: "dim.copy-ia", label: "Copy and information architecture", requiresRuntime: false },
  { dimensionId: "dim.responsive-layout", label: "Responsive and cross-browser layout", requiresRuntime: true },
  { dimensionId: "dim.accessibility", label: "Accessibility (WCAG 2.2 AA)", requiresRuntime: true },
  { dimensionId: "dim.visual-design", label: "Visual and design-system consistency", requiresRuntime: true },
  { dimensionId: "dim.forms", label: "Forms", requiresRuntime: true },
  { dimensionId: "dim.assets", label: "Assets", requiresRuntime: false },
  { dimensionId: "dim.metadata-seo", label: "Metadata and search presentation", requiresRuntime: false },
  { dimensionId: "dim.performance", label: "Performance and perceived performance", requiresRuntime: true },
  { dimensionId: "dim.runtime-errors", label: "Runtime errors", requiresRuntime: true },
  { dimensionId: "dim.analytics-consent", label: "Analytics and consent", requiresRuntime: true },
  { dimensionId: "dim.security-privacy", label: "Security and privacy messaging", requiresRuntime: false },
] as const;

// ---------------------------------------------------------------------------
// Profile version fingerprint  (Req 22.8 — invalidates dependent rows on change)
// ---------------------------------------------------------------------------

/**
 * Stable SHA-256 fingerprint over all enabled profile IDs in declaration order.
 * When any profile list changes (add, remove, reorder, or toggle enabled), this
 * fingerprint changes and invalidates all dependent occurrence rows.
 */
export function computeProfileVersionFingerprint(
  viewports: readonly ViewportProfile[],
  browsers: readonly BrowserProfile[],
  accessProfiles: readonly AccessProfile[],
  languages: readonly LanguageProfile[],
  states: readonly StateVariant[],
): string {
  const parts = [
    ...viewports.filter((v) => v.enabled).map((v) => v.profileId),
    ...browsers.filter((b) => b.enabled).map((b) => b.profileId),
    ...accessProfiles.filter((a) => a.enabled).map((a) => a.profileId),
    ...languages.filter((l) => l.enabled).map((l) => l.profileId),
    ...states.map((s) => s.stateId),
  ];
  return createHash("sha256").update(parts.join("\0")).digest("hex").slice(0, 16);
}

export const CURRENT_PROFILE_VERSION = computeProfileVersionFingerprint(
  VIEWPORT_PROFILES,
  BROWSER_PROFILES,
  ACCESS_PROFILES,
  LANGUAGE_PROFILES,
  STATE_VARIANTS,
);

// ---------------------------------------------------------------------------
// Applicability decision type  (Req 3.1-3.5, 19.6-19.8)
// ---------------------------------------------------------------------------

export interface ApplicabilityDecision {
  readonly status: "applicable" | "not-applicable";
  /** Required when status is "not-applicable" */
  readonly rationale?: string;
}

const APPLICABLE: ApplicabilityDecision = Object.freeze({ status: "applicable" } as const);

function notApplicable(rationale: string): ApplicabilityDecision {
  return Object.freeze({ status: "not-applicable", rationale } as const);
}

// ---------------------------------------------------------------------------
// Applicability rules
// ---------------------------------------------------------------------------

/**
 * Determine whether an access context applies to a given product surface.
 *
 * Rules (Req 19.6-19.8):
 * - admin surface: only accessible to authenticated-admin and studio-user
 * - studio surface: only accessible to studio-user (and authenticated-admin for visibility)
 * - planner surface: only accessible to planner-member (and authenticated-admin)
 * - portal-dashboard: only accessible to authenticated-customer (and authenticated-admin)
 * - public-guest cannot access protected surfaces
 */
export function accessApplicability(
  surface: ProductSurface,
  accessId: AccessContextId,
): ApplicabilityDecision {
  switch (surface) {
    case "administration":
      if (accessId === "access.authenticated-admin") return APPLICABLE;
      return notApplicable(
        `The administration surface requires authenticated-admin access; ${accessId} cannot reach it.`,
      );

    case "studio":
      if (
        accessId === "access.studio-user" ||
        accessId === "access.authenticated-admin"
      ) return APPLICABLE;
      return notApplicable(
        `The Studio surface requires studio-user or authenticated-admin access; ${accessId} cannot reach it.`,
      );

    case "planner":
      if (
        accessId === "access.planner-member" ||
        accessId === "access.authenticated-admin"
      ) return APPLICABLE;
      return notApplicable(
        `The Planner surface requires planner-member or authenticated-admin access; ${accessId} cannot reach it.`,
      );

    case "portal-dashboard":
      if (
        accessId === "access.authenticated-customer" ||
        accessId === "access.authenticated-admin"
      ) return APPLICABLE;
      return notApplicable(
        `The portal-dashboard surface requires authenticated-customer or authenticated-admin access; ${accessId} cannot reach it.`,
      );

    case "authentication":
      // All access contexts can encounter the authentication surface
      return APPLICABLE;

    case "offline":
      // All access contexts can encounter the offline surface
      return APPLICABLE;

    case "shared-shell":
      // All access contexts can encounter shared shell structures
      return APPLICABLE;

    case "marketing":
    case "catalog-configurator":
    case "legal":
    default:
      // Public surfaces apply to all contexts
      return APPLICABLE;
  }
}

/**
 * Determine whether a state variant applies to a given subject surface and access context.
 */
export function stateApplicability(
  state: StateVariant,
  surface: ProductSurface,
  accessId: AccessContextId,
): ApplicabilityDecision {
  // Universal states apply to every surface
  if (state.universal) return APPLICABLE;

  const appliesToSurface =
    state.applicableSurfaces.length === 0 ||
    state.applicableSurfaces.includes(surface);

  if (!appliesToSurface) {
    return notApplicable(
      `State variant "${state.stateId}" does not apply to the "${surface}" surface.`,
    );
  }

  // Offline state only applies when performance profile is offline
  // (recorded at occurrence level — state applicability is surface-level here)
  if (state.stateId === "state.offline" && surface !== "offline") {
    return notApplicable(
      `State variant "state.offline" is only applicable on the offline surface; current surface is "${surface}".`,
    );
  }

  // Logged-in state: not applicable for public-guest
  if (state.stateId === "state.logged-in" && accessId === "access.public-guest") {
    return notApplicable(
      "State variant \"state.logged-in\" is not applicable to public-guest access context.",
    );
  }

  // Logged-out state: only meaningful when the surface is protected
  if (state.stateId === "state.logged-out") {
    const protectedSurfaces: readonly ProductSurface[] = [
      "portal-dashboard",
      "administration",
      "planner",
      "studio",
      "authentication",
    ];
    if (!protectedSurfaces.includes(surface)) {
      return notApplicable(
        `State variant "state.logged-out" is only applicable on protected surfaces; current surface is "${surface}".`,
      );
    }
  }

  return APPLICABLE;
}

/**
 * Determine whether a language context applies to a given product surface.
 * Hindi is applicable everywhere; some surfaces are English-primary but Hindi
 * still requires audit coverage per Req 3.5.
 */
export function languageApplicability(
  _surface: ProductSurface,
  _languageId: LanguageId,
): ApplicabilityDecision {
  // Both English and Hindi are applicable on all surfaces per requirements 3.5
  return APPLICABLE;
}

// ---------------------------------------------------------------------------
// Stable ID generation helpers
// ---------------------------------------------------------------------------

function sha256Hex(parts: readonly string[]): string {
  return createHash("sha256").update(parts.join("\0")).digest("hex");
}

/**
 * Stable occurrence ID. Format: `occurrence.<fingerprint-16>`.
 * The fingerprint is a SHA-256 of all dimension values joined with NULL bytes.
 */
export function buildOccurrenceId(
  subjectId: string,
  stateId: StateVariantId,
  viewportId: string,
  browserId: string,
  accessId: AccessContextId,
  languageId: LanguageId,
  profileVersion: string,
): string {
  const fingerprint = sha256Hex([
    subjectId,
    stateId,
    viewportId,
    browserId,
    accessId,
    languageId,
    profileVersion,
  ]).slice(0, 16);
  return `occurrence.${fingerprint}`;
}

/**
 * Stable finding ID derived from the occurrence ID.
 * Format: `finding.<occurrence-fingerprint>`.
 */
export function buildFindingId(occurrenceId: string): string {
  return `finding.${occurrenceId.replace(/^occurrence\./, "")}`;
}

/**
 * Input fingerprint for a coverage matrix row — SHA-256 over all stable
 * dimension inputs. Changes when the subject source, profile configuration,
 * or state changes.
 */
export function buildInputFingerprint(
  subjectId: string,
  stateId: StateVariantId,
  viewportId: string,
  browserId: string,
  accessId: AccessContextId,
  languageId: LanguageId,
  profileVersion: string,
  subjectContentHash?: string,
): string {
  return sha256Hex([
    subjectId,
    stateId,
    viewportId,
    browserId,
    accessId,
    languageId,
    profileVersion,
    subjectContentHash ?? "",
  ]).slice(0, 32);
}

// ---------------------------------------------------------------------------
// Wave ownership mapping
// ---------------------------------------------------------------------------

export type WaveId = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Assign a wave ID for an occurrence based on surface and dimension
 * requirements:
 * - Wave 0: static-only dimensions (route integrity, copy, metadata, assets, security)
 * - Wave 1: protected/admin/planner/studio surfaces — static phase
 * - Wave 2: runtime dimensions requiring authorization (layout, accessibility, etc.)
 * - Wave 3: forms, analytics, consent, performance (runtime)
 * - Wave 4: journeys and cross-surface linking
 * - Wave 5: completion proof and final handoffs
 */
export function assignWave(
  surface: ProductSurface,
  dimensionId: AuditDimensionId,
): WaveId {
  const staticDimensions: readonly AuditDimensionId[] = [
    "dim.route-link-integrity",
    "dim.copy-ia",
    "dim.metadata-seo",
    "dim.assets",
    "dim.security-privacy",
    "dim.navigation-journeys",
  ];

  if (staticDimensions.includes(dimensionId)) {
    if (
      surface === "administration" ||
      surface === "planner" ||
      surface === "studio"
    ) return 1;
    return 0;
  }

  const performanceDimensions: readonly AuditDimensionId[] = [
    "dim.performance",
    "dim.forms",
    "dim.analytics-consent",
  ];
  if (performanceDimensions.includes(dimensionId)) return 3;

  if (dimensionId === "dim.navigation-journeys") return 4;

  // Runtime visual/accessibility dimensions
  return 2;
}

// ---------------------------------------------------------------------------
// Occurrence record type  (Req 3.6)
// ---------------------------------------------------------------------------

export type OccurrenceSubjectKind = "route" | "dynamic-instance" | "shell";

export interface OccurrenceRecord {
  readonly schemaVersion: typeof AUDIT_SCHEMA_VERSION;
  readonly occurrenceId: string;
  readonly findingId: string;
  readonly subjectKind: OccurrenceSubjectKind;
  readonly subjectId: string;
  readonly concreteUrl: string;
  readonly productSurface: ProductSurface;
  readonly stateId: StateVariantId;
  readonly viewportId: string;
  readonly browserId: string;
  readonly accessId: AccessContextId;
  readonly languageId: LanguageId;
  readonly profileVersion: string;
  readonly inputFingerprint: string;
  readonly waveId: WaveId;
  /** Applicable dimension IDs for this occurrence */
  readonly applicableDimensionIds: readonly AuditDimensionId[];
  /** Dimensions declared not-applicable with rationale */
  readonly notApplicableDimensions: readonly {
    readonly dimensionId: AuditDimensionId;
    readonly rationale: string;
  }[];
  /** True when the access context does not apply to the surface */
  readonly accessApplicability: ApplicabilityDecision;
  /** True when the state variant does not apply to the surface/access */
  readonly stateApplicability: ApplicabilityDecision;
  /** Explicit non-applicability rationale when the entire occurrence is not-applicable */
  readonly notApplicableRationale?: string;
}

// ---------------------------------------------------------------------------
// Applicability for entire occurrence  (Req 3.8 — no representative substitution)
// ---------------------------------------------------------------------------

function resolveOccurrenceApplicability(
  surface: ProductSurface,
  stateVariant: StateVariant,
  viewportId: string,
  accessId: AccessContextId,
  languageId: LanguageId,
): {
  readonly accessDecision: ApplicabilityDecision;
  readonly stateDecision: ApplicabilityDecision;
  readonly notApplicableRationale: string | undefined;
} {
  const accessDecision = accessApplicability(surface, accessId);
  const stateDecision = stateApplicability(stateVariant, surface, accessId);
  const languageDecision = languageApplicability(surface, languageId);

  void viewportId; // Viewports are universally applicable — recorded for cardinality

  let notApplicableRationale: string | undefined;
  if (accessDecision.status === "not-applicable") {
    notApplicableRationale = accessDecision.rationale;
  } else if (stateDecision.status === "not-applicable") {
    notApplicableRationale = stateDecision.rationale;
  } else if (languageDecision.status === "not-applicable") {
    notApplicableRationale = languageDecision.rationale;
  }

  return { accessDecision, stateDecision, notApplicableRationale };
}

// ---------------------------------------------------------------------------
// Dimension applicability per occurrence
// ---------------------------------------------------------------------------

function resolveApplicableDimensions(
  surface: ProductSurface,
  stateVariant: StateVariant,
  notApplicableOccurrence: boolean,
): {
  applicable: AuditDimensionId[];
  notApplicable: { dimensionId: AuditDimensionId; rationale: string }[];
} {
  if (notApplicableOccurrence) {
    return {
      applicable: [],
      notApplicable: AUDIT_DIMENSIONS.map((d) => ({
        dimensionId: d.dimensionId,
        rationale: "The occurrence is not applicable; no dimensions are evaluated.",
      })),
    };
  }

  const applicable: AuditDimensionId[] = [];
  const notApplicable: { dimensionId: AuditDimensionId; rationale: string }[] = [];

  for (const dim of AUDIT_DIMENSIONS) {
    // Forms dimension: not applicable to surfaces with no forms
    if (dim.dimensionId === "dim.forms") {
      const surfacesWithForms: readonly ProductSurface[] = [
        "authentication",
        "catalog-configurator",
        "portal-dashboard",
        "administration",
        "planner",
        "studio",
        "marketing",
      ];
      if (!surfacesWithForms.includes(surface)) {
        notApplicable.push({
          dimensionId: dim.dimensionId,
          rationale: `The "${surface}" surface has no documented forms.`,
        });
        continue;
      }
    }

    // Performance dimension: not applicable during offline state (no network)
    if (
      dim.dimensionId === "dim.performance" &&
      stateVariant.stateId === "state.offline"
    ) {
      notApplicable.push({
        dimensionId: dim.dimensionId,
        rationale: "Performance metrics are not applicable in the offline state.",
      });
      continue;
    }

    // Analytics/consent: not applicable to legal and shared-shell surfaces
    if (dim.dimensionId === "dim.analytics-consent") {
      if (surface === "legal" || surface === "shared-shell") {
        notApplicable.push({
          dimensionId: dim.dimensionId,
          rationale: `Analytics/consent is evaluated at route level; "${surface}" is the container.`,
        });
        continue;
      }
    }

    // Metadata/SEO: not applicable to offline and shared-shell surfaces
    if (dim.dimensionId === "dim.metadata-seo") {
      if (surface === "offline" || surface === "shared-shell") {
        notApplicable.push({
          dimensionId: dim.dimensionId,
          rationale: `Metadata/SEO is not evaluated for "${surface}" surfaces.`,
        });
        continue;
      }
    }

    applicable.push(dim.dimensionId);
  }

  return { applicable, notApplicable };
}

// ---------------------------------------------------------------------------
// Primary wave assignment per occurrence (lowest wave among applicable dims)
// ---------------------------------------------------------------------------

function primaryWave(
  surface: ProductSurface,
  applicableDims: readonly AuditDimensionId[],
): WaveId {
  if (applicableDims.length === 0) return 0;
  return applicableDims.reduce<WaveId>((lowest, dim) => {
    const w = assignWave(surface, dim);
    return w < lowest ? w : lowest;
  }, 5);
}

// ---------------------------------------------------------------------------
// Subject helpers
// ---------------------------------------------------------------------------

function subjectUrl(
  subject: DiscoveredRoute | DiscoveredDynamicInstance | DiscoveredShell,
): string {
  if ("concreteUrl" in subject && subject.concreteUrl) return subject.concreteUrl;
  if ("pattern" in subject) return subject.pattern;
  if ("sourcePath" in subject && !("pattern" in subject)) return subject.sourcePath;
  return (subject as DiscoveredShell).sourcePath;
}

function subjectIdField(
  subject: DiscoveredRoute | DiscoveredDynamicInstance | DiscoveredShell,
): string {
  if ("routeId" in subject && "pattern" in subject) return (subject as DiscoveredRoute).routeId;
  if ("instanceId" in subject) return (subject as DiscoveredDynamicInstance).instanceId;
  return (subject as DiscoveredShell).shellId;
}

function subjectKindOf(
  subject: DiscoveredRoute | DiscoveredDynamicInstance | DiscoveredShell,
): OccurrenceSubjectKind {
  if ("routeId" in subject && "pattern" in subject) return "route";
  if ("instanceId" in subject) return "dynamic-instance";
  return "shell";
}

// ---------------------------------------------------------------------------
// Main expansion function  (Req 3.6, 3.8 — exact Cartesian product, no sampling)
// ---------------------------------------------------------------------------

export interface ProfileSets {
  readonly viewports?: readonly ViewportProfile[];
  readonly browsers?: readonly BrowserProfile[];
  readonly accessContexts?: readonly AccessProfile[];
  readonly languages?: readonly LanguageProfile[];
  readonly states?: readonly StateVariant[];
}

/**
 * Generate the exact state × viewport × browser × access × language Cartesian
 * product for each route/instance/shell WITHOUT representative substitution
 * (Req 3.8). Every inapplicable tuple is still recorded with an explicit
 * non-applicability rationale (Req 3.6).
 *
 * Returns one OccurrenceRecord per tuple. Cardinality equals:
 *   |subjects| × |states| × |viewports| × |browsers| × |accessContexts| × |languages|
 *
 * Inapplicable occurrences are included with `notApplicableRationale` set.
 */
export function expandToOccurrences(
  routes: readonly DiscoveredRoute[],
  instances: readonly DiscoveredDynamicInstance[],
  shells: readonly DiscoveredShell[],
  profiles: ProfileSets = {},
): readonly OccurrenceRecord[] {
  const viewports = profiles.viewports ?? VIEWPORT_PROFILES.filter((v) => v.enabled);
  const browsers = profiles.browsers ?? BROWSER_PROFILES.filter((b) => b.enabled);
  const accessContexts = profiles.accessContexts ?? ACCESS_PROFILES.filter((a) => a.enabled);
  const languages = profiles.languages ?? LANGUAGE_PROFILES.filter((l) => l.enabled);
  const states = profiles.states ?? STATE_VARIANTS;

  const profileVersion = computeProfileVersionFingerprint(
    viewports,
    browsers,
    accessContexts,
    languages,
    states,
  );

  const subjects: Array<DiscoveredRoute | DiscoveredDynamicInstance | DiscoveredShell> = [
    ...routes,
    ...instances,
    ...shells,
  ];

  const occurrences: OccurrenceRecord[] = [];

  for (const subject of subjects) {
    const subjectId = subjectIdField(subject);
    const subjectKind = subjectKindOf(subject);
    const concreteUrl = subjectUrl(subject);
    const surface = subject.productSurface;

    for (const state of states) {
      for (const viewport of viewports) {
        for (const browser of browsers) {
          for (const access of accessContexts) {
            for (const lang of languages) {
              const occurrenceId = buildOccurrenceId(
                subjectId,
                state.stateId,
                viewport.profileId,
                browser.profileId,
                access.profileId,
                lang.profileId,
                profileVersion,
              );
              const findingId = buildFindingId(occurrenceId);
              const inputFingerprint = buildInputFingerprint(
                subjectId,
                state.stateId,
                viewport.profileId,
                browser.profileId,
                access.profileId,
                lang.profileId,
                profileVersion,
              );

              const {
                accessDecision,
                stateDecision,
                notApplicableRationale,
              } = resolveOccurrenceApplicability(
                surface,
                state,
                viewport.profileId,
                access.profileId,
                lang.profileId,
              );

              const isNotApplicable = notApplicableRationale !== undefined;

              const { applicable: applicableDims, notApplicable: naDims } =
                resolveApplicableDimensions(surface, state, isNotApplicable);

              const waveId = primaryWave(surface, applicableDims);

              occurrences.push(
                Object.freeze({
                  schemaVersion: AUDIT_SCHEMA_VERSION,
                  occurrenceId,
                  findingId,
                  subjectKind,
                  subjectId,
                  concreteUrl,
                  productSurface: surface,
                  stateId: state.stateId,
                  viewportId: viewport.profileId,
                  browserId: browser.profileId,
                  accessId: access.profileId,
                  languageId: lang.profileId,
                  profileVersion,
                  inputFingerprint,
                  waveId,
                  applicableDimensionIds: Object.freeze(applicableDims),
                  notApplicableDimensions: Object.freeze(naDims),
                  accessApplicability: accessDecision,
                  stateApplicability: stateDecision,
                  ...(notApplicableRationale
                    ? { notApplicableRationale }
                    : {}),
                }),
              );
            }
          }
        }
      }
    }
  }

  return Object.freeze(occurrences);
}

// ---------------------------------------------------------------------------
// Validation helpers  (Req 3.6, 22.8, 26.2)
// ---------------------------------------------------------------------------

export interface OccurrenceExpansionValidation {
  readonly totalOccurrences: number;
  readonly applicableOccurrences: number;
  readonly notApplicableOccurrences: number;
  readonly expectedCardinality: number;
  readonly cardinalityMatches: boolean;
  readonly uniqueOccurrenceIds: number;
  readonly duplicateOccurrenceIds: readonly string[];
  readonly hasDuplicates: boolean;
}

/**
 * Validates that:
 * 1. Matrix cardinality equals the declared Cartesian products (Req 3.6)
 * 2. Every applicable tuple occurs exactly once (Req 3.8)
 * 3. Inapplicable dimensions remain recorded (Req 3.6)
 */
export function validateOccurrenceExpansion(
  occurrences: readonly OccurrenceRecord[],
  subjectCount: number,
  profiles: Required<ProfileSets>,
): OccurrenceExpansionValidation {
  const expected =
    subjectCount *
    profiles.states.length *
    profiles.viewports.length *
    profiles.browsers.length *
    profiles.accessContexts.length *
    profiles.languages.length;

  const idCounts = new Map<string, number>();
  let applicableCount = 0;
  let notApplicableCount = 0;

  for (const occ of occurrences) {
    idCounts.set(occ.occurrenceId, (idCounts.get(occ.occurrenceId) ?? 0) + 1);
    if (occ.notApplicableRationale) {
      notApplicableCount++;
    } else {
      applicableCount++;
    }
  }

  const duplicates = [...idCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id);

  return Object.freeze({
    totalOccurrences: occurrences.length,
    applicableOccurrences: applicableCount,
    notApplicableOccurrences: notApplicableCount,
    expectedCardinality: expected,
    cardinalityMatches: occurrences.length === expected,
    uniqueOccurrenceIds: idCounts.size,
    duplicateOccurrenceIds: Object.freeze(duplicates),
    hasDuplicates: duplicates.length > 0,
  });
}

// ---------------------------------------------------------------------------
// Re-export profile registry records suitable for schema validation
// ---------------------------------------------------------------------------

export interface ProfileRegistryBundle {
  readonly viewports: typeof VIEWPORT_PROFILES;
  readonly browsers: typeof BROWSER_PROFILES;
  readonly accessContexts: typeof ACCESS_PROFILES;
  readonly languages: typeof LANGUAGE_PROFILES;
  readonly consentProfiles: typeof CONSENT_PROFILES;
  readonly performanceProfiles: typeof PERFORMANCE_PROFILES;
  readonly stateVariants: typeof STATE_VARIANTS;
  readonly auditDimensions: typeof AUDIT_DIMENSIONS;
  readonly profileVersion: string;
}

/**
 * Returns the complete, frozen profile registry bundle. The bundle is the
 * stable, versioned input to the Coverage Matrix — any change to these lists
 * changes `profileVersion` and invalidates dependent rows.
 */
export function getProfileRegistryBundle(): ProfileRegistryBundle {
  return Object.freeze({
    viewports: VIEWPORT_PROFILES,
    browsers: BROWSER_PROFILES,
    accessContexts: ACCESS_PROFILES,
    languages: LANGUAGE_PROFILES,
    consentProfiles: CONSENT_PROFILES,
    performanceProfiles: PERFORMANCE_PROFILES,
    stateVariants: STATE_VARIANTS,
    auditDimensions: AUDIT_DIMENSIONS,
    profileVersion: CURRENT_PROFILE_VERSION,
  });
}
