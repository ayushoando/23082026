import {
  AUDIT_SCHEMA_VERSION,
  parseAuditRecord,
  type AuditRecord,
  type ProvenanceReference,
} from "./schemas";

/**
 * Lower numeric ranks have higher authority. Runtime authority is reserved for
 * separately authorized work; this module only registers and adapts static
 * sources and previously supplied tool output.
 */
export const SOURCE_AUTHORITY_RANKS = {
  authorizedRuntime: 0,
  appRouterTree: 10,
  repositoryDataReadPaths: 20,
  staticGenerationDeclarations: 30,
  routeContracts: 40,
  internalLinks: 50,
  sitemapAndMetadata: 60,
  generatedInventories: 70,
  existingAuditTools: 80,
} as const;

export const AUDIT_SOURCE_IDS = {
  appRouterTree: "source.app-router-tree",
  repositoryDataReadPaths: "source.repository-data-read-paths",
  staticGenerationDeclarations: "source.static-generation-declarations",
  routeContracts: "source.route-contracts",
  internalLinks: "source.internal-links",
  sitemapAndMetadata: "source.sitemap-and-metadata",
  generatedInventories: "source.generated-inventories",
  existingAuditToolCatalog: "source.existing-audit-tool-catalog",
} as const;

export type AuditSourceId =
  (typeof AUDIT_SOURCE_IDS)[keyof typeof AUDIT_SOURCE_IDS];

export type AdapterCandidateKind =
  | "route"
  | "dynamic-route"
  | "dynamic-instance"
  | "shared-shell"
  | "specialized-inventory"
  | "internal-link"
  | "metadata"
  | "sitemap-entry"
  | "generated-inventory"
  | "tool-observation";

export type SourceAuthorizationClass =
  | "static-inspection"
  | "protected-runtime";

export type ToolAuthorizationClass =
  | SourceAuthorizationClass
  | "not-run-pending-authorization";

export type ToolExecutionState =
  | "never-run"
  | "static-output-only"
  | "authorized-output-recorded"
  | "blocked"
  | "not-run";

export interface SourceAdapterDefinition {
  readonly sourceId: AuditSourceId;
  readonly label: string;
  readonly sourceKind: ProvenanceReference["sourceKind"];
  readonly authorityRank: number;
  readonly scope: readonly string[];
  readonly adapterId: string;
  readonly authorizationClass: SourceAuthorizationClass;
  readonly supportedCandidateKinds: readonly AdapterCandidateKind[];
}

export interface ExistingAuditToolDefinition {
  readonly toolId: string;
  readonly label: string;
  readonly adapterId: string;
  readonly adapterSchema: string;
  readonly scope: readonly string[];
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly supportedProfileIds: readonly string[];
  readonly knownOmissions: readonly string[];
  readonly authorizationClass: ToolAuthorizationClass;
  readonly lastObservedExecutionState: ToolExecutionState;
  readonly residualWork: readonly string[];
  readonly supportedCandidateKinds: readonly AdapterCandidateKind[];
}

/**
 * Each source declaration names an input boundary only. Source walking and
 * canonical discovery are intentionally deferred to Task 1.4.
 */
