/**
 * Wave 2 — Task 3.1: marketing, catalog/configurator, portal/dashboard, and
 * primary-journey source evidence.
 *
 * This module is deliberately source-only. It traverses only the approved
 * surface source roots, keeps canonical routes and dynamic instances as
 * separate subjects, and emits occurrence-scoped records whose pending
 * browser, access, analytics, asset, and performance work is never executed.
 * Product code under site/** is read but never modified.
 */

import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createGeneratedArtifactPath,
  resolveApprovedArtifactPath,
  verifyFailClosedArtifactPolicy,
} from "./artifactPaths";
import { DEFAULT_CONFIG_PATH, loadAuditConfiguration } from "./config";
import {
  discoverCanonicalInventory,
  type CanonicalDiscoveryResult,
  type DiscoveredShell,
  type ProductSurface,
} from "./discovery";
import {
  expandToOccurrences,
  type AuditDimensionId,
  type OccurrenceRecord,
} from "./profiles";
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
import { buildJourneyInventory, type JourneyRecord } from "./wave1-journeys";

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
type CopyProposalRecord = Extract<
  AuditRecord,
  { readonly recordType: "copy-proposal" }
>;
type SeverityAssessmentRecord = Extract<
  AuditRecord,
  { readonly recordType: "severity-assessment" }
>;

export const WAVE2_SURFACES = [
  "marketing",
  "catalog-configurator",
  "portal-dashboard",
] as const satisfies readonly ProductSurface[];

export type Wave2Surface = (typeof WAVE2_SURFACES)[number];

export const WAVE2_DIMENSIONS = [
  "dim.route-link-integrity",
  "dim.navigation-journeys",
  "dim.fallback-state",
  "dim.copy-ia",
  "dim.responsive-layout",
  "dim.accessibility",
  "dim.visual-design",
  "dim.forms",
  "dim.assets",
  "dim.metadata-seo",
  "dim.performance",
  "dim.runtime-errors",
  "dim.analytics-consent",
  "dim.security-privacy",
] as const satisfies readonly AuditDimensionId[];

export type SurfaceInventoryKind =
  | "state"
  | "link"
  | "form"
  | "asset"
  | "copy-ia"
  | "seo"
  | "analytics-consent"
  | "security-privacy-message"
  | "error-recovery";

type SourceSignalKind = SurfaceInventoryKind | "journey";
type SourceAttributeName = "href" | "name" | "htmlFor";

interface SourceCopyDefect {
  readonly currentText: string;
  readonly sourcePath: string;
  readonly evidenceSnippet: string;
}

export interface SurfacePendingOperation {
  readonly operationId: string;
  readonly exactOperation: string;
  readonly dimension: AuditDimensionId;
  readonly occurrenceId: string;
  readonly stateId: string;
  readonly viewportId: string;
  readonly browserId: string;
  readonly accessContextId: string;
  readonly languageId: "en" | "hi";
  readonly requiredAuthorization: string;
  readonly resultWhenUnauthorized: "not-run" | "blocked";
}

/**
 * Bounded facts derived while one source file is transiently in memory.
 * Raw source text is intentionally not part of this record and must never be
 * retained beyond the per-file scan.
 */
export interface SourceObservation {
  readonly relativePath: string;
  readonly signalsByKind: Readonly<
    Record<SourceSignalKind, readonly SourceSignal[]>
  >;
  readonly attributeValues: Readonly<
    Record<SourceAttributeName, readonly string[]>
  >;
  readonly formCount: number;
  readonly staticCopyDefects: readonly SourceCopyDefect[];
}

export interface SourceSignal {
  readonly label: string;
  readonly snippet: string;
}

export interface SurfaceSubject {
  readonly subjectKind: "route" | "dynamic-instance";
  readonly subjectId: string;
  readonly routeId: string;
  readonly routePattern: string;
  readonly concreteUrl: string;
  readonly sourcePath: string;
  readonly productSurface: Wave2Surface;
  readonly status: string;
}

export interface SurfaceInventoryBuildResult {
  readonly records: readonly SpecializedInventoryRecord[];
  readonly journeys: readonly SpecializedInventoryRecord[];
  readonly subjects: readonly SurfaceSubject[];
  readonly sourceFilesScanned: number;
  readonly sourceErrors: readonly string[];
}

export interface SurfaceAuditRecordBuildResult {
  readonly matrixRows: readonly MatrixRow[];
  readonly evidenceRecords: readonly EvidenceRecord[];
  readonly findings: readonly OccurrenceFinding[];
  readonly copyProposals: readonly CopyProposalRecord[];
  readonly severityAssessments: readonly SeverityAssessmentRecord[];
  readonly pendingOperations: readonly SurfacePendingOperation[];
}

export interface Wave2SurfaceAuditOutput {
  readonly runId: string;
  readonly waveId: 2;
  readonly inventoryRecords: readonly SpecializedInventoryRecord[];
  readonly matrixRows: readonly MatrixRow[];
  readonly evidenceRecords: readonly EvidenceRecord[];
  readonly findings: readonly OccurrenceFinding[];
  readonly copyProposals: readonly CopyProposalRecord[];
  readonly severityAssessments: readonly SeverityAssessmentRecord[];
  readonly pendingOperations: readonly SurfacePendingOperation[];
  readonly sourceErrors: readonly string[];
}

// ---------------------------------------------------------------------------
// Source graph scanner
// ---------------------------------------------------------------------------

export const WAVE2_SOURCE_ROOTS = [
  "site/app/(site)",
  "site/components/site",
  "site/components/contact",
  "site/components/products",
  "site/components/compare",
  "site/components/shared",
  "site/features/site",
  "site/features/shared/dashboard",
  "site/lib/analytics",
  "site/lib/consent.ts",
  "site/lib/seo",
  "site/lib/helpers/seo",
  "site/lib/catalog",
  "site/lib/auth",
] as const;

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".json"]);
const SKIPPED_DIRECTORIES = new Set([".next", "node_modules", ".git"]);
const MAX_SOURCE_FILES_PER_SUBJECT = 18;
const MAX_SIGNALS_PER_RECORD = 24;
const MAX_ATTRIBUTE_VALUES_PER_RECORD = 40;
const MAX_COPY_DEFECTS_PER_SOURCE = MAX_SIGNALS_PER_RECORD;
const MAX_SNIPPET_LENGTH = 220;

interface SourcePattern {
  readonly label: string;
  readonly expression: RegExp;
}

const SIGNAL_PATTERNS: Record<
  SurfaceInventoryKind | "journey",
  readonly SourcePattern[]
