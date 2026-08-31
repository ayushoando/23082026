/**
 * Wave 1 — Task 2.2: authentication, legal, consent, error, and offline
 * foundation inventories with occurrence-level static evidence.
 *
 * This module reads the repository source tree only. It records source-visible
 * declarations as expectations and deliberately leaves browser, auth, consent,
 * offline-transition, recovery, logging-delivery, and legal-owner work as
 * terminal `not-run` or `requires-owner-decision` evidence with exact pending
 * operations. No source file under site/** is modified.
 *
 * Requirements: 3.7-3.9, 4.1-4.6, 7.1-7.7, 16.1, 16.7, 17.1-17.3,
 * 17.8, 18.1-18.7, 19.4, 20.1-20.8, 26.3-26.5, 26.10.
 */

import { createHash } from "node:crypto";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createGeneratedArtifactPath,
  resolveApprovedArtifactPath,
  verifyFailClosedArtifactPolicy,
} from "./artifactPaths";
import { loadAuditConfiguration, DEFAULT_CONFIG_PATH } from "./config";
import {
  discoverCanonicalInventory,
  type DiscoveredShell,
  type ProductSurface,
} from "./discovery";
import { expandToOccurrences, type OccurrenceRecord } from "./profiles";
import { buildJourneyInventory, type JourneyRecord } from "./wave1-journeys";
import {
  AUDIT_SCHEMA_VERSION,
  parseAuditRecord,
  type AuditRecord,
  type BlockerDetail,
  type ProvenanceReference,
} from "./schemas";
import { computeFingerprint, writeCanonicalPartition } from "./manifests";
import {
  createImmutableRunInputs,
  readRepositoryRevision,
} from "./runIdentity";

// ---------------------------------------------------------------------------
// Public contracts
// ---------------------------------------------------------------------------

type SpecializedInventoryRecord = Extract<
  AuditRecord,
  { readonly recordType: "specialized-inventory" }
>;
type EvidenceRecord = Extract<AuditRecord, { readonly recordType: "evidence" }>;
type OccurrenceFinding = Extract<
  AuditRecord,
  { readonly recordType: "finding" }
>;
type MatrixRow = Extract<AuditRecord, { readonly recordType: "matrix-row" }>;

export type FoundationCategory =
  | "auth-session-access"
  | "legal-policy"
  | "consent-analytics"
  | "error-recovery-offline";

export interface FoundationInventoryBuildResult {
  readonly records: readonly SpecializedInventoryRecord[];
  readonly sourceFilesScanned: number;
  readonly sourceErrors: readonly string[];
}

export interface FoundationAuditOutput {
  readonly runId: string;
  readonly inventoryRecords: readonly SpecializedInventoryRecord[];
  readonly matrixRows: readonly MatrixRow[];
  readonly evidenceRecords: readonly EvidenceRecord[];
  readonly findings: readonly OccurrenceFinding[];
  readonly pendingOperations: readonly PendingOperation[];
  readonly sourceErrors: readonly string[];
}

export interface PendingOperation {
  readonly operationId: string;
  readonly exactOperation: string;
  readonly category: FoundationCategory;
  readonly occurrenceId: string;
  readonly stateId: string;
  readonly viewportId: string;
  readonly browserId: string;
  readonly accessContextId: string;
  readonly languageId: "en" | "hi";
  readonly requiredAuthorization: string;
  readonly resultWhenUnauthorized: "not-run" | "requires-owner-decision";
}

// ---------------------------------------------------------------------------
// Source scanner
// ---------------------------------------------------------------------------

interface SourceMatch {
  readonly label: string;
  readonly snippet: string;
}

interface SourcePattern {
  readonly label: string;
  readonly expression: RegExp;
}

interface SourceFileObservation {
  readonly relativePath: string;
  readonly content: string;
  readonly matches: readonly SourceMatch[];
}

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".json"]);
const SKIPPED_DIRECTORIES = new Set([".next", "node_modules", ".git"]);

function isSupportedSourceFile(root: string, absolutePath: string): boolean {
  const extension = path.extname(absolutePath).toLowerCase();
  if (SOURCE_EXTENSIONS.has(extension) && extension !== ".json") return true;
  if (extension !== ".json") return false;

  const relativePath = normalizeRelativePath(
    path.relative(root, absolutePath),
  ).toLowerCase();
  return relativePath.startsWith("i18n/messages/");
}