export const SOURCE_ADAPTERS = [
  {
    sourceId: AUDIT_SOURCE_IDS.appRouterTree,
    label: "Live Next.js App Router tree",
    sourceKind: "source",
    authorityRank: SOURCE_AUTHORITY_RANKS.appRouterTree,
    scope: [
      "site/app/**/page.tsx",
      "site/app/**/{layout,template,loading,error,not-found}.tsx",
    ],
    adapterId: "adapter.source.app-router-tree@1",
    authorizationClass: "static-inspection",
    supportedCandidateKinds: ["route", "dynamic-route", "shared-shell"],
  },
  {
    sourceId: AUDIT_SOURCE_IDS.repositoryDataReadPaths,
    label: "Repository-owned data and mode-aware read paths",
    sourceKind: "repository-data",
    authorityRank: SOURCE_AUTHORITY_RANKS.repositoryDataReadPaths,
    scope: [
      "site/lib/catalog/productStaticParams.ts",
      "site/lib/catalog/furnitureCatalogMode.ts",
      "site/lib/Planner/plannerPersistenceMode.ts",
      "site/platform/shared/data/furniture/**",
    ],
    adapterId: "adapter.source.repository-data-read-paths@1",
    authorizationClass: "static-inspection",
    supportedCandidateKinds: ["dynamic-instance", "specialized-inventory"],
  },
  {
    sourceId: AUDIT_SOURCE_IDS.staticGenerationDeclarations,
    label: "Static generation declarations and route-local constants",
    sourceKind: "source",
    authorityRank: SOURCE_AUTHORITY_RANKS.staticGenerationDeclarations,
    scope: [
      "site/app/**/page.tsx#generateStaticParams",
      "site/lib/catalog/productStaticParams.ts#buildProductStaticParams",
      "site/app/sitemap.ts",
    ],
    adapterId: "adapter.source.static-generation-declarations@1",
    authorizationClass: "static-inspection",
    supportedCandidateKinds: ["dynamic-route", "dynamic-instance", "sitemap-entry"],
  },
  {
    sourceId: AUDIT_SOURCE_IDS.routeContracts,
    label: "Typed and JSON route contracts",
    sourceKind: "contract",
    authorityRank: SOURCE_AUTHORITY_RANKS.routeContracts,
    scope: [
      "site/platform/route-contract.json",
      "site/features/site/data/routeClassification.ts",
      "site/features/site/data/routeChromeRules.ts",
    ],
    adapterId: "adapter.source.route-contracts@1",
    authorizationClass: "static-inspection",
    supportedCandidateKinds: ["route", "dynamic-route", "specialized-inventory"],
  },
  {
    sourceId: AUDIT_SOURCE_IDS.internalLinks,
    label: "Internal links and navigation actions",
    sourceKind: "internal-link",
    authorityRank: SOURCE_AUTHORITY_RANKS.internalLinks,
    scope: [
      "site/**/*.{ts,tsx}#href",
      "site/**/*.{ts,tsx}#Link",
      "site/**/*.{ts,tsx}#router-navigation",
    ],
    adapterId: "adapter.source.internal-links@1",
    authorizationClass: "static-inspection",
    supportedCandidateKinds: ["internal-link", "dynamic-instance", "specialized-inventory"],
  },
  {
    sourceId: AUDIT_SOURCE_IDS.sitemapAndMetadata,
    label: "Sitemap and metadata declarations",
    sourceKind: "source",
    authorityRank: SOURCE_AUTHORITY_RANKS.sitemapAndMetadata,
    scope: [
      "site/app/sitemap.ts",
      "site/app/**/{page,layout}.tsx#metadata",
      "site/app/**/{page,layout}.tsx#generateMetadata",
    ],
    adapterId: "adapter.source.sitemap-and-metadata@1",
    authorizationClass: "static-inspection",
    supportedCandidateKinds: ["metadata", "sitemap-entry", "dynamic-instance"],
  },
  {
    sourceId: AUDIT_SOURCE_IDS.generatedInventories,
    label: "Revisioned generated route and documentation inventories",
    sourceKind: "tool",
    authorityRank: SOURCE_AUTHORITY_RANKS.generatedInventories,
    scope: [
      "generated-documents/data/routes.json",
      "generated-documents/data/api.json",
      "docs/architecture/routes.md",
    ],
    adapterId: "adapter.source.generated-inventories@1",
    authorizationClass: "static-inspection",
    supportedCandidateKinds: [
      "generated-inventory",
      "route",
      "dynamic-route",
      "dynamic-instance",
    ],
  },
  {
    sourceId: AUDIT_SOURCE_IDS.existingAuditToolCatalog,
    label: "Existing audit tool catalog",
    sourceKind: "tool",
    authorityRank: SOURCE_AUTHORITY_RANKS.existingAuditTools,
    scope: [
      "package.json#scripts",
      "scripts/**",
      "tech-docs-generator/scripts/**",
      "tests/e2e/**",
    ],
    adapterId: "adapter.source.existing-audit-tool-catalog@1",
    authorizationClass: "static-inspection",
    supportedCandidateKinds: ["tool-observation"],
  },
] as const satisfies readonly SourceAdapterDefinition[];

/**
 * These tool entries are a catalog, not proof that a command has run. Every
 * entry is explicitly left not-run in this task and all candidates remain
 * non-closing until the canonical inventory and matrix stages reconcile them.
 */