> = {
  state: [
    { label: "suspense-boundary", expression: /\bSuspense\b/ },
    { label: "fallback-prop", expression: /\bfallback\s*=/ },
    { label: "loading-boundary", expression: /\bloading\b|loading\.tsx/i },
    { label: "skeleton", expression: /skeleton|animate-pulse/i },
    { label: "empty-state", expression: /empty|no results|nothing matches/i },
    { label: "error-state", expression: /error|notFound|not-found/i },
    { label: "offline-state", expression: /offline|reconnect|network/i },
    { label: "retry-state", expression: /retry|reload|reset/i },
  ],
  link: [
    { label: "next-link", expression: /<Link\b/ },
    { label: "anchor-target", expression: /\bhref\s*=/i },
    { label: "router-action", expression: /router\.(push|replace|back)\s*\(/ },
    { label: "redirect-action", expression: /\bredirect\s*\(/ },
    { label: "fragment-target", expression: /href\s*=\s*["'][^"']*#/i },
    { label: "external-target", expression: /https?:\/\//i },
    { label: "download-target", expression: /download\s*=|\.pdf\b|\.csv\b/i },
    {
      label: "security-rel",
      expression: /rel\s*=\s*["'][^"']*noopener|noreferrer/i,
    },
  ],
  journey: [
    {
      label: "navigation-action",
      expression: /<Link\b|router\.(push|replace|back)|redirect\s*\(/,
    },
    { label: "form-transition", expression: /onSubmit|executeAsync|useAction/ },
    {
      label: "auth-transition",
      expression: /requireAuthUser|signIn|signOut|returnTo|return-to/i,
    },
    {
      label: "cancel-or-back",
      expression: /cancel|go back|router\.back|onCancel/i,
    },
    { label: "recovery-action", expression: /retry|reload|reconnect|reset/i },
  ],
  form: [
    { label: "form-element", expression: /<form\b/ },
    { label: "form-library", expression: /useForm|FormField|react-hook-form/ },
    {
      label: "submission-handler",
      expression: /onSubmit|executeAsync|useAction/,
    },
    {
      label: "validation-contract",
      expression: /zodResolver|validationErrors|schema/i,
    },
    { label: "required-control", expression: /\brequired\b|aria-required/ },
    {
      label: "invalid-state",
      expression: /aria-invalid|FormMessage|role\s*=\s*["']alert/i,
    },
    {
      label: "pending-state",
      expression: /isExecuting|isPending|Sending|Submitting|disabled\s*=/i,
    },
    {
      label: "success-state",
      expression: /onSuccess|success|role\s*=\s*["']status/i,
    },
    {
      label: "input-preservation",
      expression: /defaultValues|reset\(|setValue|preserve/i,
    },
  ],
  asset: [
    { label: "next-image", expression: /<Image\b/ },
    { label: "native-image", expression: /<img\b/ },
    { label: "svg", expression: /<svg\b|\.svg\b/i },
    { label: "video", expression: /<video\b|\.mp4\b|\.webm\b/i },
    {
      label: "asset-source",
      expression: /\bsrc\s*=|backgroundImage|\/assets\//i,
    },
    {
      label: "alternative-text",
      expression: /\balt\s*=|aria-label|aria-hidden/i,
    },
    {
      label: "fallback-asset",
      expression:
        /fallback|placeholder|DEFAULT_HERO_FALLBACK|PRODUCT_IMAGE_FALLBACK/i,
    },
    {
      label: "loading-strategy",
      expression: /priority\b|loading\s*=|sizes\s*=/i,
    },
    {
      label: "dimension-signal",
      expression: /width\s*=|height\s*=|aspect-|fill\b|viewBox/i,
    },
  ],
  "copy-ia": [
    { label: "heading", expression: /<h[1-6]\b|heading/i },
    { label: "label", expression: /<label\b|FormLabel|aria-label/i },
    {
      label: "call-to-action",
      expression:
        /CTA|primaryCta|secondaryCta|button|\bOpen\b|\bSend\b|\bView\b/i,
    },
    {
      label: "helper-or-instruction",
      expression: /helper|description|hint|placeholder|instructions?/i,
    },
    {
      label: "error-or-confirmation-copy",
      expression: /error|success|submitted|unable|try again|retry/i,
    },
    {
      label: "legal-reference",
      expression: /privacy|terms|policy|consent|retention/i,
    },
    {
      label: "information-architecture",
      expression: /navigation|breadcrumb|section|category|group|workspace/i,
    },
    {
      label: "design-system-token",
      expression:
        /typ-|home-|btn-|min-h-11|text-|bg-|border-|rounded-|@focss|surface-/i,
    },
    {
      label: "accessibility-semantics",
      expression: /aria-|role\s*=|<main\b|<label\b|tabIndex|skip/i,
    },
  ],
  seo: [
    {
      label: "metadata-function",
      expression: /generateMetadata|Metadata|buildPageMetadata/i,
    },
    { label: "canonical", expression: /canonical|alternates/i },
    { label: "robots-policy", expression: /robots|noindex|indexable/i },
    {
      label: "social-metadata",
      expression: /openGraph|twitter|og:image|twitter:card/i,
    },
    {
      label: "structured-data",
      expression: /application\/ld\+json|JsonLd|build.*JsonLd/i,
    },
    {
      label: "language-metadata",
      expression: /hreflang|languages|locale|language/i,
    },
    {
      label: "sitemap-contract",
      expression:
        /sitemap|PUBLIC_INDEXABLE_STATIC_PATHS|expectedStaticSitemapPaths/i,
    },
  ],
  "analytics-consent": [
    {
      label: "analytics-mount",
      expression: /Analytics|SpeedInsights|vercelTrack/i,
    },
    {
      label: "consent-gate",
      expression: /hasAnalyticsConsent|beforeSend|emitSiteEvent/i,
    },
    {
      label: "consent-cookie",
      expression: /oando_cookie_consent|CONSENT_(ACCEPTED|REJECTED)/i,
    },
    {
      label: "analytics-event",
      expression: /track[A-Z]|emit[A-Z].*Event|CONVERSION_EVENTS/i,
    },
    {
      label: "consent-state",
      expression:
        /accepted|rejected|withdrawn|customized|undecided|unavailable/i,
    },
  ],
  "security-privacy-message": [
    {
      label: "auth-boundary",
      expression: /requireAuthUser|getOptionalUser|unauthorized|forbidden/i,
    },
    {
      label: "session-boundary",
      expression: /session|expired|returnTo|return-to/i,
    },
    {
      label: "privacy-message",
      expression: /privacy|do not sell|personal data|contact details/i,
    },
    { label: "consent-message", expression: /consent|agree|permission/i },
    {
      label: "sanitization",
      expression: /sanitize|escape|redact|non-disclos/i,
    },
    {
      label: "external-service-message",
      expression: /WhatsApp|external|download|sharing|export/i,
    },
  ],
  "error-recovery": [
    {
      label: "error-boundary",
      expression: /error\.tsx|error-boundary|global-error/i,
    },
    { label: "not-found-boundary", expression: /not-found|notFound\s*\(/i },
    {
      label: "loading-boundary",
      expression: /loading\.tsx|Suspense|skeleton/i,
    },
    {
      label: "recovery-control",
      expression: /retry|reload|reconnect|reset|fallback/i,
    },
    {
      label: "logging-path",
      expression: /logClientError|console\.error|registerOTel|instrumentation/i,
    },
    {
      label: "motion-policy",
      expression: /reducedMotion|prefers-reduced-motion|gsapReducedMotion/i,
    },
    {
      label: "performance-feedback",
      expression: /preload|priority|animate-pulse|transition|progress/i,
    },
  ],
};

const ALL_SURFACE_INVENTORY_KINDS: readonly SurfaceInventoryKind[] = [
  "state",
  "link",
  "form",
  "asset",
  "copy-ia",
  "seo",
  "analytics-consent",
  "security-privacy-message",
  "error-recovery",
];

function sha256Short(...parts: readonly string[]): string {
  return createHash("sha256")
    .update(parts.join("\u0000"), "utf8")
    .digest("hex")
    .slice(0, 16);
}

function normalizeRelativePath(value: string): string {
  return value.replaceAll("\\", "/");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWave2Surface(value: string): value is Wave2Surface {
  return (WAVE2_SURFACES as readonly string[]).includes(value);
}

function isProductSurface(value: string): value is ProductSurface {
  return [
    ...WAVE2_SURFACES,
    "authentication",
    "legal",
    "administration",
    "planner",
    "studio",
    "offline",
    "shared-shell",
  ].includes(value);
}

function isSourceKind(value: string): ProvenanceReference["sourceKind"] {
  const kinds: readonly ProvenanceReference["sourceKind"][] = [
    "source",
    "repository-data",
    "contract",
    "internal-link",
    "tool",
    "runtime",
    "human-review",
  ];
  return kinds.includes(value as ProvenanceReference["sourceKind"])
    ? (value as ProvenanceReference["sourceKind"])
    : "source";
}

function copyString(value: string): string {
  return Buffer.from(value, "utf8").toString("utf8");
}

function redactSnippet(value: string): string {
  const redacted = value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email-redacted]")
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "[phone-redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SNIPPET_LENGTH);
  return copyString(redacted);
}

function snippetAt(content: string, index: number): string {
  const start = content.lastIndexOf("\n", index) + 1;
  const endIndex = content.indexOf("\n", index);
  const end = endIndex < 0 ? content.length : endIndex;
  return redactSnippet(content.slice(start, end));
}

function sourceMatches(
  content: string,
  patterns: readonly SourcePattern[],
): readonly SourceSignal[] {
  const matches: SourceSignal[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    const flags = pattern.expression.flags.includes("g")
      ? pattern.expression.flags
      : `${pattern.expression.flags}g`;
    const expression = new RegExp(pattern.expression.source, flags);
    const match = expression.exec(content);
    if (!match) continue;
    const snippet = snippetAt(content, match.index);
    const key = `${pattern.label}\u0000${snippet}`;
    if (seen.has(key)) continue;
    seen.add(key);
    matches.push({ label: pattern.label, snippet });
  }

  return Object.freeze(matches.slice(0, MAX_SIGNALS_PER_RECORD));
}

function sourceSignalsByKind(
  content: string,
): Readonly<Record<SourceSignalKind, readonly SourceSignal[]>> {
  return Object.freeze({
    state: sourceMatches(content, SIGNAL_PATTERNS.state),
    link: sourceMatches(content, SIGNAL_PATTERNS.link),
    journey: sourceMatches(content, SIGNAL_PATTERNS.journey),
    form: sourceMatches(content, SIGNAL_PATTERNS.form),
    asset: sourceMatches(content, SIGNAL_PATTERNS.asset),
    "copy-ia": sourceMatches(content, SIGNAL_PATTERNS["copy-ia"]),
    seo: sourceMatches(content, SIGNAL_PATTERNS.seo),
    "analytics-consent": sourceMatches(
      content,
      SIGNAL_PATTERNS["analytics-consent"],
    ),
    "security-privacy-message": sourceMatches(
      content,
      SIGNAL_PATTERNS["security-privacy-message"],
    ),
    "error-recovery": sourceMatches(content, SIGNAL_PATTERNS["error-recovery"]),
  });
}

function uniqueSignals(
  signals: readonly SourceSignal[],
): readonly SourceSignal[] {
  const seen = new Set<string>();
  const unique: SourceSignal[] = [];
  for (const signal of signals) {
    const key = `${signal.label}\u0000${signal.snippet}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(signal);
    if (unique.length >= MAX_SIGNALS_PER_RECORD) break;
  }
  return Object.freeze(unique);
}

function sourceSurface(relativePath: string): ProductSurface {
  const value = normalizeRelativePath(relativePath).toLowerCase();

  if (value.includes("/offline/") || value.endsWith("/offline"))
    return "offline";
  if (value.includes("/oostudio/") || value.includes("/studio/"))
    return "studio";
  if (value.includes("/ooplanner/") || value.includes("/planner/"))
    return "planner";
  if (value.includes("/admin/")) return "administration";
  if (
    value.includes("/features/shared/dashboard/") ||
    value.includes("/portal/") ||
    value.includes("/dashboard/") ||
    value.includes("/lib/auth/")
  ) {
    return "portal-dashboard";
  }
  if (
    value.includes("/components/products/") ||
    value.includes("/components/compare/") ||
    value.includes("/catalog/") ||
    value.includes("/lib/catalog/") ||
    value.includes("/products/") ||
    value.includes("/compare/")
  ) {
    return "catalog-configurator";
  }
  return "marketing";
}

function isSharedSource(relativePath: string): boolean {
  const value = normalizeRelativePath(relativePath).toLowerCase();
  return (
    value.includes("/components/site/") ||
    value.includes("/components/shared/") ||
    value.includes("/features/site/data/seo") ||
    value.includes("/lib/analytics/") ||
    value.endsWith("/lib/consent.ts") ||
    value.includes("/lib/seo/") ||
    value.includes("/lib/helpers/seo/")
  );
}

function isSupportedSourceFile(relativePath: string): boolean {
  return SOURCE_EXTENSIONS.has(path.extname(relativePath).toLowerCase());
}

async function collectSourceFiles(
  repositoryRoot: string,
  relativeRoot: string,
): Promise<readonly string[]> {
  const absoluteRoot = path.join(repositoryRoot, relativeRoot);
  const rootInfo = await stat(absoluteRoot);
  if (rootInfo.isFile()) {
    return isSupportedSourceFile(relativeRoot)
      ? Object.freeze([normalizeRelativePath(relativeRoot)])
      : Object.freeze([]);
  }

  const files: string[] = [];
  async function walk(
    absoluteDirectory: string,
    relativeDirectory: string,
  ): Promise<void> {
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      const absolutePath = path.join(absoluteDirectory, entry.name);
      const relativePath = normalizeRelativePath(
        path.join(relativeDirectory, entry.name),
      );
      if (entry.isDirectory()) {
        await walk(absolutePath, relativePath);
      } else if (entry.isFile() && isSupportedSourceFile(relativePath)) {
        files.push(relativePath);
      }
    }
  }

  await walk(absoluteRoot, normalizeRelativePath(relativeRoot));
  return Object.freeze(files.sort());
}

function countFormElements(content: string): number {
  const expression = /<form\b/g;
  let count = 0;
  while (expression.exec(content) !== null) count += 1;
  return count;
}

function scanSourceObservation(
  relativePath: string,
  content: string,
): SourceObservation {
  const observation: SourceObservation = {
    relativePath,
    signalsByKind: sourceSignalsByKind(content),
    attributeValues: Object.freeze({
      href: extractAttributeValues(content, "href"),
      name: extractAttributeValues(content, "name"),
      htmlFor: extractAttributeValues(content, "htmlFor"),
    }),
    formCount: countFormElements(content),
    staticCopyDefects: relativePath.endsWith(".tsx")
      ? extractStaticCopyDefects(relativePath, content)
      : Object.freeze([]),
  };

  return Object.freeze(observation);
}

async function readScopedSourceObservations(repositoryRoot: string): Promise<{
  readonly observations: readonly SourceObservation[];
  readonly errors: readonly string[];
}> {
  const relativePaths = new Set<string>();
  const errors: string[] = [];

  for (const relativeRoot of WAVE2_SOURCE_ROOTS) {
    try {
      const files = await collectSourceFiles(repositoryRoot, relativeRoot);
      files.forEach((file) => relativePaths.add(file));
    } catch (error) {
      errors.push(
        `${relativeRoot}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const observations: SourceObservation[] = [];
  for (const relativePath of [...relativePaths].sort()) {
    try {
      const content = await readFile(
        path.join(repositoryRoot, relativePath),
        "utf8",
      );
      observations.push(scanSourceObservation(relativePath, content));
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

// ---------------------------------------------------------------------------
// Route/instance subjects and extraction helpers
// ---------------------------------------------------------------------------

function scopedSubjects(
  discovery: CanonicalDiscoveryResult,
): readonly SurfaceSubject[] {
  const routes: SurfaceSubject[] = [];
  for (const route of discovery.routes) {
    const productSurface = route.productSurface;
    if (!isWave2Surface(productSurface)) continue;

    routes.push({
      subjectKind: "route",
      subjectId: route.routeId,
      routeId: route.routeId,
      routePattern: route.pattern,
      concreteUrl: route.concreteUrl ?? route.pattern,
      sourcePath: route.sourcePath,
      productSurface,
      status: route.status,
    });
  }

  const routeById = new Map(
    discovery.routes.map((route) => [route.routeId, route]),
  );
  const instances: SurfaceSubject[] = [];
  for (const instance of discovery.dynamicInstances) {
    const productSurface = instance.productSurface;
    if (!isWave2Surface(productSurface)) continue;

    const route = routeById.get(instance.routeId);
    instances.push({
      subjectKind: "dynamic-instance",
      subjectId: instance.instanceId,
      routeId: instance.routeId,
      routePattern: route?.pattern ?? instance.normalizedUrl,
      concreteUrl: instance.concreteUrl,
      sourcePath:
        route?.sourcePath ?? "site/app (dynamic instance source unavailable)",
      productSurface,
      status: instance.status,
    });
  }

  return Object.freeze(
    [...routes, ...instances].sort((left, right) =>
      `${left.productSurface}\u0000${left.subjectKind}\u0000${left.subjectId}`.localeCompare(
        `${right.productSurface}\u0000${right.subjectKind}\u0000${right.subjectId}`,
      ),
    ),
  );
}

function subjectObservations(
  subject: SurfaceSubject,
  observations: readonly SourceObservation[],
): readonly SourceObservation[] {
  const exact = observations.filter(
    (observation) => observation.relativePath === subject.sourcePath,
  );
  const candidates = observations
    .filter(
      (observation) =>
        observation.relativePath !== subject.sourcePath &&
        (isSharedSource(observation.relativePath) ||
          sourceSurface(observation.relativePath) === subject.productSurface),
    )
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  const selected = [...exact, ...candidates].slice(
    0,
    MAX_SOURCE_FILES_PER_SUBJECT,
  );
  return Object.freeze(selected);
}

function signalsForKind(
  observations: readonly SourceObservation[],
  kind: SurfaceInventoryKind | "journey",
): readonly SourceSignal[] {
  return uniqueSignals(
    observations.flatMap((observation) => observation.signalsByKind[kind]),
  );
}

function sourceLocations(
  observations: readonly SourceObservation[],
): readonly string[] {
  return Object.freeze(
    observations
      .map((observation) => observation.relativePath)
      .slice(0, MAX_SOURCE_FILES_PER_SUBJECT),
  );
}

function extractAttributeValues(
  content: string,
  attribute: string,
): readonly string[] {
  const values = new Set<string>();
  const expression = new RegExp(
    `\\b${attribute}\\s*=\\s*["']([^"']+)["']`,
    "gi",
  );
  for (const match of content.matchAll(expression)) {
    const value = match[1]?.trim();
    if (!value) continue;
    values.add(copyString(value));
    if (values.size >= MAX_ATTRIBUTE_VALUES_PER_RECORD) break;
  }
  return Object.freeze([...values]);
}

function attributeValuesForObservations(
  observations: readonly SourceObservation[],
  attribute: SourceAttributeName,
): readonly string[] {
  const values = new Set<string>();
  for (const observation of observations) {
    for (const value of observation.attributeValues[attribute]) {
      values.add(value);
      if (values.size >= MAX_ATTRIBUTE_VALUES_PER_RECORD) {
        return Object.freeze([...values]);
      }
    }
  }
  return Object.freeze([...values]);
}

function extractStaticCopyDefects(
  relativePath: string,
  content: string,
): readonly SourceCopyDefect[] {
  const defects: SourceCopyDefect[] = [];
  const addDefect = (currentText: string, evidenceSnippet: string): boolean => {
    if (!currentText || defects.length >= MAX_COPY_DEFECTS_PER_SOURCE)
      return false;
    defects.push({
      currentText,
      sourcePath: relativePath,
      evidenceSnippet,
    });
    return true;
  };

  const explicit = /@audit-copy-defect\s*:\s*([^\n*]+)/gi;
  for (const match of content.matchAll(explicit)) {
    const currentText = redactSnippet(match[1] ?? "");
    addDefect(currentText, snippetAt(content, match.index ?? 0));
    if (defects.length >= MAX_COPY_DEFECTS_PER_SOURCE) break;
  }

  if (defects.length < MAX_COPY_DEFECTS_PER_SOURCE) {
    const placeholders = /\b(?:lorem ipsum|TODO_COPY|FIXME_COPY)\b/gi;
    for (const match of content.matchAll(placeholders)) {
      const line = snippetAt(content, match.index ?? 0);
      if (!line || /^\s*(?:\/\/|\*|\/\*)/.test(line)) continue;
      addDefect(redactSnippet(match[0] ?? ""), line);
      if (defects.length >= MAX_COPY_DEFECTS_PER_SOURCE) break;
    }
  }

  return Object.freeze(defects);
}

function extractCopyDefects(
  subject: SurfaceSubject,
  observations: readonly SourceObservation[],
): readonly StaticCopyDefect[] {
  const defects: StaticCopyDefect[] = [];
  const seen = new Set<string>();
  for (const observation of observations) {
    for (const defect of observation.staticCopyDefects) {
      const defectId = `copy-defect.${sha256Short(subject.subjectId, defect.sourcePath, defect.currentText)}`;
      if (seen.has(defectId)) continue;
      seen.add(defectId);
      defects.push({
        defectId,
        currentText: defect.currentText,
        sourcePath: defect.sourcePath,
        evidenceSnippet: defect.evidenceSnippet,
      });
      if (defects.length >= MAX_COPY_DEFECTS_PER_SOURCE) {
        return Object.freeze(defects);
      }
    }
  }

  return Object.freeze(defects);
}

interface StaticCopyDefect {
  readonly defectId: string;
  readonly currentText: string;
  readonly sourcePath: string;
  readonly evidenceSnippet: string;
}

function staticDefectsForRecord(
  record: SpecializedInventoryRecord,
): readonly StaticCopyDefect[] {
  const value = record.payload.staticDefects;
  if (!Array.isArray(value)) return Object.freeze([]);
  const defects: StaticCopyDefect[] = [];
  for (const candidate of value) {
    if (!isRecord(candidate)) continue;
    if (
      typeof candidate.defectId !== "string" ||
      typeof candidate.currentText !== "string" ||
      typeof candidate.sourcePath !== "string" ||
      typeof candidate.evidenceSnippet !== "string"
    )
      continue;
    defects.push({
      defectId: candidate.defectId,
      currentText: candidate.currentText,
      sourcePath: candidate.sourcePath,
      evidenceSnippet: candidate.evidenceSnippet,
    });
  }
  return Object.freeze(defects);
}

function indexingPolicy(subject: SurfaceSubject): {
  readonly expected: "index" | "noindex" | "owner-review";
  readonly rationale: string;
} {
  const route = subject.routePattern.toLowerCase();
  if (
    route.startsWith("/portal") ||
    route.startsWith("/dashboard") ||
    route === "/quote-cart" ||
    route === "/access" ||
    route === "/choose-product"
  ) {
    return {
      expected: "noindex",
      rationale:
        "Protected, account-entry, or transactional workspace content should not be indexed as public search content.",
    };
  }
  if (
    route === "/offline" ||
    route.includes("error") ||
    route.includes("not-found")
  ) {
    return {
      expected: "noindex",
      rationale:
        "Offline and error-only presentations are recovery surfaces, not canonical public search destinations.",
    };
  }
  if (subject.status === "protected") {
    return {
      expected: "noindex",
      rationale:
        "The discovered route is protected by the route/access contract.",
    };
  }
  return {
    expected: "index",
    rationale:
      "The route is a public marketing or catalog destination and should follow the public sitemap/metadata contract.",
  };
}

function payloadForKind(
  subject: SurfaceSubject,
  kind: SurfaceInventoryKind,
  observations: readonly SourceObservation[],
): Record<string, unknown> {
  // The scanner has already discarded file text; only bounded derived facts
  // reach payload construction and downstream inventory records.
  const matches = signalsForKind(observations, kind);
  const locations = sourceLocations(observations);
  const payload: Record<string, unknown> = {
    subjectKind: subject.subjectKind,
    subjectId: subject.subjectId,
    routeId: subject.routeId,
    routePattern: subject.routePattern,
    concreteUrl: subject.concreteUrl,
    routeStatus: subject.status,
    sourceOnly: true,
    sourceFiles: locations,
    sourceSignalCount: matches.length,
    sourceMatches: matches.map((match) => ({
      label: match.label,
      snippet: match.snippet,
    })),
    staticRuntimeBoundary:
      "Source declarations establish expectations only; rendered, network, assistive-technology, hosted, and delivery behavior remains pending.",
  };

  if (kind === "state") {
    payload.stateSignals = matches.map((match) => match.label);
    payload.fallbackSignals = matches
      .filter((match) =>
        /fallback|skeleton|empty|error|offline|retry/i.test(match.label),
      )
      .map((match) => match.label);
    payload.perceivedPerformanceSignals = signalsForKind(
      observations,
      "error-recovery",
    )
      .filter((match) =>
        /loading|skeleton|performance|motion/i.test(match.label),
      )
      .map((match) => match.label);
  }

  if (kind === "link") {
    const hrefValues = attributeValuesForObservations(observations, "href");
    payload.internalTargets = hrefValues.filter(
      (value) => value.startsWith("/") || value.startsWith("#"),
    );
    payload.externalTargets = hrefValues.filter((value) =>
      /^https?:\/\//i.test(value),
    );
    payload.fragmentTargets = hrefValues.filter((value) => value.includes("#"));
    payload.downloadSignals = matches
      .filter((match) => /download/i.test(match.label))
      .map((match) => match.snippet);
    payload.securitySignals = matches
      .filter((match) => /security/i.test(match.label))
      .map((match) => match.snippet);
  }

  if (kind === "form") {
    payload.formCount = observations.reduce(
      (total, observation) => total + observation.formCount,
      0,
    );
    payload.fieldNames = attributeValuesForObservations(observations, "name");
    payload.labels = attributeValuesForObservations(observations, "htmlFor");
    payload.requiredFields = matches
      .filter((match) => /required|validation/i.test(match.label))
      .map((match) => match.label);
    payload.submissionSignals = matches
      .filter((match) =>
        /submission|success|pending|invalid/i.test(match.label),
      )
      .map((match) => match.label);
    payload.pendingSuccessErrorContract = {
      pending: matches.some((match) => match.label === "pending-state"),
      success: matches.some((match) => match.label === "success-state"),
      error: matches.some((match) => match.label === "invalid-state"),
      inputPreservation: matches.some(
        (match) => match.label === "input-preservation",
      ),
    };
  }

  if (kind === "asset") {
    payload.mediaTypes = matches
      .filter((match) => /image|native|svg|video/i.test(match.label))
      .map((match) => match.label);
    payload.alternativeTextSignals = matches
      .filter((match) => /alternative/i.test(match.label))
      .map((match) => match.label);
    payload.fallbackSignals = matches
      .filter((match) => /fallback/i.test(match.label))
      .map((match) => match.label);
    payload.loadingSignals = matches
      .filter((match) => /loading/i.test(match.label))
      .map((match) => match.label);
    payload.dimensionSignals = matches
      .filter((match) => /dimension/i.test(match.label))
      .map((match) => match.label);
    payload.licensingAndOwnership =
      "Not established by source inspection; owner/licensing review remains a coverage gap where required.";
  }

  if (kind === "copy-ia") {
    const defects = extractCopyDefects(subject, observations);
    payload.headingSignals = matches
      .filter((match) => match.label === "heading")
      .map((match) => match.snippet);
    payload.labelSignals = matches
      .filter((match) => match.label === "label")
      .map((match) => match.snippet);
    payload.callToActionSignals = matches
      .filter((match) => match.label === "call-to-action")
      .map((match) => match.snippet);
    payload.legalReferenceSignals = matches
      .filter((match) => match.label === "legal-reference")
      .map((match) => match.snippet);
    payload.designSystemSignals = matches
      .filter((match) => match.label === "design-system-token")
      .map((match) => match.snippet);
    payload.accessibilitySignals = matches
      .filter((match) => match.label === "accessibility-semantics")
      .map((match) => match.snippet);
    payload.staticDefects = defects;
    payload.copyReviewBoundary =
      "No wording is approved or changed by this source-only inventory; Hindi requires named translation ownership and human review unless approved wording is supplied separately.";
  }

  if (kind === "seo") {
    const policy = indexingPolicy(subject);
    payload.metadataSignals = matches.map((match) => match.label);
    payload.canonicalSignals = matches
      .filter((match) => /canonical/i.test(match.label))
      .map((match) => match.label);
    payload.socialSignals = matches
      .filter((match) => /social/i.test(match.label))
      .map((match) => match.label);
    payload.structuredDataSignals = matches
      .filter((match) => /structured/i.test(match.label))
      .map((match) => match.label);
    payload.sitemapSignals = matches
      .filter((match) => /sitemap/i.test(match.label))
      .map((match) => match.label);
    payload.expectedIndexingPolicy = policy.expected;
    payload.indexingRationale = policy.rationale;
    payload.instanceIdentity = {
      subjectKind: subject.subjectKind,
      subjectId: subject.subjectId,
      routeId: subject.routeId,
      concreteUrl: subject.concreteUrl,
    };
  }

  if (kind === "analytics-consent") {
    payload.analyticsSignals = matches
      .filter((match) => /analytics|event/i.test(match.label))
      .map((match) => match.label);
    payload.consentSignals = matches
      .filter((match) => /consent/i.test(match.label))
      .map((match) => match.label);
    payload.consentStates = [
      "undecided",
      "accepted",
      "rejected",
      "customized",
      "withdrawn",
      "unavailable",
    ];
    payload.deliveryConclusion =
      "Not established by source inspection; authorized analytics/consent work remains pending.";
  }

  if (kind === "security-privacy-message") {
    payload.authSignals = matches
      .filter((match) => /auth|session/i.test(match.label))
      .map((match) => match.label);
    payload.privacySignals = matches
      .filter((match) => /privacy|consent|external/i.test(match.label))
      .map((match) => match.label);
    payload.accessBoundary =
      subject.productSurface === "portal-dashboard"
        ? "portal-dashboard requires authenticated-customer or authenticated-admin access; public evidence cannot substitute for protected contexts."
        : "Public marketing/catalog access remains distinct from protected portal/dashboard access.";
    payload.legalConclusion = false;
  }

  if (kind === "error-recovery") {
    payload.boundarySignals = matches
      .filter((match) => /boundary|not-found|loading|error/i.test(match.label))
      .map((match) => match.label);
    payload.recoverySignals = matches
      .filter((match) => /recovery|logging|motion/i.test(match.label))
      .map((match) => match.label);
    payload.perceivedPerformanceSignals = matches
      .filter((match) => /performance|loading|motion/i.test(match.label))
      .map((match) => match.label);
    payload.runtimeErrorConclusion =
      "Source-visible handling is an expectation, not runtime verification.";
  }

  return payload;
}

function inventoryProvenance(
  subject: SurfaceSubject,
  locations: readonly string[],
  discoveredAt: string,
): ProvenanceReference[] {
  const sourceLocations =
    locations.length > 0 ? locations : [subject.sourcePath];
  return sourceLocations
    .slice(0, MAX_SOURCE_FILES_PER_SUBJECT)
    .map((location) => ({
      sourceId: "source.wave2.surface-graph",
      sourceKind: "source" as const,
      location,
      discoveredAt,
      authorityRank: 10,
    }));
}

function createSubjectInventory(
  subject: SurfaceSubject,
  kind: SurfaceInventoryKind,
  observations: readonly SourceObservation[],
  discoveredAt: string,
): SpecializedInventoryRecord {
  const locations = sourceLocations(observations);
  const inventoryId = `inv.wave2.${kind}.${sha256Short(subject.subjectId, kind)}`;
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "specialized-inventory",
    recordId: `record.${inventoryId}`,
    createdAt: discoveredAt,
    inventoryId,
    inventoryKind: kind,
    owner:
      kind === "security-privacy-message"
        ? "security-and-privacy-owner"
        : kind === "analytics-consent"
          ? "privacy-and-analytics-owner"
          : kind === "seo"
            ? "search-and-metadata-owner"
            : `${subject.productSurface}-surface-owner`,
    sourceLocator: subject.sourcePath,
    productSurface: subject.productSurface,
    provenance: inventoryProvenance(subject, locations, discoveredAt),
    applicableOccurrenceSelector: {
      subjectIds: [subject.subjectId],
      stateIds: [],
      viewportIds: [],
      browserIds: [],
      accessContextIds: [],
      languageIds: [],
    },
    status: "canonical",
    payload: payloadForKind(subject, kind, observations),
    coverageGapIds: [],
  };
}

function journeySurfacesAreScoped(journey: JourneyRecord): boolean {
  const surfaces = new Set(journey.payload.surfacesTraversed);
  const hasScopedSurface = [...surfaces].some((surface) =>
    isWave2Surface(surface),
  );
  const hasOutOfWave2Surface = [...surfaces].some((surface) =>
    ["administration", "planner", "studio", "offline"].includes(surface),
  );
  return hasScopedSurface && !hasOutOfWave2Surface;
}

function journeyMatchesSubject(
  journey: JourneyRecord,
  subject: SurfaceSubject,
): boolean {
  return journey.payload.nodes.some(
    (node) =>
      node.route === subject.routePattern ||
      node.route === subject.concreteUrl ||
      journey.payload.entryRoute === subject.routePattern ||
      journey.payload.terminalRoute === subject.routePattern,
  );
}

function normalizeJourneyRecord(
  journey: JourneyRecord,
  subjects: readonly SurfaceSubject[],
): SpecializedInventoryRecord {
  const subjectIds = subjects
    .filter((subject) => journeyMatchesSubject(journey, subject))
    .map((subject) => subject.subjectId);
  return {
    ...journey,
    productSurface: isProductSurface(journey.productSurface)
      ? journey.productSurface
      : "marketing",
    provenance: journey.provenance.map((reference) => ({
      ...reference,
      sourceKind: isSourceKind(reference.sourceKind),
    })),
    applicableOccurrenceSelector: {
      subjectIds,
      stateIds: [...journey.applicableOccurrenceSelector.stateIds],
      viewportIds: [...journey.applicableOccurrenceSelector.viewportIds],
      browserIds: [...journey.applicableOccurrenceSelector.browserIds],
      accessContextIds: [
        ...journey.applicableOccurrenceSelector.accessContextIds,
      ],
      languageIds: [...journey.applicableOccurrenceSelector.languageIds],
    },
    coverageGapIds: [...journey.coverageGapIds],
    payload: { ...journey.payload },
  };
}

export async function buildSurfaceInventories(
  repositoryRoot: string,
  discoveredAt: string,
  discovery: CanonicalDiscoveryResult,
): Promise<SurfaceInventoryBuildResult> {
  const { observations, errors } =
    await readScopedSourceObservations(repositoryRoot);
  const subjects = scopedSubjects(discovery);
  const records: SpecializedInventoryRecord[] = [];

  for (const subject of subjects) {
    const subjectSource = subjectObservations(subject, observations);
    for (const kind of ALL_SURFACE_INVENTORY_KINDS) {
      records.push(
        createSubjectInventory(subject, kind, subjectSource, discoveredAt),
      );
    }
  }

  const journeys = buildJourneyInventory(discoveredAt)
    .filter(journeySurfacesAreScoped)
    .map((journey) => normalizeJourneyRecord(journey, subjects));
  records.push(...journeys);

  return Object.freeze({
    records: Object.freeze(
      records.sort((left, right) =>
        left.inventoryId.localeCompare(right.inventoryId),
      ),
    ),
    journeys: Object.freeze(
      journeys.sort((left, right) =>
        left.inventoryId.localeCompare(right.inventoryId),
      ),
    ),
    subjects,
    sourceFilesScanned: observations.length,
    sourceErrors: errors,
  });
}

// ---------------------------------------------------------------------------
// Occurrence evidence and finding generation
// ---------------------------------------------------------------------------

const DIMENSION_INVENTORY_KINDS: Readonly<
  Partial<Record<AuditDimensionId, SurfaceInventoryKind>>
> = {
  "dim.route-link-integrity": "link",
  "dim.fallback-state": "state",
  "dim.copy-ia": "copy-ia",
  "dim.forms": "form",
  "dim.assets": "asset",
  "dim.metadata-seo": "seo",
  "dim.analytics-consent": "analytics-consent",
  "dim.security-privacy": "security-privacy-message",
  "dim.runtime-errors": "error-recovery",
  "dim.performance": "error-recovery",
  "dim.responsive-layout": "error-recovery",
  "dim.accessibility": "copy-ia",
  "dim.visual-design": "copy-ia",
};

const DIMENSION_REQUIREMENTS: Record<AuditDimensionId, readonly string[]> = {
  "dim.route-link-integrity": [
    "5.1",
    "5.2",
    "5.3",
    "5.4",
    "5.5",
    "5.6",
    "5.7",
    "5.8",
  ],
  "dim.navigation-journeys": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7"],
  "dim.fallback-state": ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7"],
  "dim.copy-ia": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8"],
  "dim.responsive-layout": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7"],
  "dim.accessibility": [
    "10.1",
    "10.2",
    "10.3",
    "10.4",
    "10.5",
    "10.6",
    "10.7",
    "10.8",
  ],
  "dim.visual-design": ["11.1", "11.2", "11.3", "11.4", "11.5", "11.6", "11.7"],
  "dim.forms": ["12.1", "12.2", "12.3", "12.4", "12.5", "12.6", "12.7", "12.8"],
  "dim.assets": ["13.1", "13.2", "13.3", "13.4", "13.5", "13.6", "13.7"],
  "dim.metadata-seo": [
    "14.1",
    "14.2",
    "14.3",
    "14.4",
    "14.5",
    "14.6",
    "14.7",
    "14.8",
  ],
  "dim.performance": ["15.1", "15.2", "15.3", "15.4", "15.5", "15.6", "15.7"],
  "dim.runtime-errors": [
    "16.1",
    "16.2",
    "16.3",
    "16.4",
    "16.5",
    "16.6",
    "16.7",
  ],
  "dim.analytics-consent": [
    "17.1",
    "17.2",
    "17.3",
    "17.4",
    "17.5",
    "17.6",
    "17.7",
    "17.8",
  ],
  "dim.security-privacy": [
    "18.1",
    "18.2",
    "18.3",
    "18.4",
    "18.5",
    "18.6",
    "18.7",
  ],
};

const DIMENSION_EXPECTATIONS: Record<AuditDimensionId, string> = {
  "dim.route-link-integrity":
    "Every source-visible internal, external, fragment, download, and action target should have a traceable destination and ownership contract for this occurrence.",
  "dim.navigation-journeys":
    "The occurrence should preserve the documented primary-journey transition, surface boundary, access boundary, return path, and terminal outcome.",
  "dim.fallback-state":
    "Loading, empty, error, not-found, offline, and recovery states should explain the condition, preserve relevant context, and offer a valid next action.",
  "dim.copy-ia":
    "Headings, labels, calls to action, helper text, errors, confirmations, legal references, and grouping should be clear and audience-appropriate.",
  "dim.responsive-layout":
    "The occurrence should remain reachable and semantically equivalent across its declared viewport and browser profile without clipping or hidden actions.",
  "dim.accessibility":
    "The source contract should provide semantic structure, accessible names, status/error relationships, keyboard alternatives, and reduced-motion intent for the occurrence.",
  "dim.visual-design":
    "The occurrence should use the repository design-system tokens, components, spacing, states, and surface hierarchy consistently.",
  "dim.forms":
    "Every form control should have an associated label, validation contract, pending feedback, input preservation, success state, and recoverable failure path.",
  "dim.assets":
    "Every user-visible asset should have source ownership, meaningful alternative treatment, stable dimensions/loading, and a documented fallback where applicable.",
  "dim.metadata-seo":
    "The route instance should have source-visible title, description, canonical, robots/indexing, language, social, sitemap, and structured-data policy appropriate to its audience.",
  "dim.performance":
    "Loading feedback, skeleton fidelity, layout reservation, progressive disclosure, motion policy, and perceived-performance budgets should be explicitly supported without inferred measurements.",
  "dim.runtime-errors":
    "Error, not-found, loading, logging, offline, retry, and recovery contracts should contain failures without exposing sensitive implementation details.",
  "dim.analytics-consent":
    "Analytics events and automatic insights should remain consent-gated, purpose-bound, unique, minimized, and suppressible for every consent state.",
  "dim.security-privacy":
    "Authentication, authorization, privacy, consent, sharing, contact-data, and protected-context messages should disclose consequences without revealing protected information.",
};

const DIMENSION_OWNERS: Record<AuditDimensionId, string> = {
  "dim.route-link-integrity": "site-navigation-owner",
  "dim.navigation-journeys": "journey-owner",
  "dim.fallback-state": "site-platform-runtime-owner",
  "dim.copy-ia": "content-and-information-architecture-owner",
  "dim.responsive-layout": "site-ui-owner",
  "dim.accessibility": "accessibility-owner",
  "dim.visual-design": "design-system-owner",
  "dim.forms": "forms-and-sales-operations-owner",
  "dim.assets": "asset-and-content-owner",
  "dim.metadata-seo": "search-and-metadata-owner",
  "dim.performance": "site-platform-performance-owner",
  "dim.runtime-errors": "site-platform-runtime-owner",
  "dim.analytics-consent": "privacy-and-analytics-owner",
  "dim.security-privacy": "security-and-privacy-owner",
};

const DIMENSION_DEPENDENCIES: Record<AuditDimensionId, readonly string[]> = {
  "dim.route-link-integrity": [
    "authorized browser/link inspection",
    "external destination owner where applicable",
  ],
  "dim.navigation-journeys": [
    "authorized browser workflow",
    "journey owner review",
  ],
  "dim.fallback-state": [
    "safe loading/error/offline fixtures",
    "authorized browser workflow",
  ],
  "dim.copy-ia": [
    "content owner review",
    "approved Hindi translation owner where localized",
  ],
  "dim.responsive-layout": ["authorized browser profiles", "viewport fixtures"],
  "dim.accessibility": [
    "authorized keyboard/browser workflow",
    "human or assistive-technology review",
  ],
  "dim.visual-design": [
    "authorized visual/browser review",
    "design-system owner comparison",
  ],
  "dim.forms": ["safe form fixtures", "authorized browser workflow"],
  "dim.assets": [
    "asset inventory/availability review",
    "content or licensing owner",
  ],
  "dim.metadata-seo": [
    "authorized rendered metadata fetch",
    "sitemap/structured-data review",
  ],
  "dim.performance": [
    "frozen performance profile and budget",
    "authorized performance runner",
  ],
  "dim.runtime-errors": [
    "safe error/recovery fixtures",
    "authorized browser/network workflow",
  ],
  "dim.analytics-consent": [
    "consent fixture",
    "authorized analytics inspection without personal data",
  ],
  "dim.security-privacy": [
    "security/privacy owner review",
    "authorized protected-context workflow",
  ],
};

function inventoryPayloadString(
  record: SpecializedInventoryRecord,
  key: string,
): string | undefined {
  const value = record.payload[key];
  return typeof value === "string" ? value : undefined;
}

function inventoryPayloadNumber(
  record: SpecializedInventoryRecord,
  key: string,
): number {
  const value = record.payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function inventoryPayloadStringArray(
  record: SpecializedInventoryRecord,
  key: string,
): readonly string[] {
  const value = record.payload[key];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function inventoryPayloadSignalSummaries(
  record: SpecializedInventoryRecord,
  key: string,
): readonly string[] {
  const value = record.payload[key];
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const label = typeof entry.label === "string" ? entry.label : "";
    const snippet = typeof entry.snippet === "string" ? entry.snippet : "";
    const summary = [label, snippet].filter(Boolean).join(": ");
    return summary ? [summary] : [];
  });
}

function inventoryRecordsForOccurrence(
  records: readonly SpecializedInventoryRecord[],
  occurrence: OccurrenceRecord,
  kind: SurfaceInventoryKind,
): readonly SpecializedInventoryRecord[] {
  return Object.freeze(
    records.filter((record) => {
      if (record.inventoryKind !== kind) return false;
      if (record.productSurface !== occurrence.productSurface) return false;
      const subjectIds = record.applicableOccurrenceSelector.subjectIds ?? [];
      return (
        subjectIds.length === 0 || subjectIds.includes(occurrence.subjectId)
      );
    }),
  );
}

function subjectRouteId(
  records: readonly SpecializedInventoryRecord[],
  occurrence: OccurrenceRecord,
): string | undefined {
  const record = records.find(
    (candidate) =>
      (candidate.applicableOccurrenceSelector.subjectIds ?? []).includes(
        occurrence.subjectId,
      ) && typeof candidate.payload.routeId === "string",
  );
  return record ? inventoryPayloadString(record, "routeId") : undefined;
}

function journeyRecordsForOccurrence(
  journeys: readonly SpecializedInventoryRecord[],
  records: readonly SpecializedInventoryRecord[],
  occurrence: OccurrenceRecord,
): readonly SpecializedInventoryRecord[] {
  const routePattern = records.find((record) =>
    (record.applicableOccurrenceSelector.subjectIds ?? []).includes(
      occurrence.subjectId,
    ),
  )?.payload.routePattern;
  const pattern =
    typeof routePattern === "string" ? routePattern : occurrence.concreteUrl;
  return Object.freeze(
    journeys.filter((journey) => {
      const subjectIds = journey.applicableOccurrenceSelector.subjectIds ?? [];
      if (subjectIds.includes(occurrence.subjectId)) return true;
      if (subjectIds.length > 0) return false;
      const nodes = Array.isArray(journey.payload.nodes)
        ? journey.payload.nodes
        : [];
      return (
        nodes.some(
          (node: unknown) =>
            typeof node === "object" &&
            node !== null &&
            "route" in node &&
            (node as { route: string }).route === pattern,
        ) ||
        journey.payload.entryRoute === pattern ||
        journey.payload.terminalRoute === pattern
      );
    }),
  );
}

function relevantShellIds(
  shells: readonly DiscoveredShell[],
  records: readonly SpecializedInventoryRecord[],
  occurrence: OccurrenceRecord,
): readonly string[] {
  const routeId =
    subjectRouteId(records, occurrence) ??
    (occurrence.subjectKind === "route" ? occurrence.subjectId : undefined);
  if (!routeId) return Object.freeze([]);
  return Object.freeze(
    shells
      .filter((shell) => shell.routeIds.includes(routeId))
      .map((shell) => shell.shellId)
      .sort(),
  );
}

function dimensionSourceRecords(
  dimension: AuditDimensionId,
  records: readonly SpecializedInventoryRecord[],
  journeys: readonly SpecializedInventoryRecord[],
  occurrence: OccurrenceRecord,
): readonly SpecializedInventoryRecord[] {
  if (dimension === "dim.navigation-journeys") {
    return journeyRecordsForOccurrence(journeys, records, occurrence);
  }
  const kind = DIMENSION_INVENTORY_KINDS[dimension];
  return kind
    ? inventoryRecordsForOccurrence(records, occurrence, kind)
    : Object.freeze([]);
}

function sourceSignalCount(
  dimension: AuditDimensionId,
  sourceRecords: readonly SpecializedInventoryRecord[],
): number {
  if (dimension === "dim.navigation-journeys") {
    return sourceRecords.length;
  }
  return sourceRecords.reduce(
    (total, record) =>
      total + inventoryPayloadNumber(record, "sourceSignalCount"),
    0,
  );
}

function sourceLocationsForRecords(
  sourceRecords: readonly SpecializedInventoryRecord[],
): readonly string[] {
  const locations = new Set<string>();
  for (const record of sourceRecords) {
    locations.add(record.sourceLocator);
    for (const location of inventoryPayloadStringArray(record, "sourceFiles")) {
      locations.add(location);
    }
  }
  return Object.freeze(
    [...locations].sort().slice(0, MAX_SOURCE_FILES_PER_SUBJECT),
  );
}

function sourceObservationForRecords(
  dimension: AuditDimensionId,
  sourceRecords: readonly SpecializedInventoryRecord[],
  count: number,
): string {
  if (count === 0) {
    return `No source-visible ${dimension} declaration was matched for this route/instance subject in the approved Wave 2 source roots.`;
  }
  const locations = sourceLocationsForRecords(sourceRecords);
  const summaries = sourceRecords
    .flatMap((record) =>
      inventoryPayloadSignalSummaries(record, "sourceMatches").slice(0, 3),
    )
    .slice(0, 6);
  const summary =
    summaries.length > 0 ? ` Signals: ${summaries.join("; ")}.` : "";
  return `Static source observation only: ${count} ${dimension} signal(s) were found for this route/instance subject at ${locations.join(", ") || "the approved source roots"}.${summary} Rendered and runtime behavior remains unverified.`;
}

function occurrenceContext(occurrence: OccurrenceRecord): string {
  return `occurrence ${occurrence.occurrenceId} (${occurrence.concreteUrl}; state=${occurrence.stateId}; viewport=${occurrence.viewportId}; browser=${occurrence.browserId}; access=${occurrence.accessId}; language=${occurrence.languageId})`;
}

function pendingOperation(
  dimension: AuditDimensionId,
  occurrence: OccurrenceRecord,
): SurfacePendingOperation {
  const context = occurrenceContext(occurrence);
  const exactOperation = `Authorized Wave 2 inspection for ${context}: evaluate ${DIMENSION_EXPECTATIONS[dimension]} Use only the matching route, access context, viewport, browser, language, fixture, and consent profile; do not execute until this exact operation is authorized and the enabled hook permits it.`;
  return {
    operationId: `op.wave2.${sha256Short(dimension, occurrence.occurrenceId)}`,
    exactOperation,
    dimension,
    occurrenceId: occurrence.occurrenceId,
    stateId: occurrence.stateId,
    viewportId: occurrence.viewportId,
    browserId: occurrence.browserId,
    accessContextId: occurrence.accessId,
    languageId: occurrence.languageId,
    requiredAuthorization: `Exact current-session authorization for the Wave 2 ${dimension} operation, with the occurrence selector above and a permitting hook decision; protected credentials, fixtures, network, analytics, and hosted access must be named separately where applicable.`,
    resultWhenUnauthorized: "not-run",
  };
}

function blockerForOperation(
  operation: SurfacePendingOperation,
): BlockerDetail {
  return {
    blockerKind: "authorization",
    detail:
      "The source-only Wave 2 implementation has no exact current-session authorization or permitting hook decision for this protected or rendered-behavior check.",
    pendingOperation: operation.exactOperation,
    owner: DIMENSION_OWNERS[operation.dimension],
  };
}

function notApplicableEvidence(
  occurrence: OccurrenceRecord,
  dimension: AuditDimensionId,
  rationale: string,
  createdAt: string,
): EvidenceRecord {
  const evidenceId = `evidence.${sha256Short(occurrence.occurrenceId, dimension, "not-applicable")}`;
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
    auditDimension: dimension,
    expectedResult: DIMENSION_EXPECTATIONS[dimension],
    observedResult: rationale,
    claimBasis: "source-observed",
    resultClassification: "not-applicable",
    severity: "not-applicable",
    severityRationale:
      "The frozen profile applicability rules exclude this dimension for this occurrence.",
    userImpact:
      "No conclusion is drawn for a dimension that does not apply to this occurrence.",
    evidenceLane: "static-inspection",
    evidenceType: "profile-applicability-decision",
    sourceOrRuntimeLocation: "scripts/site-ui-content-links-audit/profiles.ts",
    capturedAt: createdAt,
    reproductionSteps: [
      `Review ${occurrence.occurrenceId} and its frozen applicability decision.`,
      "Do not substitute another state, access context, viewport, browser, or language occurrence.",
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
      "Retain the explicit not-applicable rationale and preserve the route/instance identity.",
    likelyOwner: "audit-program-owner",
    dependencies: [],
    verificationMethod:
      "Static profile applicability review; no runtime claim is made.",
    notApplicableRationale: rationale,
  };
}

function createCopyProposal(
  defect: StaticCopyDefect,
  subject: SurfaceSubject,
  createdAt: string,
): CopyProposalRecord {
  const proposalId = `proposal.wave2.copy.${sha256Short(defect.defectId, subject.subjectId)}`;
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "copy-proposal",
    recordId: `record.${proposalId}`,
    createdAt,
    proposalId,
    currentText: defect.currentText,
    finalEnglishText: "Explore office furniture solutions for your workplace.",
    placement: `${defect.sourcePath} user-visible copy region for ${subject.routePattern}`,
    intent:
      "Replace the statically identified placeholder or review marker with complete, audience-appropriate English copy while retaining the route's product and business purpose.",
    applicableState: "state.default",
    preservedFacts: [
      "The proposal does not alter product facts, catalog identity, or INR pricing context.",
      "Legal meaning and consent obligations remain unchanged and require content-owner review.",
      `Static source evidence is retained at ${defect.sourcePath}.`,
    ],
    hindiNote: {
      translationRequired: true,
      translationOwner: "named-content-translation-owner",
      humanReviewRequired: true,
      reviewNotes:
        "No approved Hindi wording was supplied by the source evidence. A qualified human translator must produce and review the Hindi equivalent before publication; machine output is not approval.",
    },
  };
}

function evidenceForDimension(
  occurrence: OccurrenceRecord,
  dimension: AuditDimensionId,
  sourceRecords: readonly SpecializedInventoryRecord[],
  journeys: readonly SpecializedInventoryRecord[],
  shells: readonly DiscoveredShell[],
  allRecords: readonly SpecializedInventoryRecord[],
  subject: SurfaceSubject | undefined,
  createdAt: string,
  copyProposals: Map<string, CopyProposalRecord>,
): {
  readonly evidence: EvidenceRecord;
  readonly operation?: SurfacePendingOperation;
} {
  const evidenceId = `evidence.${sha256Short(occurrence.occurrenceId, dimension)}`;
  const signalCount = sourceSignalCount(dimension, sourceRecords);
  const sourceLocations = sourceLocationsForRecords(sourceRecords);
  const defects = sourceRecords.flatMap(staticDefectsForRecord);
  const defect = dimension === "dim.copy-ia" ? defects[0] : undefined;
  const subjectProductSurface: Wave2Surface = isWave2Surface(
    occurrence.productSurface,
  )
    ? occurrence.productSurface
    : "marketing";
  const subjectForProposal: SurfaceSubject = subject ?? {
    subjectKind:
      occurrence.subjectKind === "dynamic-instance"
        ? "dynamic-instance"
        : "route",
    subjectId: occurrence.subjectId,
    routeId: occurrence.subjectId,
    routePattern: occurrence.concreteUrl,
    concreteUrl: occurrence.concreteUrl,
    sourcePath: "scoped Wave 2 source graph",
    productSurface: subjectProductSurface,
    status: "active",
  };

  if (defect) {
    const proposal = createCopyProposal(defect, subjectForProposal, createdAt);
    copyProposals.set(proposal.proposalId, proposal);
  }

  const operation = pendingOperation(dimension, occurrence);
  const isStaticDefect = defect !== undefined;
  const resultClassification = isStaticDefect ? "nonconforming" : "not-run";
  const observedResult = isStaticDefect
    ? `Static source defect observed at ${defect.sourcePath}: ${defect.evidenceSnippet}`
    : sourceObservationForRecords(dimension, sourceRecords, signalCount);
  const claimBasis = isStaticDefect
    ? "source-observed"
    : signalCount > 0
      ? "source-observed"
      : "source-inferred-expectation";
  const journeyIds =
    dimension === "dim.navigation-journeys"
      ? journeys.map((journey) => journey.inventoryId).sort()
      : [];
  const shellIds = relevantShellIds(shells, allRecords, occurrence);
  const evidenceReferences = [
    `occurrence:${occurrence.occurrenceId}`,
    ...sourceRecords.map((record) => `inventory:${record.inventoryId}`),
    ...sourceLocations,
    ...journeyIds.map((journeyId) => `journey:${journeyId}`),
  ];
  const uniqueReferences = [...new Set(evidenceReferences)].sort();

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
    auditDimension: dimension,
    expectedResult: DIMENSION_EXPECTATIONS[dimension],
    observedResult,
    claimBasis,
    resultClassification,
    severity: isStaticDefect ? "low" : "advisory",
    severityRationale: isStaticDefect
      ? "The source-visible copy defect is localized and recoverable; runtime impact and affected audience breadth remain unmeasured."
      : "No defect severity is assigned because the source-only record does not establish rendered, runtime, delivery, or cross-profile behavior.",
    ...(isStaticDefect
      ? { decidingSeverityDimension: "source-visible-copy-quality" }
      : {}),
    userImpact: isStaticDefect
      ? "Placeholder or review-marker text can reduce comprehension of the affected journey until replacement copy is approved."
      : "The source contract is recorded, but the occurrence remains unverified for the required rendered or protected behavior.",
    evidenceLane: "static-inspection",
    evidenceType: isStaticDefect
      ? "source-visible-static-defect"
      : "source-surface-contract",
    sourceOrRuntimeLocation:
      sourceLocations.join(", ") || subjectForProposal.sourcePath,
    capturedAt: createdAt,
    reproductionSteps: [
      ...(sourceLocations.length > 0
        ? sourceLocations.map(
            (location) => `Inspect the source declaration at ${location}.`,
          )
        : [`Inspect the scoped source graph for ${occurrence.concreteUrl}.`]),
      ...(isStaticDefect
        ? [
            "Confirm the source-visible placeholder/review marker before accepting the replacement proposal.",
          ]
        : [
            "Do not treat this static record as rendered, hosted, runtime, delivery, accessibility-assistive-technology, or measured-performance evidence.",
          ]),
    ],
    evidenceReferences:
      uniqueReferences.length > 0
        ? uniqueReferences
        : [`occurrence:${occurrence.occurrenceId}`],
    requirementIds: [...DIMENSION_REQUIREMENTS[dimension]],
    journeyIds: [...journeyIds],
    shellIds: [...shellIds],
    relatedFindingIds: [],
    proposedOutcome: isStaticDefect
      ? "Review and separately authorize the replacement-ready English proposal and Hindi translation workflow; do not edit product content in the audit run."
      : "Run the exact pending operation with matching authorization and ingest occurrence-scoped evidence; retain the source expectation separately.",
    ...(isStaticDefect && defect
      ? {
          copyProposalId: `proposal.wave2.copy.${sha256Short(defect.defectId, subjectForProposal.subjectId)}`,
        }
      : {}),
    likelyOwner: DIMENSION_OWNERS[dimension],
    dependencies: [...DIMENSION_DEPENDENCIES[dimension]],
    verificationMethod: isStaticDefect
      ? `Static source inspection at ${defect?.sourcePath ?? subjectForProposal.sourcePath}; human content review remains required.`
      : operation.exactOperation,
    ...(isStaticDefect ? {} : { blockers: [blockerForOperation(operation)] }),
  };

  return {
    evidence,
    ...(isStaticDefect ? {} : { operation }),
  };
}

function uniqueBlockers(
  blockers: readonly BlockerDetail[],
): readonly BlockerDetail[] {
  const seen = new Set<string>();
  return Object.freeze(
    blockers.filter((blocker) => {
      const key = `${blocker.blockerKind}\u0000${blocker.pendingOperation}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  );
}

function createSeverityAssessment(
  findingId: string,
  occurrence: OccurrenceRecord,
  createdAt: string,
): SeverityAssessmentRecord {
  const assessmentId = `severity.wave2.${sha256Short(findingId)}`;
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "severity-assessment",
    recordId: `record.${assessmentId}`,
    createdAt,
    assessmentId,
    findingId,
    severity: "low",
    severityRationale:
      "The source-visible Wave 2 defect is localized to one occurrence subject and remains recoverable through copy review; protected/runtime breadth is not claimed.",
    decidingDimension: "source-visible-copy-quality",
    userImpact:
      "Placeholder or review-marker copy can delay comprehension of the affected marketing, catalog, or portal journey.",
    affectedAudience: `${occurrence.productSurface} users in the recorded occurrence context`,
    journeyCriticality:
      "secondary unless a linked primary journey review establishes broader impact",
    dataSensitivity: "none established by static source evidence",
    legalOrConsentExposure:
      "none established; content-owner review remains required",
    occurrenceCount: 1,
    recoverability:
      "replace and review the affected copy without changing route or product facts",
    workaroundQuality:
      "The surrounding route or navigation may remain available, but the affected copy can be unclear.",
  };
}

function buildFinding(
  occurrence: OccurrenceRecord,
  evidenceRecords: readonly EvidenceRecord[],
  severityAssessment: SeverityAssessmentRecord | undefined,
  copyProposalId: string | undefined,
  createdAt: string,
): OccurrenceFinding {
  const evidenceIds = evidenceRecords.map((record) => record.evidenceId).sort();
  const blockers = uniqueBlockers(
    evidenceRecords.flatMap((record) => record.blockers ?? []),
  );
  const hasDefect = evidenceRecords.some(
    (record) => record.resultClassification === "nonconforming",
  );
  const hasNotRun = evidenceRecords.some(
    (record) => record.resultClassification === "not-run",
  );
  const resultClassification = occurrence.notApplicableRationale
    ? "not-applicable"
    : hasDefect
      ? "nonconforming"
      : hasNotRun
        ? "not-run"
        : "conforming";
  const copyRelated = Boolean(copyProposalId);
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "finding",
    recordId: `record.${occurrence.findingId}`,
    createdAt,
    findingId: occurrence.findingId,
    occurrenceId: occurrence.occurrenceId,
    resultClassification,
    claimBasis:
      resultClassification === "nonconforming"
        ? "source-observed"
        : resultClassification === "not-applicable"
          ? "source-observed"
          : "source-inferred-expectation",
    conclusionSummary:
      resultClassification === "not-applicable"
        ? `Wave 2 surface evaluation is not applicable for this occurrence: ${occurrence.notApplicableRationale ?? "frozen profile rule"}.`
        : resultClassification === "nonconforming"
          ? "A source-visible Wave 2 defect was recorded with replacement-ready English and Hindi review workflow; no product content was changed."
          : "Wave 2 source declarations were inventoried, but rendered, protected, external, delivery, assistive-technology, and measured-performance behavior remains not-run.",
    evidenceIds,
    requirementIds: [
      ...new Set(evidenceRecords.flatMap((record) => record.requirementIds)),
    ].sort(),
    productSurface: occurrence.productSurface,
    ...(severityAssessment
      ? { severityAssessmentId: severityAssessment.assessmentId }
      : {}),
    ...(copyRelated && copyProposalId ? { copyProposalId } : {}),
    copyRelated,
    ...(blockers.length > 0 ? { blockers: [...blockers] } : {}),
    ...(occurrence.notApplicableRationale
      ? { notApplicableRationale: occurrence.notApplicableRationale }
      : {}),
  };
}

function buildMatrixRow(
  occurrence: OccurrenceRecord,
  finding: OccurrenceFinding,
  routeId: string | undefined,
  createdAt: string,
): MatrixRow {
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "matrix-row",
    recordId: `record.matrix.${occurrence.occurrenceId}`,
    createdAt,
    occurrenceId: occurrence.occurrenceId,
    ...(routeId ? { routeId } : {}),
    concreteUrl: occurrence.concreteUrl,
    productSurface: occurrence.productSurface,
    stateId: occurrence.stateId,
    viewportId: occurrence.viewportId,
    browserId: occurrence.browserId,
    accessContextId: occurrence.accessId,
    languageId: occurrence.languageId,
    applicableDimensionIds: [...occurrence.applicableDimensionIds],
    waveId: "2",
    status: finding.resultClassification,
    findingId: finding.findingId,
    inputFingerprint: occurrence.inputFingerprint,
    ...(finding.blockers ? { blockers: [...finding.blockers] } : {}),
    ...(finding.notApplicableRationale
      ? { notApplicableRationale: finding.notApplicableRationale }
      : {}),
  };
}

export function buildSurfaceAuditRecords(
  occurrences: readonly OccurrenceRecord[],
  inventoryRecords: readonly SpecializedInventoryRecord[],
  journeys: readonly SpecializedInventoryRecord[],
  shells: readonly DiscoveredShell[],
  subjects: readonly SurfaceSubject[],
  createdAt: string,
): SurfaceAuditRecordBuildResult {
  const matrixRows: MatrixRow[] = [];
  const evidenceRecords: EvidenceRecord[] = [];
  const findings: OccurrenceFinding[] = [];
  const copyProposals = new Map<string, CopyProposalRecord>();
  const severityAssessments: SeverityAssessmentRecord[] = [];
  const pendingOperations = new Map<string, SurfacePendingOperation>();
  const subjectById = new Map(
    subjects.map((subject) => [subject.subjectId, subject]),
  );

  for (const occurrence of occurrences) {
    if (!isWave2Surface(occurrence.productSurface)) continue;

    if (occurrence.notApplicableRationale) {
      const dimension = WAVE2_DIMENSIONS[0];
      const evidence = notApplicableEvidence(
        occurrence,
        dimension,
        occurrence.notApplicableRationale,
        createdAt,
      );
      const finding = buildFinding(
        occurrence,
        [evidence],
        undefined,
        undefined,
        createdAt,
      );
      findings.push(finding);
      evidenceRecords.push(evidence);
      matrixRows.push(
        buildMatrixRow(
          occurrence,
          finding,
          subjectRouteId(inventoryRecords, occurrence),
          createdAt,
        ),
      );
      continue;
    }

    const occurrenceEvidence: EvidenceRecord[] = [];
    const subject = subjectById.get(occurrence.subjectId);
    for (const dimension of WAVE2_DIMENSIONS) {
      const dimensionApplicable =
        occurrence.applicableDimensionIds.includes(dimension);
      if (!dimensionApplicable) {
        const rationale =
          occurrence.notApplicableDimensions.find(
            (entry) => entry.dimensionId === dimension,
          )?.rationale ??
          "The frozen profile rules mark this dimension not applicable to the occurrence.";
        occurrenceEvidence.push(
          notApplicableEvidence(occurrence, dimension, rationale, createdAt),
        );
        continue;
      }

      const sourceRecords = dimensionSourceRecords(
        dimension,
        inventoryRecords,
        journeys,
        occurrence,
      );
      const result = evidenceForDimension(
        occurrence,
        dimension,
        sourceRecords,
        journeyRecordsForOccurrence(journeys, inventoryRecords, occurrence),
        shells,
        inventoryRecords,
        subject,
        createdAt,
        copyProposals,
      );
      occurrenceEvidence.push(result.evidence);
      if (result.operation)
        pendingOperations.set(result.operation.operationId, result.operation);
    }

    const copyProposalId = occurrenceEvidence.find(
      (evidence) => evidence.copyProposalId,
    )?.copyProposalId;
    const severityAssessment = occurrenceEvidence.some(
      (evidence) => evidence.resultClassification === "nonconforming",
    )
      ? createSeverityAssessment(occurrence.findingId, occurrence, createdAt)
      : undefined;
    if (severityAssessment) severityAssessments.push(severityAssessment);
    const finding = buildFinding(
      occurrence,
      occurrenceEvidence,
      severityAssessment,
      copyProposalId,
      createdAt,
    );
    findings.push(finding);
    evidenceRecords.push(...occurrenceEvidence);
    matrixRows.push(
      buildMatrixRow(
        occurrence,
        finding,
        subjectRouteId(inventoryRecords, occurrence),
        createdAt,
      ),
    );
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
    copyProposals: Object.freeze(
      [...copyProposals.values()].sort((left, right) =>
        left.proposalId.localeCompare(right.proposalId),
      ),
    ),
    severityAssessments: Object.freeze(
      severityAssessments.sort((left, right) =>
        left.assessmentId.localeCompare(right.assessmentId),
      ),
    ),
    pendingOperations: Object.freeze(
      [...pendingOperations.values()].sort((left, right) =>
        left.operationId.localeCompare(right.operationId),
      ),
    ),
  });
}

// ---------------------------------------------------------------------------
// Source-only runner and approved artifact output
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

function surfaceArtifactPath(
  runId: string,
  purpose: string,
  artifactPath: string,
  config: Parameters<typeof createGeneratedArtifactPath>[3],
): string {
  return createGeneratedArtifactPath(
    runId,
    purpose,
    `wave-2-surfaces/${artifactPath}`,
    config,
  );
}

function resultTotals(
  findings: readonly OccurrenceFinding[],
): Record<string, number> {
  const totals: Record<string, number> = {
    conforming: 0,
    nonconforming: 0,
    blocked: 0,
    "not-run": 0,
    "not-applicable": 0,
    "requires-owner-decision": 0,
  };
  for (const finding of findings) {
    totals[finding.resultClassification] =
      (totals[finding.resultClassification] ?? 0) + 1;
  }
  return totals;
}

export async function runWave2Surfaces(
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
  const inventory = await buildSurfaceInventories(
    repositoryRoot,
    discoveredAt,
    discovery,
  );
  const occurrences = expandToOccurrences(
    discovery.routes.filter((route) => isWave2Surface(route.productSurface)),
    discovery.dynamicInstances.filter((instance) =>
      isWave2Surface(instance.productSurface),
    ),
    [],
  ).filter((occurrence) => isWave2Surface(occurrence.productSurface));
  const records = buildSurfaceAuditRecords(
    occurrences,
    inventory.records,
    inventory.journeys,
    discovery.shells,
    inventory.subjects,
    discoveredAt,
  );

  assertValidRecords(inventory.records, "Wave 2 surface inventories");
  assertValidRecords(records.matrixRows, "Wave 2 matrix rows");
  assertValidRecords(records.evidenceRecords, "Wave 2 evidence");
  assertValidRecords(records.findings, "Wave 2 findings");
  assertValidRecords(records.copyProposals, "Wave 2 copy proposals");
  assertValidRecords(
    records.severityAssessments,
    "Wave 2 severity assessments",
  );

  const { config } = loaded;
  const { runId } = immutableRunInputs;
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
    readonly purpose: string;
    readonly relativePath: string;
    readonly records: readonly object[];
  };

  const partitionSpecs: PartitionSpec[] = [
    {
      key: "inventories/specialized",
      purpose: "inventories",
      relativePath: surfaceArtifactPath(
        runId,
        "inventories",
        "specialized-inventories.ndjson",
        config,
      ),
      records: inventory.records,
    },
    {
      key: "inventories/copy-proposals",
      purpose: "inventories",
      relativePath: surfaceArtifactPath(
        runId,
        "inventories",
        "copy-proposals.ndjson",
        config,
      ),
      records: records.copyProposals,
    },
    {
      key: "findings/severity-assessments",
      purpose: "findings",
      relativePath: surfaceArtifactPath(
        runId,
        "findings",
        "severity-assessments.ndjson",
        config,
      ),
      records: records.severityAssessments,
    },
  ];

  for (const surface of WAVE2_SURFACES) {
    partitionSpecs.push(
      {
        key: `matrices/${surface}`,
        purpose: "matrices",
        relativePath: surfaceArtifactPath(
          runId,
          "matrices",
          `${surface}/rows.ndjson`,
          config,
        ),
        records: records.matrixRows.filter(
          (row) => row.productSurface === surface,
        ),
      },
      {
        key: `evidence/${surface}`,
        purpose: "evidence",
        relativePath: surfaceArtifactPath(
          runId,
          "evidence",
          `${surface}/evidence.ndjson`,
          config,
        ),
        records: records.evidenceRecords.filter(
          (record) => record.productSurface === surface,
        ),
      },
      {
        key: `findings/${surface}`,
        purpose: "findings",
        relativePath: surfaceArtifactPath(
          runId,
          "findings",
          `${surface}/findings.ndjson`,
          config,
        ),
        records: records.findings.filter(
          (finding) => finding.productSurface === surface,
        ),
      },
    );
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

  const totals = resultTotals(records.findings);
  const findingIds = new Set(
    records.findings.map((finding) => finding.findingId),
  );
  const findingByOccurrence = new Map(
    records.findings.map((finding) => [
      finding.occurrenceId,
      finding.findingId,
    ]),
  );
  const matrixFindingBijection =
    records.matrixRows.length === records.findings.length &&
    new Set(records.matrixRows.map((row) => row.occurrenceId)).size ===
      records.matrixRows.length &&
    findingIds.size === records.findings.length &&
    records.matrixRows.every(
      (row) => findingByOccurrence.get(row.occurrenceId) === row.findingId,
    );
  const inputFingerprint = computeFingerprint([
    immutableRunInputs.configurationHash,
    immutableRunInputs.repositoryRevision,
    String(inventory.records.length),
    String(occurrences.length),
    String(records.evidenceRecords.length),
    String(records.findings.length),
  ]);
  const summaryRelative = surfaceArtifactPath(
    runId,
    "manifests",
    "task-3.1-summary.json",
    config,
  );
  const summaryResolved = resolveApprovedArtifactPath(
    repositoryRoot,
    summaryRelative,
    config,
    runId,
  );
  const summary = {
    task: "3.1 — Wave 2 surface-specific static evidence",
    mode: "wave-2-surfaces-static-complete",
    runId,
    waveId: 2,
    startedAt,
    completedAt: new Date().toISOString(),
    repositoryRevision: immutableRunInputs.repositoryRevision,
    configurationHash: immutableRunInputs.configurationHash,
    inputFingerprint,
    profileVersion: occurrences[0]?.profileVersion ?? "not-observed",
    scope: {
      surfaces: [...WAVE2_SURFACES],
      sourceRoots: [...WAVE2_SOURCE_ROOTS],
      excludedSurfaces: ["administration", "planner", "studio", "offline"],
      protectedBoundaryNote:
        "Authentication nodes may appear only as explicit journey/access boundary contracts; they do not replace portal/dashboard access occurrences.",
    },
    discovery: {
      scopedRoutes: discovery.routes.filter((route) =>
        isWave2Surface(route.productSurface),
      ).length,
      scopedDynamicInstances: discovery.dynamicInstances.filter((instance) =>
        isWave2Surface(instance.productSurface),
      ).length,
      scopedSubjects: inventory.subjects.length,
      scopedJourneys: inventory.journeys.length,
      shellsReferenced: discovery.shells.filter((shell) =>
        shell.routeIds.some((routeId) =>
          inventory.subjects.some((subject) => subject.routeId === routeId),
        ),
      ).length,
      conflicts: discovery.conflicts.length,
      coverageGaps: discovery.coverageGaps.length,
      exclusions: discovery.exclusions.length,
    },
    sourceScan: {
      filesScanned: inventory.sourceFilesScanned,
      sourceErrors: inventory.sourceErrors,
    },
    inventories: {
      specialized: inventory.records.length,
      journeys: inventory.journeys.length,
      copyProposals: records.copyProposals.length,
      severityAssessments: records.severityAssessments.length,
    },
    coverage: {
      totalExpandedOccurrences: occurrences.length,
      matrixRows: records.matrixRows.length,
      evidenceRecords: records.evidenceRecords.length,
      findings: records.findings.length,
      matrixFindingBijection,
      terminalMatrixRows: records.matrixRows.filter(
        (row) => row.status !== "pending",
      ).length,
      oneFindingPerOccurrence:
        records.matrixRows.length === records.findings.length &&
        new Set(records.matrixRows.map((row) => row.occurrenceId)).size ===
          records.matrixRows.length,
      evidencePerApplicableOccurrence: records.findings.every(
        (finding) => finding.evidenceIds.length > 0,
      ),
    },
    resultTotals: {
      conforming: totals.conforming ?? 0,
      nonconforming: totals.nonconforming ?? 0,
      blocked: totals.blocked ?? 0,
      notRun: totals["not-run"] ?? 0,
      notApplicable: totals["not-applicable"] ?? 0,
      requiresOwnerDecision: totals["requires-owner-decision"] ?? 0,
    },
    pendingOperations: records.pendingOperations,
    partitions: partitionResults,
    staticLimitations: [
      "No browser, network, authentication, protected-route, external-link, analytics-delivery, consent-transition, assistive-technology, visual, performance-measurement, test, build, lint, typecheck, gate, hosted, or database operation was executed.",
      "Source-visible links, journeys, forms, assets, copy, metadata, indexing policy, structured data, analytics gates, security messages, and error/performance declarations are expectations or source observations only.",
      "Dynamic product and portal/dashboard instance identity remains separate through canonical subject IDs, concrete URLs, occurrence IDs, and route IDs; no representative instance substitutes for another.",
      "Protected customer/admin access and development-bypass contexts remain separate; public or guest source evidence cannot close protected runtime rows.",
      "Copy proposals are emitted only for explicit source-visible placeholder/review-marker evidence and contain no unapproved Hindi wording.",
    ],
    changedPathManifest: {
      writtenPaths: [...writtenPaths, summaryResolved.relativePath],
      siteStarPaths: [...writtenPaths, summaryResolved.relativePath].filter(
        (relativePath) => relativePath.startsWith("site/"),
      ),
      productCodeMutations: 0,
      allPathsInApprovedDestinations: [
        ...writtenPaths,
        summaryResolved.relativePath,
      ].every(
        (relativePath) =>
          relativePath.startsWith("results/site-ui-content-links-audit/") ||
          relativePath.startsWith("agents-work/site-ui-content-links-audit/"),
      ),
    },
    requirements: [
      "5.1-5.8",
      "6.1-6.7",
      "7.1-7.7",
      "8.1-8.8",
      "9.1-9.7",
      "10.1-10.8",
      "11.1-11.7",
      "12.1-12.8",
      "13.1-13.7",
      "14.1-14.8",
      "15.1-15.7",
      "16.1-16.7",
      "17.1-17.8",
      "18.1-18.7",
      "20.1-20.8",
      "22.3",
      "26.6",
    ],
    validation: {
      everyScopedOccurrenceHasFinding:
        records.matrixRows.length === records.findings.length,
      everyFindingHasEvidence: records.findings.every(
        (finding) => finding.evidenceIds.length > 0,
      ),
      everyMatrixRowTerminal: records.matrixRows.every(
        (row) => row.status !== "pending",
      ),
      noProductCodeWrite: [...writtenPaths, summaryResolved.relativePath].every(
        (relativePath) => !relativePath.startsWith("site/"),
      ),
      sourceOnlyBatch: true,
    },
  };

  await writeJsonFile(summaryResolved.absolutePath, summary);
  writtenPaths.push(summaryResolved.relativePath);

  return {
    ...summary,
    writtenPaths,
  };
}

export const WAVE2_SURFACES_SCHEMA_VERSION = AUDIT_SCHEMA_VERSION;