const AUTH_PATTERNS: readonly SourcePattern[] = [
  { label: "optional-session-lookup", expression: /getOptionalUser/ },
  { label: "required-session-lookup", expression: /requireAuthUser/ },
  { label: "server-redirect", expression: /\bredirect\s*\(/ },
  {
    label: "return-path-sanitization",
    expression: /sanitizeNextPath|returnTo|return-to/,
  },
  {
    label: "role-or-access-denial",
    expression: /unauthorized|forbidden|requiresAdmin|accessContext/i,
  },
  {
    label: "development-bypass",
    expression: /DEV_BYPASS_USER|isDevAuthBypassEnabled|devAuthBypass/i,
  },
  {
    label: "access-redirect-contract",
    expression: /buildAccessRedirect|isProtectedPath|redirectToLogin/,
  },
  { label: "session-expiry-handling", expression: /expired|session/i },
];

const LEGAL_PATTERNS: readonly SourcePattern[] = [
  {
    label: "legal-translation-namespace",
    expression: /getTranslations\(["']legal["']\)/,
  },
  { label: "privacy-reference", expression: /privacy/i },
  { label: "terms-reference", expression: /terms/i },
  { label: "refund-policy-reference", expression: /refund|return-policy/i },
  { label: "policy-or-legal-link", expression: /policy|legal/i },
];

const CONSENT_PATTERNS: readonly SourcePattern[] = [
  { label: "consent-cookie", expression: /oando_cookie_consent/ },
  {
    label: "accepted-consent-state",
    expression: /CONSENT_ACCEPTED|["']accepted["']/,
  },
  {
    label: "rejected-consent-state",
    expression: /CONSENT_REJECTED|["']rejected["']/,
  },
  {
    label: "consent-event",
    expression: /oando-cookie-consent|flushAnalyticsAfterConsent/,
  },
  {
    label: "analytics-consent-gate",
    expression: /hasAnalyticsConsent|beforeSend/,
  },
  { label: "consent-copy-and-state", expression: /consent|cookie/i },
  {
    label: "analytics-event-declaration",
    expression: /emitSiteEvent|trackConversionEvent|CONVERSION_EVENTS/,
  },
];

const ERROR_PATTERNS: readonly SourcePattern[] = [
  {
    label: "error-boundary",
    expression: /error-boundary|global-error|Error\s*\(/i,
  },
  { label: "loading-boundary", expression: /loading-boundary|loading/i },
  { label: "not-found-boundary", expression: /not-found|404/i },
  {
    label: "offline-boundary",
    expression: /offline|service.worker|navigator\.onLine/i,
  },
  {
    label: "online-status-transition",
    expression: /useOnlineStatus|addEventListener\(["'](online|offline)["']/,
  },
  {
    label: "maintenance-state",
    expression:
      /maintenanceMode|MAINTENANCE_OFFLINE_PAGE_PREFIXES|read-only maintenance/i,
  },
  {
    label: "retry-or-reset-control",
    expression: /retry|reset|reload|reconnect/i,
  },
  {
    label: "error-logging-path",
    expression: /logClientError|\/api\/log-error|console\.error|registerOTel/,
  },
];

function sha256Short(...parts: readonly string[]): string {
  return createHash("sha256")
    .update(parts.join("\0"), "utf8")
    .digest("hex")
    .slice(0, 16);
}

function normalizeRelativePath(value: string): string {
  return value.replaceAll("\\", "/");
}

function sourceSurface(relativePath: string): ProductSurface {
  const value = normalizeRelativePath(relativePath).toLowerCase();

  if (
    value.includes("/(site)/privacy/") ||
    value.includes("/(site)/terms/") ||
    value.includes("/(site)/refund-and-return-policy/") ||
    value.includes("/(site)/legal/")
  ) {
    return "legal";
  }
  if (
    value.includes("/access/") ||
    value.includes("/login/") ||
    value.includes("/lib/auth/") ||
    value.includes("/features/shared/auth/")
  ) {
    return "authentication";
  }
  if (value.includes("/admin/")) return "administration";
  if (
    value.includes("/(site)/portal/") ||
    value.includes("/(site)/dashboard/")
  ) {
    return "portal-dashboard";
  }
  if (value.includes("/ooplanner/")) return "planner";
  if (value.includes("/oostudio/")) return "studio";
  if (value.includes("/offline/")) return "offline";
  if (
    value.includes("/components/site/") ||
    value.includes("/components/shared/") ||
    value.includes("/lib/analytics/") ||
    value.endsWith("/lib/consent.ts") ||
    value.endsWith("/lib/errorlogger.ts") ||
    value.endsWith("/instrumentation.ts")
  ) {
    return "shared-shell";
  }
  return "marketing";
}

function sourceMatches(
  content: string,
  patterns: readonly SourcePattern[],
): readonly SourceMatch[] {
  return patterns.flatMap((pattern) => {
    const match = pattern.expression.exec(content);
    if (!match || match.index < 0) return [];
    const start = Math.max(0, match.index - 90);
    const end = Math.min(content.length, match.index + match[0].length + 90);
    const snippet = content
      .slice(start, end)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);
    return [{ label: pattern.label, snippet }];
  });
}

function hasPathSegment(relativePath: string, segment: string): boolean {
  return normalizeRelativePath(relativePath)
    .toLowerCase()
    .includes(segment.toLowerCase());
}

function isAuthSource(
  relativePath: string,
  matches: readonly SourceMatch[],
): boolean {
  return (
    hasPathSegment(relativePath, "/lib/auth/") ||
    hasPathSegment(relativePath, "/access/") ||
    hasPathSegment(relativePath, "/login/") ||
    matches.length > 0
  );
}

function isLegalSource(
  relativePath: string,
  matches: readonly SourceMatch[],
): boolean {
  return (
    hasPathSegment(relativePath, "/privacy/") ||
    hasPathSegment(relativePath, "/terms/") ||
    hasPathSegment(relativePath, "/refund-and-return-policy/") ||
    matches.length > 0
  );
}

function isConsentSource(
  relativePath: string,
  matches: readonly SourceMatch[],
): boolean {
  const value = normalizeRelativePath(relativePath).toLowerCase();
  return (
    value.includes("cookieconsent") ||
    value.includes("siteanalytics") ||
    value.endsWith("/lib/consent.ts") ||
    value.includes("/lib/analytics/") ||
    matches.length > 0
  );
}

function isErrorSource(
  relativePath: string,
  matches: readonly SourceMatch[],
): boolean {
  const value = normalizeRelativePath(relativePath).toLowerCase();
  return (
    value.endsWith("error.tsx") ||
    value.endsWith("not-found.tsx") ||
    value.endsWith("loading.tsx") ||
    value.includes("offline") ||
    value.includes("errorlogger") ||
    value.endsWith("instrumentation.ts") ||
    matches.length > 0
  );
}

async function collectSourceFiles(
  root: string,
  current = root,
): Promise<readonly string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
    const absolutePath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(root, absolutePath)));
      continue;
    }
    if (!entry.isFile() || !isSupportedSourceFile(root, absolutePath)) continue;
    files.push(path.relative(root, absolutePath).replaceAll("\\", "/"));
  }

  return files;
}

async function readSourceObservations(
  repositoryRoot: string,
): Promise<{
  readonly observations: readonly SourceFileObservation[];
  readonly errors: readonly string[];
}> {
  const sourceRoot = path.join(repositoryRoot, "site");
  const observations: SourceFileObservation[] = [];
  const errors: string[] = [];
  let relativePaths: readonly string[] = [];
  try {
    relativePaths = await collectSourceFiles(sourceRoot);
  } catch (error) {
    errors.push(
      `site: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  for (const relativeSitePath of relativePaths) {
    const relativePath = `site/${relativeSitePath}`;
    const absolutePath = path.join(sourceRoot, relativeSitePath);
    try {
      const content = await readFile(absolutePath, "utf8");
      observations.push({
        relativePath,
        content,
        matches: [
          ...sourceMatches(content, AUTH_PATTERNS),
          ...sourceMatches(content, LEGAL_PATTERNS),
          ...sourceMatches(content, CONSENT_PATTERNS),
          ...sourceMatches(content, ERROR_PATTERNS),
        ],
      });
    } catch (error) {
      errors.push(
        `${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return Object.freeze({
    observations: Object.freeze(observations),
    errors: Object.freeze(errors.sort()),
  });
}

function uniqueMatches(
  matches: readonly SourceMatch[],
): readonly SourceMatch[] {
  const seen = new Set<string>();
  return matches.filter((match) => {
    const key = `${match.label}\0${match.snippet}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function provenance(
  relativePath: string,
  discoveredAt: string,
): ProvenanceReference[] {
  return [
    {
      sourceId: "source.app-router-tree",
      sourceKind: "source",
      location: relativePath,
      discoveredAt,
      authorityRank: 10,
    },
  ];
}

function categoryOwner(category: FoundationCategory): string {
  switch (category) {
    case "auth-session-access":
      return "authentication-and-access-owner";
    case "legal-policy":
      return "legal-content-owner";
    case "consent-analytics":
      return "privacy-and-analytics-owner";
    case "error-recovery-offline":
      return "site-platform-runtime-owner";
  }
}

function categoryInventoryKind(
  category: FoundationCategory,
): "analytics-consent" | "security-privacy-message" | "error-recovery" {
  switch (category) {
    case "consent-analytics":
      return "analytics-consent";
    case "error-recovery-offline":
      return "error-recovery";
    case "auth-session-access":
    case "legal-policy":
      return "security-privacy-message";
  }
}

function controlKind(
  category: FoundationCategory,
  relativePath: string,
): string {
  const value = normalizeRelativePath(relativePath).toLowerCase();
  switch (category) {
    case "auth-session-access":
      if (value.includes("/lib/auth/")) return "session-and-access-helper";
      if (value.includes("/admin/")) return "protected-administration-boundary";
      if (value.includes("/portal/") || value.includes("/dashboard/")) {
        return "protected-portal-boundary";
      }
      return "authentication-entry-and-return-path";
    case "legal-policy":
      if (value.includes("privacy")) return "privacy-policy-reference";
      if (value.includes("terms")) return "terms-policy-reference";
      if (value.includes("refund")) return "refund-policy-reference";
      return "legal-policy-reference";
    case "consent-analytics":
      if (
        value.includes("cookieconsent") ||
        value.endsWith("/lib/consent.ts")
      ) {
        return "consent-control-and-persistence";
      }
      return "analytics-declaration-and-consent-gate";
    case "error-recovery-offline":
      if (value.endsWith("loading.tsx")) return "loading-boundary";
      if (value.endsWith("not-found.tsx")) return "not-found-boundary";
      if (value.includes("offline")) return "offline-boundary";
      if (
        value.includes("errorlogger") ||
        value.endsWith("instrumentation.ts")
      ) {
        return "logging-path";
      }
      return "error-boundary-and-recovery-control";
  }
}

function categoryMatches(
  category: FoundationCategory,
  observation: SourceFileObservation,
): readonly SourceMatch[] {
  const patterns =
    category === "auth-session-access"
      ? AUTH_PATTERNS
      : category === "legal-policy"
        ? LEGAL_PATTERNS
        : category === "consent-analytics"
          ? CONSENT_PATTERNS
          : ERROR_PATTERNS;
  return uniqueMatches(sourceMatches(observation.content, patterns));
}

function shouldIncludeCategory(
  category: FoundationCategory,
  observation: SourceFileObservation,
): boolean {
  const relativePath = observation.relativePath;
  const matches = categoryMatches(category, observation);

  switch (category) {
    case "auth-session-access":
      return isAuthSource(relativePath, matches);
    case "legal-policy":
      return isLegalSource(relativePath, matches);
    case "consent-analytics":
      return isConsentSource(relativePath, matches);
    case "error-recovery-offline":
      return isErrorSource(relativePath, matches);
  }
}

function foundationProductSurface(
  category: FoundationCategory,
  relativePath: string,
): ProductSurface {
  const inferredSurface = sourceSurface(relativePath);
  switch (category) {
    case "legal-policy":
      return inferredSurface === "legal" ? "legal" : "shared-shell";
    case "consent-analytics":
      return "shared-shell";
    case "error-recovery-offline":
      return inferredSurface === "offline" ? "offline" : "shared-shell";
    case "auth-session-access":
      return inferredSurface === "marketing" ? "shared-shell" : inferredSurface;
  }
}

function createFoundationInventory(
  category: FoundationCategory,
  observation: SourceFileObservation,
  discoveredAt: string,
): SpecializedInventoryRecord {
  const matches = categoryMatches(category, observation);
  const inventoryId = `inv.foundation.${sha256Short(category, observation.relativePath)}`;
  const sourceSummary =
    matches.length > 0
      ? `Source declares ${controlKind(category, observation.relativePath)} with ${matches.length} visible control or boundary signal(s).`
      : `Source path declares ${controlKind(category, observation.relativePath)}; no literal message was required for this boundary record.`;

  const payload: Record<string, unknown> = {
    foundationCategory: category,
    controlKind: controlKind(category, observation.relativePath),
    sourceSummary,
    sourceMatches: matches.map((match) => ({
      label: match.label,
      snippet: match.snippet,
    })),
    sourceOnly: true,
    runtimeRequired: true,
    legalConclusion: false,
    expectedRuntimeVerification:
      "Source inspection does not establish rendered behavior, delivery, authorization, logging, offline transition, or legal adequacy.",
    pendingOperationKinds:
      category === "legal-policy"
        ? ["owner/legal review", "authorized route review"]
        : [
            "authorized browser workflow",
            "hook permission",
            "runtime evidence ingestion",
          ],
    coveredStateVariants:
      category === "auth-session-access"
        ? [
            "logged-in",
            "logged-out",
            "expired-session",
            "insufficient-role",
            "development-bypass",
          ]
        : category === "legal-policy"
          ? ["default", "disclosure-review"]
          : category === "consent-analytics"
            ? [
                "undecided",
                "accepted",
                "rejected",
                "customized",
                "withdrawn",
                "unavailable",
              ]
            : [
                "loading",
                "skeleton",
                "error",
                "not-found",
                "offline",
                "reconnect",
                "recovery",
              ],
    coveredAccessContexts:
      category === "auth-session-access"
        ? [
            "guest",
            "authenticated-customer",
            "authenticated-staff",
            "administrator",
            "expired-session",
            "insufficient-role",
            "development-bypass",
          ]
        : [
            "guest",
            "authenticated-customer",
            "authenticated-staff",
            "administrator",
          ],
  };

  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "specialized-inventory",
    recordId: `record.${inventoryId}`,
    createdAt: discoveredAt,
    inventoryId,
    inventoryKind: categoryInventoryKind(category),
    owner: categoryOwner(category),
    sourceLocator: observation.relativePath,
    productSurface: foundationProductSurface(
      category,
      observation.relativePath,
    ),
    provenance: provenance(observation.relativePath, discoveredAt),
    applicableOccurrenceSelector: {
      subjectIds: [],
      stateIds: [],
      viewportIds: [],
      browserIds: [],
      accessContextIds: [],
      languageIds: [],
    },
    status: "canonical",
    payload,
    exclusionId: undefined,
    coverageGapIds: [],
  } as SpecializedInventoryRecord;
}

export async function buildFoundationInventories(
  repositoryRoot: string,
  discoveredAt: string,
): Promise<FoundationInventoryBuildResult> {
  const { observations, errors } = await readSourceObservations(repositoryRoot);
  const categories: readonly FoundationCategory[] = [
    "auth-session-access",
    "legal-policy",
    "consent-analytics",
    "error-recovery-offline",
  ];
  const records: SpecializedInventoryRecord[] = [];

  for (const observation of observations) {
    for (const category of categories) {
      if (shouldIncludeCategory(category, observation)) {
        records.push(
          createFoundationInventory(category, observation, discoveredAt),
        );
      }
    }
  }

  records.sort((left, right) =>
    left.inventoryId.localeCompare(right.inventoryId),
  );
  return Object.freeze({
    records: Object.freeze(records),
    sourceFilesScanned: observations.length,
    sourceErrors: errors,
  });
}

// ---------------------------------------------------------------------------
// Occurrence evidence and finding generation
// ---------------------------------------------------------------------------

const FOUNDATION_SURFACES = new Set<ProductSurface>([
  "authentication",
  "legal",
  "offline",
  "portal-dashboard",
  "administration",
  "planner",
  "studio",
  "shared-shell",
]);

const FOUNDATION_STATE_IDS = new Set([
  "state.loading",
  "state.error",
  "state.not-found",
  "state.offline",
  "state.logged-in",
  "state.logged-out",
]);

function isFoundationOccurrence(occurrence: OccurrenceRecord): boolean {
  return (
    occurrence.subjectKind === "shell" ||
    FOUNDATION_SURFACES.has(occurrence.productSurface) ||
    FOUNDATION_STATE_IDS.has(occurrence.stateId)
  );
}

function categoriesForOccurrence(
  occurrence: OccurrenceRecord,
): readonly FoundationCategory[] {
  if (occurrence.subjectKind === "shell") {
    return [
      "auth-session-access",
      "legal-policy",
      "consent-analytics",
      "error-recovery-offline",
    ];
  }

  const categories: FoundationCategory[] = [];
  if (
    occurrence.productSurface === "authentication" ||
    occurrence.productSurface === "portal-dashboard" ||
    occurrence.productSurface === "administration" ||
    occurrence.productSurface === "planner" ||
    occurrence.productSurface === "studio" ||
    occurrence.stateId === "state.logged-in" ||
    occurrence.stateId === "state.logged-out"
  ) {
    categories.push("auth-session-access");
  }
  if (occurrence.productSurface === "legal") {
    categories.push("legal-policy", "consent-analytics");
  }
  if (
    occurrence.productSurface === "offline" ||
    FOUNDATION_STATE_IDS.has(occurrence.stateId)
  ) {
    categories.push("error-recovery-offline");
  }
  if (categories.length === 0) categories.push("error-recovery-offline");
  return [...new Set(categories)];
}

function evidenceDimension(category: FoundationCategory): string {
  switch (category) {
    case "auth-session-access":
    case "legal-policy":
      return "dim.security-privacy";
    case "consent-analytics":
      return "dim.analytics-consent";
    case "error-recovery-offline":
      return "dim.runtime-errors";
  }
}

function categoryRequirements(category: FoundationCategory): readonly string[] {
  switch (category) {
    case "auth-session-access":
      return [
        "4.1",
        "4.2",
        "4.3",
        "4.6",
        "18.1",
        "18.4",
        "19.6",
        "20.1",
        "20.3",
        "20.5",
        "20.6",
      ];
    case "legal-policy":
      return ["4.2", "18.1", "18.2", "18.6", "20.1", "20.3", "20.6"];
    case "consent-analytics":
      return [
        "4.1",
        "4.2",
        "17.1",
        "17.2",
        "17.3",
        "17.8",
        "20.1",
        "20.3",
        "20.6",
      ];
    case "error-recovery-offline":
      return [
        "4.1",
        "4.2",
        "7.1",
        "7.2",
        "7.5",
        "7.6",
        "16.1",
        "16.7",
        "20.1",
        "20.3",
        "20.6",
      ];
  }
}

function categoryExpectedResult(category: FoundationCategory): string {
  switch (category) {
    case "auth-session-access":
      return "Authentication, authorization, session-expiry, return-path, and non-disclosure behavior must match the source-visible contract for this occurrence.";
    case "legal-policy":
      return "Policy references must be reviewed by the responsible owner and checked against observed controls; source inspection is not a legal conclusion.";
    case "consent-analytics":
      return "Consent states must control analytics delivery, persistence, withdrawal, and payload minimization for this occurrence.";
    case "error-recovery-offline":
      return "Loading, error, not-found, offline, logging, reconnect, and recovery behavior must be verified for this occurrence.";
  }
}

function categoryOwnerForEvidence(category: FoundationCategory): string {
  return categoryOwner(category);
}

function categoryDependencies(category: FoundationCategory): readonly string[] {
  switch (category) {
    case "auth-session-access":
      return [
        "Wave 4 authorized auth/browser evidence",
        "access-context fixtures or credentials",
      ];
    case "legal-policy":
      return [
        "content/legal owner review",
        "authorized route inspection where behavior affects the policy message",
      ];
    case "consent-analytics":
      return [
        "Wave 4 authorized consent workflow",
        "analytics inspection fixture without personal data",
      ];
    case "error-recovery-offline":
      return [
        "Wave 4 authorized browser/network workflow",
        "safe error and offline fixtures",
      ];
  }
}

function pendingOperation(
  category: FoundationCategory,
  occurrence: OccurrenceRecord,
): PendingOperation {
  const operationId = `op.wave1.foundation.${sha256Short(category, occurrence.occurrenceId)}`;
  const occurrenceContext = `occurrence ${occurrence.occurrenceId} (${occurrence.concreteUrl}; state=${occurrence.stateId}; viewport=${occurrence.viewportId}; browser=${occurrence.browserId}; access=${occurrence.accessId}; language=${occurrence.languageId})`;
  let exactOperation: string;
  let requiredAuthorization: string;
  let resultWhenUnauthorized: "not-run" | "requires-owner-decision" = "not-run";

  switch (category) {
    case "auth-session-access":
      exactOperation = `Authorized browser workflow for ${occurrenceContext}: exercise guest, authenticated, expired-session, insufficient-role, and development-bypass transitions; verify redirect, return path, preserved context, and non-disclosure.`;
      requiredAuthorization =
        "Exact current-session authorization for this browser workflow, matching access contexts and hook permission; credentials or fixtures must be named before execution.";
      break;
    case "legal-policy":
      exactOperation = `Owner/legal review and authorized route inspection for ${occurrenceContext}: compare policy references, disclosure timing, links, and visible behavior without treating source inspection as legal approval.`;
      requiredAuthorization =
        "Named content/legal owner decision plus exact authorized route inspection if rendered or runtime behavior is required.";
      resultWhenUnauthorized = "requires-owner-decision";
      break;
    case "consent-analytics":
      exactOperation = `Authorized consent workflow for ${occurrenceContext}: exercise undecided, accepted, rejected, customized, withdrawn, and unavailable states; verify analytics suppression/delivery, persistence, uniqueness, and payload minimization without persisting personal data.`;
      requiredAuthorization =
        "Exact current-session authorization for this consent/analytics workflow, matching occurrence profiles and hook permission; no external network operation is implied.";
      break;
    case "error-recovery-offline":
      exactOperation = `Authorized browser and network workflow for ${occurrenceContext}: trigger loading, error, not-found, offline, reconnect, and recovery states; verify retained state, stale-message removal, logging behavior, and repeated-failure handling.`;
      requiredAuthorization =
        "Exact current-session authorization for this browser/network workflow, matching occurrence profiles and hook permission; safe fixtures are required.";
      break;
  }

  return {
    operationId,
    exactOperation,
    category,
    occurrenceId: occurrence.occurrenceId,
    stateId: occurrence.stateId,
    viewportId: occurrence.viewportId,
    browserId: occurrence.browserId,
    accessContextId: occurrence.accessId,
    languageId: occurrence.languageId,
    requiredAuthorization,
    resultWhenUnauthorized,
  };
}

function blockerForOperation(operation: PendingOperation): BlockerDetail {
  return {
    blockerKind:
      operation.resultWhenUnauthorized === "requires-owner-decision"
        ? "owner-decision"
        : "authorization",
    detail:
      operation.resultWhenUnauthorized === "requires-owner-decision"
        ? "The source record is not a legal or policy conclusion; the named owner review has not been supplied."
        : "The protected runtime operation lacks exact current-session authorization and a permitting hook decision.",
    pendingOperation: operation.exactOperation,
    owner: categoryOwner(operation.category),
  };
}

function relevantJourneyIds(
  category: FoundationCategory,
  journeys: readonly JourneyRecord[],
): readonly string[] {
  const ids = journeys
    .filter((journey) => {
      const name = journey.payload.journeyName.toLowerCase();
      if (category === "auth-session-access") {
        return name.includes("auth") || name.includes("session");
      }
      if (category === "error-recovery-offline") {
        return (
          name.includes("contact") ||
          name.includes("planner") ||
          name.includes("portal")
        );
      }
      return false;
    })
    .map((journey) => journey.inventoryId);
  return [...new Set(ids)].sort();
}

function relevantShellIds(
  occurrence: OccurrenceRecord,
  shells: readonly DiscoveredShell[],
  sourceRecords: readonly SpecializedInventoryRecord[],
): readonly string[] {
  const ids = new Set<string>();
  if (occurrence.subjectKind === "shell") ids.add(occurrence.subjectId);
  for (const shell of shells) {
    if (
      shell.routeIds.includes(occurrence.subjectId) ||
      sourceRecords.some((record) => record.sourceLocator === shell.sourcePath)
    ) {
      ids.add(shell.shellId);
    }
  }
  return [...ids].sort();
}

interface SourceInventorySelection {
  readonly records: readonly SpecializedInventoryRecord[];
  readonly totalCount: number;
}

const MAX_SOURCE_RECORD_SAMPLES_PER_EVIDENCE = 12;

function sourceInventoryForCategory(
  category: FoundationCategory,
  records: readonly SpecializedInventoryRecord[],
  occurrence: OccurrenceRecord,
): SourceInventorySelection {
  const samples: SpecializedInventoryRecord[] = [];
  let totalCount = 0;
  const applicableSurfaces = new Set<ProductSurface>([
    "shared-shell",
    occurrence.productSurface,
  ]);

  for (const record of records) {
    if (record.payload.foundationCategory !== category) continue;
    if (
      occurrence.subjectKind !== "shell" &&
      !applicableSurfaces.has(record.productSurface)
    )
      continue;
    totalCount++;
    if (samples.length < MAX_SOURCE_RECORD_SAMPLES_PER_EVIDENCE) {
      samples.push(record);
    }
  }

  return Object.freeze({
    records: Object.freeze(samples),
    totalCount,
  });
}

function evidenceReferences(
  category: FoundationCategory,
  selection: SourceInventorySelection,
  occurrence: OccurrenceRecord,
): readonly string[] {
  const references = [
    `inventory:foundation:${category}:records=${selection.totalCount}`,
    ...selection.records.flatMap((record) => [
      record.inventoryId,
      record.sourceLocator,
    ]),
    `occurrence:${occurrence.occurrenceId}`,
  ];
  return [...new Set(references)].sort();
}

function sourceObservationText(
  category: FoundationCategory,
  selection: SourceInventorySelection,
): string {
  if (selection.totalCount === 0) {
    return "No source-visible declaration was found for this foundation category in the scanned source roots.";
  }
  const summaries = selection.records.map((record) => {
    const summary = record.payload.sourceSummary;
    return typeof summary === "string"
      ? `${record.sourceLocator}: ${summary}`
      : record.sourceLocator;
  });
  const sampleText =
    summaries.length > 0
      ? ` Sampled source locations: ${summaries.join(" ")}`
      : "";
  return `Static source observation only: ${selection.totalCount} ${category} declaration(s) matched this occurrence.${sampleText}`;
}

function buildApplicabilityEvidence(
  occurrence: OccurrenceRecord,
  createdAt: string,
): EvidenceRecord {
  const rationale =
    occurrence.notApplicableRationale ??
    "The occurrence is not applicable under the frozen Wave 0 profile rules.";
  const evidenceId = `evidence.${sha256Short(occurrence.occurrenceId, "foundation-applicability")}`;
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "evidence",
    recordId: `record.${evidenceId}`,
    createdAt,
    evidenceId,
    findingId: occurrence.findingId,
    occurrenceId: occurrence.occurrenceId,
    route: occurrence.concreteUrl,
    concreteUrl: occurrence.concreteUrl,
    productSurface: occurrence.productSurface,
    stateVariant: occurrence.stateId,
    viewportProfile: occurrence.viewportId,
    browserProfile: occurrence.browserId,
    accessContext: occurrence.accessId,
    languageContext: occurrence.languageId,
    auditDimension: "wave1-foundation-applicability",
    expectedResult:
      "Only applicable occurrence tuples receive foundation evaluation.",
    observedResult: rationale,
    claimBasis: "source-observed",
    resultClassification: "not-applicable",
    severity: "not-applicable",
    severityRationale:
      "The tuple is outside the applicable foundation coverage for its access or state context.",
    userImpact: "No conclusion is drawn for an inapplicable tuple.",
    evidenceLane: "static-inspection",
    evidenceType: "profile-applicability-decision",
    sourceOrRuntimeLocation: "scripts/site-ui-content-links-audit/profiles.ts",
    capturedAt: createdAt,
    reproductionSteps: [
      `Review the frozen occurrence tuple ${occurrence.occurrenceId}.`,
      "Confirm the access/state applicability rationale before interpreting any foundation result.",
    ],
    evidenceReferences: [
      `occurrence:${occurrence.occurrenceId}`,
      "scripts/site-ui-content-links-audit/profiles.ts",
    ],
    requirementIds: ["3.4", "3.5", "20.1", "20.7"],
    journeyIds: [],
    shellIds: [],
    relatedFindingIds: [],
    proposedOutcome:
      "Retain the explicit not-applicable rationale and do not substitute another occurrence.",
    likelyOwner: "audit-program-owner",
    dependencies: [],
    verificationMethod: "Static profile-rule review; no runtime claim is made.",
    notApplicableRationale: rationale,
  };
}

function buildFoundationEvidence(
  occurrence: OccurrenceRecord,
  category: FoundationCategory,
  records: readonly SpecializedInventoryRecord[],
  journeys: readonly JourneyRecord[],
  shells: readonly DiscoveredShell[],
  allInventoryRecords: readonly SpecializedInventoryRecord[],
  createdAt: string,
): { readonly evidence: EvidenceRecord; readonly operation: PendingOperation } {
  const evidenceId = `evidence.${sha256Short(occurrence.occurrenceId, category)}`;
  const operation = pendingOperation(category, occurrence);
  const categoryRecords = sourceInventoryForCategory(
    category,
    records,
    occurrence,
  );
  const references = evidenceReferences(category, categoryRecords, occurrence);
  const shellIds = relevantShellIds(occurrence, shells, allInventoryRecords);
  const observed = sourceObservationText(category, categoryRecords);
  const sourceLocations = categoryRecords.records.map(
    (record) => record.sourceLocator,
  );

  const evidence: EvidenceRecord = {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "evidence",
    recordId: `record.${evidenceId}`,
    createdAt,
    evidenceId,
    findingId: occurrence.findingId,
    occurrenceId: occurrence.occurrenceId,
    route: occurrence.concreteUrl,
    concreteUrl: occurrence.concreteUrl,
    productSurface: occurrence.productSurface,
    stateVariant: occurrence.stateId,
    viewportProfile: occurrence.viewportId,
    browserProfile: occurrence.browserId,
    accessContext: occurrence.accessId,
    languageContext: occurrence.languageId,
    auditDimension: evidenceDimension(category),
    expectedResult: categoryExpectedResult(category),
    observedResult: observed,
    claimBasis:
      categoryRecords.totalCount > 0
        ? "source-observed"
        : "source-inferred-expectation",
    resultClassification: operation.resultWhenUnauthorized,
    severity: "advisory",
    severityRationale:
      "This is a pending evidence record, not a verified defect; severity is not assigned until the required runtime or owner evidence exists.",
    userImpact:
      "The source contract is recorded, but the affected state or control remains unverified in this occurrence context.",
    evidenceLane: "static-inspection",
    evidenceType:
      categoryRecords.totalCount > 0
        ? "source-foundation-declaration"
        : "source-coverage-gap",
    sourceOrRuntimeLocation:
      sourceLocations.length > 0
        ? sourceLocations.join(", ")
        : "site source roots (no matching declaration)",
    capturedAt: createdAt,
    reproductionSteps: [
      ...(sourceLocations.length > 0
        ? sourceLocations.map(
            (location) => `Inspect source declaration at ${location}.`,
          )
        : [
            "Inspect the scanned site source roots for the missing foundation declaration.",
          ]),
      "Do not treat static source evidence as rendered, runtime, analytics-delivery, authentication, offline-transition, recovery, or legal evidence.",
    ],
    evidenceReferences: [
      ...(references.length > 0
        ? references
        : [`source-gap:${category}`, `occurrence:${occurrence.occurrenceId}`]),
    ],
    requirementIds: [...categoryRequirements(category)],
    journeyIds: [...relevantJourneyIds(category, journeys)],
    shellIds: [...shellIds],
    relatedFindingIds: [],
    proposedOutcome:
      category === "legal-policy"
        ? "Obtain named owner/legal review and separately authorized route evidence before making a policy or compliance conclusion."
        : "Run the exact pending operation with matching authorization and ingest occurrence-scoped evidence; retain this source expectation separately.",
    likelyOwner: categoryOwnerForEvidence(category),
    dependencies: [...categoryDependencies(category)],
    verificationMethod: operation.exactOperation,
    blockers: [blockerForOperation(operation)],
  };

  return { evidence, operation };
}

function buildMatrixRow(
  occurrence: OccurrenceRecord,
  finding: OccurrenceFinding,
  createdAt: string,
): MatrixRow {
  const applicableDimensionIds = [...occurrence.applicableDimensionIds];
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "matrix-row",
    recordId: `record.matrix.${occurrence.occurrenceId}`,
    createdAt,
    occurrenceId: occurrence.occurrenceId,
    ...(occurrence.subjectKind === "route"
      ? { routeId: occurrence.subjectId }
      : {}),
    ...(occurrence.subjectKind === "shell"
      ? { shellId: occurrence.subjectId }
      : {}),
    concreteUrl: occurrence.concreteUrl,
    productSurface: occurrence.productSurface,
    stateId: occurrence.stateId,
    viewportId: occurrence.viewportId,
    browserId: occurrence.browserId,
    accessContextId: occurrence.accessId,
    languageId: occurrence.languageId,
    applicableDimensionIds,
    waveId: "1",
    status: finding.resultClassification,
    findingId: finding.findingId,
    inputFingerprint: occurrence.inputFingerprint,
    ...(finding.blockers ? { blockers: [...finding.blockers] } : {}),
    ...(finding.notApplicableRationale
      ? { notApplicableRationale: finding.notApplicableRationale }
      : {}),
  };
}

function uniqueBlockers(
  blockers: readonly BlockerDetail[],
): readonly BlockerDetail[] {
  const seen = new Set<string>();
  return blockers.filter((blocker) => {
    const key = `${blocker.blockerKind}\0${blocker.pendingOperation}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildFinding(
  occurrence: OccurrenceRecord,
  evidenceRecords: readonly EvidenceRecord[],
  createdAt: string,
): OccurrenceFinding {
  const evidenceIds = evidenceRecords.map((record) => record.evidenceId).sort();
  const blockers = uniqueBlockers(
    evidenceRecords.flatMap((record) => record.blockers ?? []),
  );
  const resultClassification = evidenceRecords.some(
    (record) => record.resultClassification === "not-run",
  )
    ? "not-run"
    : evidenceRecords.some(
          (record) => record.resultClassification === "requires-owner-decision",
        )
      ? "requires-owner-decision"
      : "not-applicable";
  const notApplicableRationale = occurrence.notApplicableRationale;
  const conclusionSummary =
    resultClassification === "not-applicable"
      ? `Foundation evaluation is not applicable for this occurrence: ${notApplicableRationale ?? "profile applicability rule"}.`
      : resultClassification === "requires-owner-decision"
        ? "Static policy evidence was recorded, but named owner/legal review is required; no legal conclusion is asserted."
        : "Static foundation declarations were recorded, but protected runtime evidence remains not-run; no rendered, delivery, transition, recovery, or runtime conclusion is asserted.";

  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "finding",
    recordId: `record.${occurrence.findingId}`,
    createdAt,
    findingId: occurrence.findingId,
    occurrenceId: occurrence.occurrenceId,
    resultClassification,
    claimBasis:
      resultClassification === "not-applicable"
        ? "source-observed"
        : "source-inferred-expectation",
    conclusionSummary,
    evidenceIds,
    requirementIds: [
      ...new Set(evidenceRecords.flatMap((record) => record.requirementIds)),
    ].sort(),
    productSurface: occurrence.productSurface,
    copyRelated: false,
    ...(resultClassification !== "not-applicable" && blockers.length > 0
      ? { blockers: [...blockers] }
      : {}),
    ...(resultClassification === "not-applicable" && notApplicableRationale
      ? { notApplicableRationale }
      : {}),
  };
}

export function buildFoundationAuditRecords(
  occurrences: readonly OccurrenceRecord[],
  inventoryRecords: readonly SpecializedInventoryRecord[],
  journeys: readonly JourneyRecord[],
  shells: readonly DiscoveredShell[],
  createdAt: string,
): {
  readonly matrixRows: readonly MatrixRow[];
  readonly evidenceRecords: readonly EvidenceRecord[];
  readonly findings: readonly OccurrenceFinding[];
  readonly pendingOperations: readonly PendingOperation[];
} {
  const matrixRows: MatrixRow[] = [];
  const evidenceRecords: EvidenceRecord[] = [];
  const findings: OccurrenceFinding[] = [];
  const pendingOperations: PendingOperation[] = [];

  for (const occurrence of occurrences) {
    if (!isFoundationOccurrence(occurrence)) continue;

    if (occurrence.notApplicableRationale) {
      const evidence = buildApplicabilityEvidence(occurrence, createdAt);
      const finding = buildFinding(occurrence, [evidence], createdAt);
      evidenceRecords.push(evidence);
      findings.push(finding);
      matrixRows.push(buildMatrixRow(occurrence, finding, createdAt));
      continue;
    }

    const occurrenceEvidence: EvidenceRecord[] = [];
    for (const category of categoriesForOccurrence(occurrence)) {
      const { evidence, operation } = buildFoundationEvidence(
        occurrence,
        category,
        inventoryRecords,
        journeys,
        shells,
        inventoryRecords,
        createdAt,
      );
      occurrenceEvidence.push(evidence);
      evidenceRecords.push(evidence);
      pendingOperations.push(operation);
    }

    const finding = buildFinding(occurrence, occurrenceEvidence, createdAt);
    findings.push(finding);
    matrixRows.push(buildMatrixRow(occurrence, finding, createdAt));
  }

  return Object.freeze({
    matrixRows: Object.freeze(
      matrixRows.sort((left, right) =>
        left.occurrenceId.localeCompare(right.occurrenceId),
      ),
    ),
    evidenceRecords: Object.freeze(
      evidenceRecords.sort((left, right) =>
        left.evidenceId.localeCompare(right.evidenceId),
      ),
    ),
    findings: Object.freeze(
      findings.sort((left, right) =>
        left.findingId.localeCompare(right.findingId),
      ),
    ),
    pendingOperations: Object.freeze(
      pendingOperations.sort((left, right) =>
        left.operationId.localeCompare(right.operationId),
      ),
    ),
  });
}

// ---------------------------------------------------------------------------
// Runner and artifact writing
// ---------------------------------------------------------------------------

function validateRecord(record: unknown): {
  readonly valid: boolean;
  readonly diagnostics?: readonly string[];
} {
  if (!record || typeof record !== "object") {
    return { valid: false, diagnostics: ["record:not-an-object"] };
  }
  const parsed = parseAuditRecord(record as object);
  if (parsed.success) return { valid: true };
  return {
    valid: false,
    diagnostics: parsed.diagnostics.map(
      (diagnostic) => `${diagnostic.path.join(".")}:${diagnostic.code}`,
    ),
  };
}

function assertValidRecords(records: readonly object[], label: string): void {
  for (const [index, record] of records.entries()) {
    const validation = validateRecord(record);
    if (!validation.valid) {
      throw new Error(
        `${label}[${index}] failed audit schema validation: ${(validation.diagnostics ?? []).join(", ")}`,
      );
    }
  }
}

async function writeJsonFile(
  absolutePath: string,
  value: unknown,
): Promise<void> {
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function surfacePath(
  runId: string,
  purpose: string,
  surface: ProductSurface,
  filename: string,
  config: Parameters<typeof createGeneratedArtifactPath>[3],
): string {
  return createGeneratedArtifactPath(
    runId,
    purpose,
    `wave-1-foundations/${surface}/${filename}`,
    config,
  );
}

export async function runWave1Foundations(
  repositoryRoot = process.cwd(),
  configPath = DEFAULT_CONFIG_PATH,
): Promise<Record<string, unknown>> {
  const startedAt = new Date().toISOString();
  const loaded = await loadAuditConfiguration(repositoryRoot, configPath);
  verifyFailClosedArtifactPolicy(repositoryRoot, loaded.config);
  const revision = readRepositoryRevision(repositoryRoot);
  const immutableRunInputs = createImmutableRunInputs(loaded, revision);
  const discoveredAt = new Date().toISOString();

  const discovery = await discoverCanonicalInventory({
    repositoryRoot,
    discoveredAt,
  });
  const occurrences = expandToOccurrences(
    discovery.routes,
    discovery.dynamicInstances,
    discovery.shells,
  );
  const journeys = buildJourneyInventory(discoveredAt);
  const inventory = await buildFoundationInventories(
    repositoryRoot,
    discoveredAt,
  );
  const records = buildFoundationAuditRecords(
    occurrences,
    inventory.records,
    journeys,
    discovery.shells,
    discoveredAt,
  );

  assertValidRecords(inventory.records, "foundation inventories");
  assertValidRecords(records.matrixRows, "foundation matrix rows");
  assertValidRecords(records.evidenceRecords, "foundation evidence");
  assertValidRecords(records.findings, "foundation findings");

  const { runId } = immutableRunInputs;
  const { config } = loaded;
  const writtenPaths: string[] = [];
  const partitionResults: Record<
    string,
    {
      readonly path: string;
      readonly records: number;
      readonly contentHash: string;
    }
  > = {};

  type PartitionSpec = {
    readonly key: string;
    readonly relativePath: string;
    readonly records: readonly object[];
  };

  const partitionSpecs: PartitionSpec[] = [];
  partitionSpecs.push({
    key: "inventories/foundations",
    relativePath: createGeneratedArtifactPath(
      runId,
      "inventories",
      "wave-1-foundations/foundation-inventories.ndjson",
      config,
    ),
    records: inventory.records,
  });

  const foundationSurfaces = [
    ...new Set([
      ...records.matrixRows.map((row) => row.productSurface),
      ...records.findings.map((finding) => finding.productSurface),
    ]),
  ].sort() as ProductSurface[];

  for (const surface of foundationSurfaces) {
    partitionSpecs.push({
      key: `matrices/${surface}`,
      relativePath: surfacePath(
        runId,
        "matrices",
        surface,
        "rows.ndjson",
        config,
      ),
      records: records.matrixRows.filter(
        (row) => row.productSurface === surface,
      ),
    });
    partitionSpecs.push({
      key: `evidence/${surface}`,
      relativePath: surfacePath(
        runId,
        "evidence",
        surface,
        "evidence.ndjson",
        config,
      ),
      records: records.evidenceRecords.filter(
        (record) => record.productSurface === surface,
      ),
    });
    partitionSpecs.push({
      key: `findings/${surface}`,
      relativePath: surfacePath(
        runId,
        "findings",
        surface,
        "findings.ndjson",
        config,
      ),
      records: records.findings.filter(
        (finding) => finding.productSurface === surface,
      ),
    });
  }

  for (const spec of partitionSpecs) {
    const resolved = resolveApprovedArtifactPath(
      repositoryRoot,
      spec.relativePath,
      config,
      runId,
    );
    const csvRelative = spec.relativePath.replace(/\.ndjson$/, ".csv");
    const csvResolved = resolveApprovedArtifactPath(
      repositoryRoot,
      csvRelative,
      config,
      runId,
    );
    const result = await writeCanonicalPartition(
      resolved.absolutePath,
      spec.records,
      {
        csvPath: csvResolved.absolutePath,
        redact: true,
        validateRecord,
      },
    );
    partitionResults[spec.key] = {
      path: resolved.relativePath,
      records: result.recordCount,
      contentHash: result.contentHash,
    };
    writtenPaths.push(resolved.relativePath, csvResolved.relativePath);
  }

  const pendingOperationMap = new Map<string, PendingOperation>();
  for (const operation of records.pendingOperations) {
    pendingOperationMap.set(operation.operationId, operation);
  }
  const pendingOperations = [...pendingOperationMap.values()].sort(
    (left, right) => left.operationId.localeCompare(right.operationId),
  );
  const resultTotals = records.findings.reduce(
    (totals, finding) => ({
      ...totals,
      [finding.resultClassification]: totals[finding.resultClassification] + 1,
    }),
    {
      conforming: 0,
      nonconforming: 0,
      blocked: 0,
      "not-run": 0,
      "not-applicable": 0,
      "requires-owner-decision": 0,
    } as Record<string, number>,
  );
  const foundationFingerprint = computeFingerprint([
    immutableRunInputs.configurationHash,
    immutableRunInputs.repositoryRevision,
    String(inventory.records.length),
    String(records.matrixRows.length),
    String(records.evidenceRecords.length),
    String(records.findings.length),
  ]);
  const summaryRelative = createGeneratedArtifactPath(
    runId,
    "manifests",
    "wave-1-foundations/task-2.2-summary.json",
    config,
  );
  const summaryResolved = resolveApprovedArtifactPath(
    repositoryRoot,
    summaryRelative,
    config,
    runId,
  );
  const summary = {
    task: "2.2 — Wave 1 auth/legal/consent/error/offline foundations",
    runId,
    waveId: 1,
    startedAt,
    completedAt: new Date().toISOString(),
    repositoryRevision: immutableRunInputs.repositoryRevision,
    configurationHash: immutableRunInputs.configurationHash,
    foundationFingerprint,
    sourceScan: {
      filesScanned: inventory.sourceFilesScanned,
      sourceErrors: inventory.sourceErrors,
      inventoryRecords: inventory.records.length,
    },
    coverage: {
      totalExpandedOccurrences: occurrences.length,
      foundationMatrixRows: records.matrixRows.length,
      uniqueFindingIds: new Set(
        records.findings.map((finding) => finding.findingId),
      ).size,
      evidenceRecords: records.evidenceRecords.length,
      pendingOperations: pendingOperations.length,
      oneFindingPerMatrixRow:
        records.matrixRows.length === records.findings.length &&
        new Set(records.matrixRows.map((row) => row.occurrenceId)).size ===
          records.matrixRows.length &&
        new Set(records.findings.map((finding) => finding.occurrenceId))
          .size === records.findings.length,
    },
    resultTotals: {
      conforming: resultTotals.conforming ?? 0,
      nonconforming: resultTotals.nonconforming ?? 0,
      blocked: resultTotals.blocked ?? 0,
      notRun: resultTotals["not-run"] ?? 0,
      notApplicable: resultTotals["not-applicable"] ?? 0,
      requiresOwnerDecision: resultTotals["requires-owner-decision"] ?? 0,
    },
    partitions: partitionResults,
    pendingOperations,
    staticLimitations: [
      "No browser, network, authentication, consent delivery, offline transition, reconnect, logging delivery, assistive-technology, performance, or hosted operation was executed.",
      "Source-visible legal and policy references are not legal conclusions or approval.",
      "Source-visible analytics declarations do not establish event delivery or suppression.",
      "Protected access contexts remain occurrence-specific and are not closed by guest or development-bypass evidence.",
    ],
    changedPathManifest: {
      writtenPaths,
      siteStarPaths: writtenPaths.filter((relativePath) =>
        relativePath.startsWith("site/"),
      ),
      productCodeMutations: 0,
      allPathsInApprovedDestinations: writtenPaths.every(
        (relativePath) =>
          relativePath.startsWith("results/site-ui-content-links-audit/") ||
          relativePath.startsWith("agents-work/site-ui-content-links-audit/"),
      ),
    },
    requirements: [
      "3.7-3.9",
      "4.1-4.6",
      "7.1-7.7",
      "16.1",
      "16.7",
      "17.1-17.3",
      "17.8",
      "18.1-18.7",
      "19.4",
      "20.1-20.8",
      "26.3-26.5",
      "26.10",
    ],
  };
  await writeJsonFile(summaryResolved.absolutePath, summary);
  writtenPaths.push(summaryResolved.relativePath);

  return {
    mode: "wave-1-foundations-static-complete",
    ...summary,
  };
}