export const EXISTING_AUDIT_TOOLS = [
  {
    toolId: "tool.site-ui-route-matrix",
    label: "Site UI route matrix generator",
    adapterId: "adapter.tool.site-ui-route-matrix@1",
    adapterSchema: "adapter.tool.site-ui-route-matrix@1",
    scope: ["Source-visible page patterns and layout dialect evidence."],
    inputs: ["site/app/**/page.tsx", "scripts/lib/siteUiRouteSources.mjs"],
    outputs: ["results/site-ui/route-matrix.csv"],
    supportedProfileIds: [],
    knownOmissions: [
      "Filters route roots and does not enumerate all administration, fork, shared-shell, state, or dynamic-instance occurrences.",
    ],
    authorizationClass: "static-inspection",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Reconcile every route candidate with the App Router tree and retain uncovered routes as separate inventory items.",
    ],
    supportedCandidateKinds: ["route", "generated-inventory"],
  },
  {
    toolId: "tool.tech-docs-route-extractor",
    label: "Tech-docs route extractor",
    adapterId: "adapter.tool.tech-docs-route-extractor@1",
    adapterSchema: "adapter.tool.tech-docs-route-extractor@1",
    scope: ["App Router page-pattern candidates and route-contract pointers."],
    inputs: ["site/app/**/page.tsx", "site/platform/route-contract.json"],
    outputs: ["generated-documents/data/routes.json"],
    supportedProfileIds: [],
    knownOmissions: [
      "Does not establish dynamic-instance, state, shared-shell, or occurrence closure.",
    ],
    authorizationClass: "static-inspection",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Expand each dynamic route from independent source, data, contract, link, and sitemap evidence.",
    ],
    supportedCandidateKinds: ["route", "dynamic-route", "generated-inventory"],
  },
  {
    toolId: "tool.site-page-audit",
    label: "Site page audit",
    adapterId: "adapter.tool.site-page-audit@1",
    adapterSchema: "adapter.tool.site-page-audit@1",
    scope: [
      "Authorized viewport screenshots, basic semantic and layout signals, auth-mode labels, and route outcome classification.",
    ],
    inputs: [
      "http://localhost:3000",
      "tech-docs-generator/scripts/extract-routes.mjs",
      "AUDIT_STORAGE_STATE or AUDIT_ASSUME_BYPASS",
    ],
    outputs: [
      "results/site/page-audit-<host>/route-inventory.json",
      "results/site/page-audit-<host>/audit-results.json",
      "results/site/page-audit-<host>/summary.json",
    ],
    supportedProfileIds: ["viewport.w1920", "viewport.w1440", "viewport.w1078", "viewport.w768", "viewport.w390", "browser.chromium"],
    knownOmissions: [
      "Chromium-only execution uses selected dynamic samples and placeholders with limited state, access, language, and assistive-technology coverage.",
    ],
    authorizationClass: "protected-runtime",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Map only measured results to their exact occurrences and leave unmeasured or unsampled rows open.",
    ],
    supportedCandidateKinds: ["tool-observation", "dynamic-instance"],
  },
  {
    toolId: "tool.responsive-audit",
    label: "Responsive audit",
    adapterId: "adapter.tool.responsive-audit@1",
    adapterSchema: "adapter.tool.responsive-audit@1",
    scope: ["Authorized responsive observations and screenshots for hard-coded route sets."],
    inputs: ["http://localhost:3000", "static route arrays", "sampled dynamic routes"],
    outputs: ["results/site/responsive-audit-*/audit-results.json", "responsive screenshots and summaries"],
    supportedProfileIds: ["viewport.mobile-390", "viewport.desktop-1440", "viewport.desktop-1920", "browser.chromium"],
    knownOmissions: [
      "Hard-coded routes and sample data are not exhaustive; the tool is Chromium-only and does not cover the full state, access, or language matrix.",
    ],
    authorizationClass: "protected-runtime",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Retain every non-selected route, dynamic instance, browser, and state as a separate pending occurrence.",
    ],
    supportedCandidateKinds: ["tool-observation", "dynamic-instance"],
  },
  {
    toolId: "tool.marketing-ui-audit",
    label: "Marketing UI audit",
    adapterId: "adapter.tool.marketing-ui-audit@1",
    adapterSchema: "adapter.tool.marketing-ui-audit@1",
    scope: ["Marketing screenshots, selected interactions, runtime errors, and failed assets."],
    inputs: ["http://localhost:3000", "fixed marketing routes", "consent-preconfigured Chromium contexts"],
    outputs: ["results/ui-audit/<date>/audit.json", "results/ui-audit/<date>/screenshots/**"],
    supportedProfileIds: ["viewport.390x844", "viewport.768x1024", "viewport.1280x800", "browser.chromium"],
    knownOmissions: [
      "Marketing-only scope, fixed viewports, preconfigured consent, and no complete state or cross-browser matrix.",
    ],
    authorizationClass: "protected-runtime",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Audit non-marketing surfaces and all missing occurrences independently; do not treat accepted-consent results as other consent states.",
    ],
    supportedCandidateKinds: ["tool-observation"],
  },
  {
    toolId: "tool.sitemap-csv-generator",
    label: "Sitemap CSV generator",
    adapterId: "adapter.tool.sitemap-csv-generator@1",
    adapterSchema: "adapter.tool.sitemap-csv-generator@1",
    scope: ["Sitemap route-instance and SEO comparison candidates."],
    inputs: ["site/features/site/data/htmlSitemap.ts", "site/app/sitemap.ts"],
    outputs: ["docs/architecture/sitemap-routes.csv"],
    supportedProfileIds: [],
    knownOmissions: [
      "Sitemap inclusion does not prove a route is live or its metadata is correct; its output path is outside this audit tooling write scope.",
    ],
    authorizationClass: "static-inspection",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Compare sitemap candidates with the canonical route and metadata inventories without treating membership as coverage closure.",
    ],
    supportedCandidateKinds: ["sitemap-entry", "metadata"],
  },
  {
    toolId: "tool.api-route-index-generator",
    label: "API route index generator",
    adapterId: "adapter.tool.api-route-index-generator@1",
    adapterSchema: "adapter.tool.api-route-index-generator@1",
    scope: ["API-contract context for dynamic discovery and journey dependencies."],
    inputs: ["site/app/api/**/route.ts"],
    outputs: ["results/tooling/routes-api.generated.md"],
    supportedProfileIds: [],
    knownOmissions: [
      "Inventories API handlers rather than user-facing pages and cannot establish page completeness.",
    ],
    authorizationClass: "static-inspection",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Link handler contracts to user-facing routes only when an independent source establishes the route or journey dependency.",
    ],
    supportedCandidateKinds: ["specialized-inventory", "tool-observation"],
  },
  {
    toolId: "tool.check-site-ui",
    label: "Site UI contract check",
    adapterId: "adapter.tool.check-site-ui@1",
    adapterSchema: "adapter.tool.check-site-ui@1",
    scope: ["Static site UI contract, i18n parity, and homepage dialect assertions."],
    inputs: ["pnpm run check:site-ui", "site/**", "site/i18n/messages/**"],
    outputs: ["process exit status and diagnostic output"],
    supportedProfileIds: [],
    knownOmissions: [
      "Test-like assertions do not prove rendered behavior or occurrence closure and require an exact authorized command.",
    ],
    authorizationClass: "not-run-pending-authorization",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Map each authorized diagnostic to exact source inventory items and preserve rows the command does not inspect.",
    ],
    supportedCandidateKinds: ["tool-observation"],
  },
  {
    toolId: "tool.i18n-key-parity",
    label: "I18n key parity check",
    adapterId: "adapter.tool.i18n-key-parity@1",
    adapterSchema: "adapter.tool.i18n-key-parity@1",
    scope: ["Locale key and placeholder parity for configured message namespaces."],
    inputs: ["pnpm run check:i18n:parity", "site/i18n/messages/**", "site/i18n/marketing-parity-manifest.json"],
    outputs: ["process exit status and key-parity diagnostics"],
    supportedProfileIds: ["language.en", "language.hi"],
    knownOmissions: [
      "Key parity does not prove wording accuracy, translation approval, layout, or route-level language applicability.",
    ],
    authorizationClass: "not-run-pending-authorization",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Review copy and Hindi approval per applicable occurrence after mapping parity output to source locators.",
    ],
    supportedCandidateKinds: ["tool-observation", "specialized-inventory"],
  },
  {
    toolId: "tool.product-icon-check",
    label: "Product icon convention check",
    adapterId: "adapter.tool.product-icon-check@1",
    adapterSchema: "adapter.tool.product-icon-check@1",
    scope: ["Icon dependency, import, and Product Studio glyph convention checks."],
    inputs: ["pnpm run check:product-icons", "package.json", "site/**"],
    outputs: ["process exit status and icon convention diagnostics"],
    supportedProfileIds: [],
    knownOmissions: [
      "Static icon conventions do not establish rendered alignment, visibility, accessibility, or complete design-system conformance.",
    ],
    authorizationClass: "not-run-pending-authorization",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Associate any authorized diagnostics with exact controls and leave runtime visual and accessibility rows unresolved.",
    ],
    supportedCandidateKinds: ["tool-observation"],
  },
  {
    toolId: "tool.style-token-check",
    label: "Style token ratchet check",
    adapterId: "adapter.tool.style-token-check@1",
    adapterSchema: "adapter.tool.style-token-check@1",
    scope: ["Source-visible Tailwind, inline-style, and CSS token-bypass findings."],
    inputs: ["pnpm run check:style-tokens", "site/app", "site/components", "site/features", "site/lib", "site/focss"],
    outputs: ["process exit status and ratchet diagnostics"],
    supportedProfileIds: [],
    knownOmissions: [
      "Ratchet results compare to a baseline and do not establish rendered visual consistency or a complete occurrence-level audit.",
    ],
    authorizationClass: "not-run-pending-authorization",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Map each authorized source finding to relevant occurrences and retain visual runtime checks as pending.",
    ],
    supportedCandidateKinds: ["tool-observation"],
  },
  {
    toolId: "tool.composer-style-check",
    label: "Composer style coverage check",
    adapterId: "adapter.tool.composer-style-check@1",
    adapterSchema: "adapter.tool.composer-style-check@1",
    scope: ["Product Studio rendered composer-class and stylesheet-rule coverage."],
    inputs: ["pnpm run check:composer-styles", "site/features/admin/product-studio/**", "site/app/admin/**", "site/focss/**"],
    outputs: ["process exit status and unstyled/dead-class diagnostics"],
    supportedProfileIds: [],
    knownOmissions: [
      "Static class-to-rule coverage does not establish rendered layout, interaction, accessibility, or non-composer surface consistency.",
    ],
    authorizationClass: "not-run-pending-authorization",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Map authorized class diagnostics to exact Studio/admin occurrences and retain runtime visual and accessibility work separately.",
    ],
    supportedCandidateKinds: ["tool-observation"],
  },
  {
    toolId: "tool.strict-ui-lint",
    label: "Strict UI contract lint",
    adapterId: "adapter.tool.strict-ui-lint@1",
    adapterSchema: "adapter.tool.strict-ui-lint@1",
    scope: ["Configured source-level UI contract assertions."],
    inputs: ["pnpm run lint:ui:strict", "configured UI source roots"],
    outputs: ["process exit status and strict UI diagnostics"],
    supportedProfileIds: [],
    knownOmissions: [
      "Lint output is source-level and cannot prove rendered behavior, complete occurrence coverage, or non-selected design dimensions.",
    ],
    authorizationClass: "not-run-pending-authorization",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Map each authorized diagnostic to source-backed inventory items and leave uncovered occurrences open.",
    ],
    supportedCandidateKinds: ["tool-observation"],
  },
  {
    toolId: "tool.playwright-site-ui-specs",
    label: "Existing Playwright site UI specifications",
    adapterId: "adapter.tool.playwright-site-ui-specs@1",
    adapterSchema: "adapter.tool.playwright-site-ui-specs@1",
    scope: ["Existing accessibility, visual, route, and journey browser specifications."],
    inputs: ["config/build/playwright.config.ts", "tests/e2e/**/*.spec.ts", "exact selected Playwright command"],
    outputs: ["Playwright result records, traces, screenshots, and reports"],
    supportedProfileIds: ["browser.chromium"],
    knownOmissions: [
      "Selected specifications are representative and do not establish full route, state, browser, access, or language coverage.",
    ],
    authorizationClass: "protected-runtime",
    lastObservedExecutionState: "not-run",
    residualWork: [
      "Register each exact selected specification and occurrence selector before execution; retain all unselected rows independently.",
    ],
    supportedCandidateKinds: ["tool-observation"],
  },
] as const satisfies readonly ExistingAuditToolDefinition[];

export interface AdapterCandidateInput {
  readonly candidateId: string;
  readonly candidateKind: AdapterCandidateKind;
  readonly subjectKey: string;
  readonly claimedFields: readonly string[];
  readonly payload: Readonly<Record<string, unknown>>;
  readonly sourceLocation: string;
  readonly discoveredAt: string;
  readonly contentHash?: string;
  readonly isSampled: boolean;
  readonly unsupportedFields?: readonly string[];
}

export interface AdapterGapInput {
  readonly gapId: string;
  readonly subjectKeys: readonly string[];
  readonly gapKind:
    | "unsupported-field"
    | "unsupported-profile"
    | "partial-output"
    | "unavailable-input"
    | "sampled-scope"
    | "authorization-required";
  readonly unsupportedFields?: readonly string[];
  readonly missingPrerequisite: string;
  readonly proposedResolution: string;
  readonly sourceLocation: string;
  readonly discoveredAt: string;
  readonly contentHash?: string;
}

export interface AdapterObservationInput {
  readonly candidates: readonly AdapterCandidateInput[];
  readonly gaps?: readonly AdapterGapInput[];
}

type ValidatedAuditRecord<T extends AuditRecord["recordType"]> = Extract<
  AuditRecord,
  { readonly recordType: T }
>;

export type AdapterCandidateRecord = ValidatedAuditRecord<"adapter-candidate">;
export type AdapterGapRecord = ValidatedAuditRecord<"adapter-gap">;
export type AuthorityConflictRecord = ValidatedAuditRecord<"authority-conflict">;
export type SourceRegistryRecord = ValidatedAuditRecord<"source-registry">;
export type ToolRegistryRecord = ValidatedAuditRecord<"tool-registry">;

export interface ValidatedAdapterEmission {
  readonly candidates: readonly AdapterCandidateRecord[];
  readonly gaps: readonly AdapterGapRecord[];
  readonly canCloseCoverage: false;
}

export interface AuthorityConflictInput {
  readonly conflictId: string;
  readonly subjectKey: string;
  readonly claimField: string;
  readonly createdAt: string;
  readonly claims: readonly {
    readonly candidate: AdapterCandidateRecord;
    readonly valueFingerprint: string;
  }[];
}

export class AuditAdapterError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AuditAdapterError";
  }
}

function parseExpectedRecord<T extends AuditRecord["recordType"]>(
  recordType: T,
  value: unknown,
): ValidatedAuditRecord<T> {
  const parsed = parseAuditRecord(value);
  if (!parsed.success) {
    throw new AuditAdapterError(
      `Invalid ${recordType} record: ${parsed.diagnostics
        .map((diagnostic) => `${diagnostic.path.join(".")}:${diagnostic.code}`)
        .join(", ")}`,
    );
  }
  if (parsed.data.recordType !== recordType) {
    throw new AuditAdapterError(
      `Expected ${recordType} but schema parser returned ${parsed.data.recordType}.`,
    );
  }
  return parsed.data as ValidatedAuditRecord<T>;
}

function findSource(sourceId: AuditSourceId): SourceAdapterDefinition {
  const source = SOURCE_ADAPTERS.find((candidate) => candidate.sourceId === sourceId);
  if (!source) {
    throw new AuditAdapterError(`Unknown audit source: ${sourceId}`);
  }
  return source;
}

function findTool(toolId: string): ExistingAuditToolDefinition {
  const tool = EXISTING_AUDIT_TOOLS.find((candidate) => candidate.toolId === toolId);
  if (!tool) {
    throw new AuditAdapterError(`Unknown existing audit tool: ${toolId}`);
  }
  return tool;
}

function assertSupportedCandidateKind(
  adapterId: string,
  candidateKind: AdapterCandidateKind,
  supportedCandidateKinds: readonly AdapterCandidateKind[],
): void {
  if (!supportedCandidateKinds.includes(candidateKind)) {
    throw new AuditAdapterError(
      `${adapterId} does not support ${candidateKind} candidates.`,
    );
  }
}

function createProvenance(
  sourceId: string,
  sourceKind: ProvenanceReference["sourceKind"],
  location: string,
  discoveredAt: string,
  authorityRank: number,
  contentHash?: string,
): ProvenanceReference {
  return {
    sourceId,
    sourceKind,
    location,
    discoveredAt,
    ...(contentHash ? { contentHash } : {}),
    authorityRank,
  };
}

function createCandidate(
  source: SourceAdapterDefinition,
  input: AdapterCandidateInput,
  toolId?: string,
): AdapterCandidateRecord {
  if (!toolId) {
    assertSupportedCandidateKind(
      source.adapterId,
      input.candidateKind,
      source.supportedCandidateKinds,
    );
  }

  return parseExpectedRecord("adapter-candidate", {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "adapter-candidate",
    recordId: `record.${input.candidateId}`,
    createdAt: input.discoveredAt,
    candidateId: input.candidateId,
    adapterId: toolId ? findTool(toolId).adapterId : source.adapterId,
    sourceId: source.sourceId,
    ...(toolId ? { toolId } : {}),
    candidateKind: input.candidateKind,
    subjectKey: input.subjectKey,
    claimedFields: [...input.claimedFields],
    payload: { ...input.payload },
    provenance: [
      createProvenance(
        toolId ?? source.sourceId,
        toolId ? "tool" : source.sourceKind,
        input.sourceLocation,
        input.discoveredAt,
        source.authorityRank,
        input.contentHash,
      ),
    ],
    isSampled: input.isSampled,
    canCloseCoverage: false,
  });
}

function createGap(
  source: SourceAdapterDefinition,
  input: AdapterGapInput,
  toolId?: string,
): AdapterGapRecord {
  return parseExpectedRecord("adapter-gap", {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "adapter-gap",
    recordId: `record.${input.gapId}`,
    createdAt: input.discoveredAt,
    gapId: input.gapId,
    adapterId: toolId ? findTool(toolId).adapterId : source.adapterId,
    sourceId: source.sourceId,
    ...(toolId ? { toolId } : {}),
    subjectKeys: [...input.subjectKeys],
    gapKind: input.gapKind,
    unsupportedFields: [...(input.unsupportedFields ?? [])],
    missingPrerequisite: input.missingPrerequisite,
    proposedResolution: input.proposedResolution,
    status: "open",
    provenance: [
      createProvenance(
        toolId ?? source.sourceId,
        toolId ? "tool" : source.sourceKind,
        input.sourceLocation,
        input.discoveredAt,
        source.authorityRank,
        input.contentHash,
      ),
    ],
  });
}

function createSampledScopeGap(
  candidate: AdapterCandidateInput,
  source: SourceAdapterDefinition,
  toolId?: string,
): AdapterGapRecord {
  return createGap(
    source,
    {
      gapId: `gap.${candidate.candidateId}.sampled-scope`,
      subjectKeys: [candidate.subjectKey],
      gapKind: "sampled-scope",
      missingPrerequisite:
        "The supplied candidate was sampled and cannot represent uncovered routes, states, profiles, or instances.",
      proposedResolution:
        "Enumerate the complete applicable source domain and retain every uncovered item as an explicit inventory or matrix row.",
      sourceLocation: candidate.sourceLocation,
      discoveredAt: candidate.discoveredAt,
      ...(candidate.contentHash ? { contentHash: candidate.contentHash } : {}),
    },
    toolId,
  );
}

function emitValidatedRecords(
  source: SourceAdapterDefinition,
  input: AdapterObservationInput,
  toolId?: string,
): ValidatedAdapterEmission {
  const candidates = input.candidates.map((candidate) =>
    createCandidate(source, candidate, toolId),
  );
  const declaredGaps = (input.gaps ?? []).map((gap) =>
    createGap(source, gap, toolId),
  );
  const unsupportedFieldGaps = input.candidates
    .filter((candidate) => (candidate.unsupportedFields?.length ?? 0) > 0)
    .map((candidate) =>
      createGap(
        source,
        {
          gapId: `gap.${candidate.candidateId}.unsupported-fields`,
          subjectKeys: [candidate.subjectKey],
          gapKind: "unsupported-field",
          unsupportedFields: candidate.unsupportedFields ?? [],
          missingPrerequisite:
            "The adapter input does not support every claimed field for this candidate.",
          proposedResolution:
            "Add a compatible source adapter or evaluate the unsupported fields in the applicable later audit wave.",
          sourceLocation: candidate.sourceLocation,
          discoveredAt: candidate.discoveredAt,
          ...(candidate.contentHash ? { contentHash: candidate.contentHash } : {}),
        },
        toolId,
      ),
    );
  const sampledGaps = input.candidates
    .filter((candidate) => candidate.isSampled)
    .map((candidate) => createSampledScopeGap(candidate, source, toolId));

  return Object.freeze({
    candidates: Object.freeze(candidates),
    gaps: Object.freeze([
      ...declaredGaps,
      ...unsupportedFieldGaps,
      ...sampledGaps,
    ]),
    canCloseCoverage: false,
  });
}

/**
 * Validates source-derived candidates without walking the source tree. The
 * caller supplies facts discovered by a later source collector.
 */
export function adaptSourceObservation(
  sourceId: AuditSourceId,
  input: AdapterObservationInput,
): ValidatedAdapterEmission {
  return emitValidatedRecords(findSource(sourceId), input);
}

/**
 * Validates an already supplied Existing Audit Tool output. It does not invoke
 * the tool, a browser, a test runner, a local service, or a hosted operation.
 */
export function adaptExistingToolOutput(
  toolId: string,
  input: AdapterObservationInput,
): ValidatedAdapterEmission {
  const tool = findTool(toolId);
  const source = findSource(AUDIT_SOURCE_IDS.existingAuditToolCatalog);
  for (const candidate of input.candidates) {
    assertSupportedCandidateKind(
      tool.adapterId,
      candidate.candidateKind,
      tool.supportedCandidateKinds,
    );
  }
  return emitValidatedRecords(source, input, tool.toolId);
}

function highestAuthorityRank(candidate: AdapterCandidateRecord): number {
  return Math.min(
    ...candidate.provenance.map((provenance) => provenance.authorityRank),
  );
}

/**
 * Retains every conflicting claim. A unique lowest authority rank wins; equal
 * highest claims deliberately remain an owner decision instead of being hidden
 * by adapter order.
 */
export function reconcileAuthorityConflict(
  input: AuthorityConflictInput,
): AuthorityConflictRecord {
  const sortedClaims = [...input.claims]
    .map(({ candidate, valueFingerprint }) => ({
      candidateId: candidate.candidateId,
      sourceId: candidate.sourceId,
      authorityRank: highestAuthorityRank(candidate),
      valueFingerprint,
      provenance: candidate.provenance,
    }))
    .sort(
      (left, right) =>
        left.authorityRank - right.authorityRank ||
        left.sourceId.localeCompare(right.sourceId) ||
        left.candidateId.localeCompare(right.candidateId),
    );

  const leadingClaim = sortedClaims[0];
  const hasUniqueHighestAuthority =
    leadingClaim !== undefined &&
    sortedClaims.filter(
      (claim) => claim.authorityRank === leadingClaim.authorityRank,
    ).length === 1;
  const provenance = sortedClaims.flatMap((claim) => claim.provenance);

  return parseExpectedRecord("authority-conflict", {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "authority-conflict",
    recordId: `record.${input.conflictId}`,
    createdAt: input.createdAt,
    conflictId: input.conflictId,
    subjectKey: input.subjectKey,
    claimField: input.claimField,
    claims: sortedClaims,
    resolution: hasUniqueHighestAuthority
      ? "higher-authority-selected"
      : "requires-owner-decision",
    ...(hasUniqueHighestAuthority && leadingClaim
      ? {
          selectedCandidateId: leadingClaim.candidateId,
          selectedSourceId: leadingClaim.sourceId,
          selectedAuthorityRank: leadingClaim.authorityRank,
        }
      : {}),
    provenance,
  });
}

/**
 * Produces schema-validated registry records. The passed timestamp keeps the
 * registry deterministic for a caller's immutable audit run inputs.
 */
export function createAdapterRegistryRecords(createdAt: string): {
  readonly sourceRegistry: SourceRegistryRecord;
  readonly toolRegistry: ToolRegistryRecord;
} {
  const sourceRegistry = parseExpectedRecord("source-registry", {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "source-registry",
    recordId: "record.registry.sources",
    createdAt,
    registryId: "registry.audit-sources",
    sources: SOURCE_ADAPTERS.map((source) => ({
      sourceId: source.sourceId,
      label: source.label,
      sourceKind: source.sourceKind,
      authorityRank: source.authorityRank,
      scope: [...source.scope],
      adapterId: source.adapterId,
      authorizationClass: source.authorizationClass,
      provenance: [
        createProvenance(
          source.sourceId,
          source.sourceKind,
          source.scope[0] ?? source.label,
          createdAt,
          source.authorityRank,
        ),
      ],
    })),
  });

  const toolRegistry = parseExpectedRecord("tool-registry", {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    recordType: "tool-registry",
    recordId: "record.registry.tools",
    createdAt,
    registryId: "registry.existing-audit-tools",
    tools: EXISTING_AUDIT_TOOLS.map((tool) => ({
      toolId: tool.toolId,
      label: tool.label,
      scope: [...tool.scope],
      inputs: [...tool.inputs],
      outputs: [...tool.outputs],
      supportedProfileIds: [...tool.supportedProfileIds],
      knownOmissions: [...tool.knownOmissions],
      authorizationClass: tool.authorizationClass,
      lastObservedExecutionState: tool.lastObservedExecutionState,
      residualWork: [...tool.residualWork],
      adapterSchema: tool.adapterSchema,
      provenance: [
        createProvenance(
          tool.toolId,
          "tool",
          tool.inputs[0] ?? tool.label,
          createdAt,
          SOURCE_AUTHORITY_RANKS.existingAuditTools,
        ),
      ],
    })),
  });

  return Object.freeze({ sourceRegistry, toolRegistry });
}
