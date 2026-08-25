/**
 * Lane C capability evaluator.
 *
 * This module inventories repository-local and supplied extension metadata only.
 * It never loads a power, routes to an MCP service, changes permissions, or
 * invokes an agent.  Every external route is considered only after the
 * repository-answer check and remains inactive until the required evidence,
 * approval, validation, and rollback records exist.
 */

import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import {
  INITIAL_SKILL_CANDIDATES,
  OWNER_DECISIONS,
  REQUIRED_SURFACE_VERSIONS,
  REPOSITORY_ROOT,
  type ArtifactInventoryRecord,
  type ArtifactKind,
  type CapabilityDisposition,
  type CapabilityDispositionRecord,
  type CapabilityInput,
  type CapabilityResult,
  type ConfigurationScope,
  type DefaultTaskConcurrency,
  type EvidenceProvenance,
  type EvidenceState,
  type ExecutionLayer,
  type ExtensionKind,
  type ExtensionRecord,
  type FailureBehavior,
  type Identifier,
  type IntegrityResult as ContractIntegrityResult,
  type KiroSurface,
  type KnownGap,
  type OwnerDecision,
  type PermissionBoundary,
  type PowerFormat,
  type PowerRecord,
  type RepositoryAnswer,
  type RepositoryCompatibility,
  type RepositoryPath,
  type ResourceUri,
  type SecretBoundary,
  type StageResult,
  type TrustDecision,
  type ValidationRun,
} from "./contracts";

export const POWER_ROOT = ".kiro/powers" as const;
export const LOCAL_POWER_NAME = "oando-workflow" as const;
export const LOCAL_POWER_PATH = `${POWER_ROOT}/${LOCAL_POWER_NAME}` as const;
export const POWER_MANIFEST_NAME = "POWER.md" as const;
export const PLUGIN_MANIFEST_NAME = "plugin.json" as const;
export const POWER_MCP_CONFIG_NAME = "mcp.json" as const;
export const POWER_OWNER = "repository owner" as const;
export const POWER_VALIDATION_PREFIX = "validation:power" as const;
export const CAPABILITY_VALIDATION_PREFIX = "validation:capability" as const;
export const CAPABILITY_ROLLBACK_PREFIX = "rollback:capability" as const;
export const OD05_DECISION_ID = "OD-05" as const;
export const OD06_DECISION_ID = "OD-06" as const;
export const OD07_DECISION_ID = "OD-07" as const;
export const LOCAL_POWER_REGISTRY_ID = "registryId: local" as const;

export const DEFAULT_POWER_SURFACES = [
  "IDE",
  "CLI 2.x",
  "CLI 3.x",
  "Local_Repository_Surface",
] as const satisfies readonly KiroSurface[];

export const DEFAULT_EXTENSION_SURFACES = [
  "IDE",
  "CLI 2.x",
  "CLI 3.x",
  "Local_Repository_Surface",
] as const satisfies readonly KiroSurface[];

export type IntegrityResult = "pass" | "fail" | "unverified";

export interface CapabilityMetadataInput {
  readonly capabilityId?: string;
  readonly name?: string;
  readonly canonicalSource?: string;
  readonly revisionOrVersion?: string;
  readonly licenseOrSource?: string;
  readonly trustDecision?: TrustDecision;
  readonly integrityResult?: IntegrityResult;
  readonly repositoryAnswer?: RepositoryAnswer;
  readonly repositoryAnswerEvidence?: readonly string[];
  readonly serviceAndDataBoundary?: string;
  readonly secretBoundary?: string;
  readonly permissionBoundary?: string;
  readonly ownerApprovalRef?: string;
  readonly approvalBoundaryRef?: string;
  readonly targetValidationRefs?: readonly Identifier[];
  readonly provenance?: EvidenceProvenance;
  readonly expectedSideEffects?: readonly string[];
  readonly externalRoutingRequested?: boolean;
}

export interface PowerCandidateInput extends CapabilityMetadataInput {
  readonly pathOrInstallation: string;
  readonly powerManifestPresent?: boolean;
  readonly pluginManifestPresent?: boolean;
  readonly mcpConfigSummary?: string;
  readonly registryObservation?: string;
  readonly secrets?: SecretBoundary;
  readonly permissions?: PermissionBoundary;
  readonly surfaceValidationRefs?: readonly Identifier[];
  readonly disposition?: CapabilityDisposition;
  readonly migrationOrRetainPath?: string;
  readonly rollbackPath?: string;
}

export type ExtensionCandidateInput = Partial<ExtensionRecord> & CapabilityMetadataInput & {
  readonly kind?: ExtensionKind;
};

export interface CapabilityEvaluatorInput extends Partial<CapabilityInput> {
  readonly repositoryRoot?: RepositoryPath;
  readonly powers?: readonly PowerCandidateInput[];
  readonly installedPowers?: readonly PowerCandidateInput[];
  readonly powerPaths?: readonly RepositoryPath[];
  readonly mcpServices?: readonly ExtensionCandidateInput[];
  readonly tools?: readonly ExtensionCandidateInput[];
  readonly customAgents?: readonly ExtensionCandidateInput[];
  readonly subagents?: readonly ExtensionCandidateInput[];
  readonly validationRuns?: readonly ValidationRun[];
  readonly targetSurface?: {
    readonly surface: KiroSurface;
    readonly version: string;
  };
}

export interface PowerObservation {
  readonly observationId: Identifier;
  readonly component: "POWER.md" | "mcp.json" | "plugin.json" | "registryId: local";
  readonly path: RepositoryPath | string;
  readonly present: boolean;
  readonly empty?: boolean;
  readonly value: string;
  readonly evidenceState: EvidenceState;
  readonly provenance: EvidenceProvenance;
}

export interface RepositoryAnswerCheck {
  readonly checkId: Identifier;
  readonly capabilityId: Identifier;
  readonly name: string;
  readonly kind: "Kiro_Power" | ExtensionKind;
  readonly result: RepositoryAnswer;
  readonly question: string;
  readonly repositoryEvidence: readonly string[];
  readonly provenance: EvidenceProvenance;
  readonly evaluatedBeforeExternalRouting: true;
  readonly externalRoutingRequested: boolean;
  readonly externalRoutingAllowed: boolean;
  readonly limitation?: string;
}

export interface CapabilityEvidenceRecord {
  readonly capabilityId: Identifier;
  readonly kind: "Kiro_Power" | ExtensionKind;
  readonly name: string;
  readonly provenance: EvidenceProvenance;
  readonly revisionOrVersion: string;
  readonly licenseOrSource: string;
  readonly trustDecision: TrustDecision;
  readonly integrityResult: IntegrityResult;
  readonly secrets: SecretBoundary;
  readonly permissions: PermissionBoundary;
  readonly serviceAndDataBoundary: string;
  readonly resourceUris: readonly ResourceUri[];
  readonly ownerApprovalRef: string;
  readonly targetValidationRefs: readonly Identifier[];
  readonly repositoryAnswer: RepositoryAnswer;
  readonly repositoryAnswerEvidence: readonly string[];
  readonly dagOrReviewGraph: string;
  readonly maximumConcurrency: number;
  readonly iterationCeiling: number;
  readonly approvalBehavior: string;
  readonly failureBehavior: string;
  readonly rollbackPath: string;
}

export interface EvaluatedPowerRecord extends PowerRecord {
  readonly capabilityId: Identifier;
  readonly name: string;
  readonly observations: readonly PowerObservation[];
  readonly evidence: CapabilityEvidenceRecord;
  readonly blockers: readonly string[];
  readonly externalRoutingAllowed: boolean;
}

export interface EvaluatedExtensionRecord extends ExtensionRecord {
  readonly capabilityId: Identifier;
  readonly name: string;
  readonly evidence: CapabilityEvidenceRecord;
  readonly repositoryAnswerCheck: RepositoryAnswerCheck;
  readonly blockers: readonly string[];
  readonly externalRoutingAllowed: boolean;
}

export interface CapabilityEvaluationResult extends CapabilityResult {
  readonly powers: readonly EvaluatedPowerRecord[];
  readonly powerRecords: readonly EvaluatedPowerRecord[];
  readonly extensions: readonly EvaluatedExtensionRecord[];
  readonly extensionRecords: readonly EvaluatedExtensionRecord[];
  readonly observations: readonly PowerObservation[];
  readonly repositoryAnswerChecks: readonly RepositoryAnswerCheck[];
  readonly evidence: readonly CapabilityEvidenceRecord[];
  readonly externalRoutingAttempted: false;
  readonly blockers: readonly string[];
}

interface FileReadResult {
  readonly status: "present and readable" | "present but unreadable" | "absent";
  readonly text?: string;
}

interface PowerInspection {
  readonly path: RepositoryPath;
  readonly manifestStatus: FileReadResult["status"];
  readonly pluginStatus: FileReadResult["status"];
  readonly mcpStatus: FileReadResult["status"];
  readonly mcpEmpty: boolean;
  readonly mcpSummary: string;
  readonly observations: readonly PowerObservation[];
}

interface GapSpec {
  readonly kind: KnownGap["kind"];
  readonly title: string;
  readonly blockedAction: string;
  readonly disposition: CapabilityDisposition;
  readonly limitation: string;
  readonly evidenceRefs: readonly Identifier[];
}

interface EvaluationContext {
  readonly repositoryRoot: string;
  readonly ownerDecisions: readonly OwnerDecision[];
  readonly validationRuns: readonly ValidationRun[];
  readonly targetSurface?: CapabilityEvaluatorInput["targetSurface"];
  readonly knownGaps: KnownGap[];
  readonly policyViolations: string[];
  readonly blockers: string[];
}

interface NormalizedExtension {
  readonly record: ExtensionRecord;
  readonly name: string;
  readonly canonicalSource: string;
  readonly metadata: CapabilityMetadataInput;
  readonly missingFields: readonly string[];
  readonly resourceUrisWereExplicit: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function uniqueStrings(values: readonly string[]): string[] {
  return unique(values.filter((value) => value.trim().length > 0));
}

function normalizePath(path: string): RepositoryPath {
  return path.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+$/, "") as RepositoryPath;
}

function normalizeLocator(locator: string): string {
  return /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(locator)
    ? locator.trim()
    : normalizePath(locator);
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140) || "unnamed";
}

function redact(value: string): string {
  return value.replace(
    /((?:api[_-]?key|token|password|secret|credential)\s*[=:]\s*)[^\s,&]+/gi,
    "$1[REDACTED]",
  );
}

function insideRoot(root: string, candidate: string): boolean {
  const candidateRelative = relative(root, candidate).replaceAll("\\", "/");
  return candidateRelative === "" || (!candidateRelative.startsWith("../") && candidateRelative !== "..");
}

function resolveInsideRoot(root: string, repositoryPath: string): string | null {
  const absoluteRoot = resolve(root);
  const candidate = resolve(absoluteRoot, repositoryPath);
  return insideRoot(absoluteRoot, candidate) ? candidate : null;
}

function readRepositoryFile(root: string, repositoryPath: string): FileReadResult {
  const absolutePath = resolveInsideRoot(root, repositoryPath);
  if (!absolutePath) return { status: "present but unreadable" };

  try {
    const stats = lstatSync(absolutePath);
    if (stats.isSymbolicLink() || !stats.isFile()) return { status: "present but unreadable" };
    return { status: "present and readable", text: readFileSync(absolutePath, "utf8") };
  } catch (error: unknown) {
    if (isRecord(error) && error.code === "ENOENT") return { status: "absent" };
    return { status: "present but unreadable" };
  }
}

function pathExists(root: string, repositoryPath: string): boolean {
  return readRepositoryFile(root, repositoryPath).status === "present and readable";
}

function asString(record: Record<string, unknown>, key: string): string | undefined {
  return nonEmpty(record[key]) ? record[key].trim() : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(nonEmpty).map((item) => item.trim());
}

function asResourceUris(value: unknown): ResourceUri[] {
  return asStringArray(value).map((item) => item === "None" ? "None" : item);
}

function surface(value: unknown): KiroSurface | null {
  const surfaces: readonly KiroSurface[] = [
    "IDE",
    "CLI 2.x",
    "CLI 3.x",
    "Web",
    "Mobile",
    "Cloud/Crew",
    "Local_Repository_Surface",
  ];
  return typeof value === "string" && surfaces.includes(value as KiroSurface)
    ? value as KiroSurface
    : null;
}

function surfacesFrom(value: unknown): KiroSurface[] {
  if (!Array.isArray(value)) return [];
  return unique(value.map(surface).filter((item): item is KiroSurface => item !== null));
}

function powerFormat(powerManifestPresent: boolean, pluginManifestPresent: boolean): PowerFormat {
  if (powerManifestPresent && pluginManifestPresent) return "Both";
  if (powerManifestPresent) return "Legacy_POWER";
  if (pluginManifestPresent) return "Agent_Plugin";
  return "Neither";
}

export function classifyPowerFormat(
  powerManifestPresent: boolean | { readonly powerManifestPresent: boolean; readonly pluginManifestPresent: boolean },
  pluginManifestPresent?: boolean,
): PowerFormat {
  if (typeof powerManifestPresent === "object") {
    return powerFormat(powerManifestPresent.powerManifestPresent, powerManifestPresent.pluginManifestPresent);
  }
  return powerFormat(powerManifestPresent, pluginManifestPresent === true);
}

function parseJson(text: string | undefined): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function mcpSummary(read: FileReadResult): { readonly summary: string; readonly empty: boolean } {
  if (read.status === "absent") return { summary: "absent", empty: false };
  if (read.status === "present but unreadable") return { summary: "present but unreadable", empty: false };
  const parsed = parseJson(read.text);
  if (isRecord(parsed) && Object.keys(parsed).length === 0) {
    return { summary: "present and empty ({})", empty: true };
  }
  if (parsed !== undefined) return { summary: "present and non-empty (contents not persisted)", empty: false };
  return { summary: "present but invalid JSON", empty: false };
}

function powerDirectoryPath(locator: string): RepositoryPath {
  const normalized = normalizePath(locator);
  const knownFile = /\/(?:POWER\.md|plugin\.json|mcp\.json)$/i;
  return (knownFile.test(normalized) ? normalized.slice(0, normalized.lastIndexOf("/")) : normalized) as RepositoryPath;
}

function powerObservation(
  path: RepositoryPath | string,
  component: PowerObservation["component"],
  present: boolean,
  value: string,
  evidenceState: EvidenceState,
  provenanceResult: string,
  empty?: boolean,
): PowerObservation {
  return {
    observationId: `observation:power:${slug(String(path))}:${slug(component)}`,
    component,
    path,
    present,
    ...(empty === undefined ? {} : { empty }),
    value,
    evidenceState,
    provenance: {
      observer: POWER_OWNER,
      cwdOrSurface: REPOSITORY_ROOT,
      commandOrPath: String(path),
      result: provenanceResult,
    },
  };
}

function inspectPower(root: string, locator: string, registryObservation?: string): PowerInspection {
  const path = powerDirectoryPath(locator);
  const local = normalizePath(path).startsWith(`${POWER_ROOT}/`);
  const manifestPath = `${path}/${POWER_MANIFEST_NAME}`;
  const pluginPath = `${path}/${PLUGIN_MANIFEST_NAME}`;
  const mcpPath = `${path}/${POWER_MCP_CONFIG_NAME}`;
  const manifest = readRepositoryFile(root, manifestPath);
  const plugin = readRepositoryFile(root, pluginPath);
  const mcp = readRepositoryFile(root, mcpPath);
  const summary = mcpSummary(mcp);
  const observations: PowerObservation[] = [
    powerObservation(
      manifestPath,
      "POWER.md",
      manifest.status !== "absent",
      manifest.status === "present and readable" ? "present and readable" : manifest.status,
      manifest.status === "present and readable" ? "Observed" : "Unverified",
      `POWER.md ${manifest.status}`,
    ),
    powerObservation(
      mcpPath,
      "mcp.json",
      mcp.status !== "absent",
      summary.summary,
      mcp.status === "present and readable" ? "Observed" : "Unverified",
      `mcp.json ${summary.summary}`,
      summary.empty,
    ),
    powerObservation(
      pluginPath,
      "plugin.json",
      plugin.status !== "absent",
      plugin.status === "absent" ? "absent" : plugin.status,
      plugin.status === "absent" ? "Observed" : plugin.status === "present and readable" ? "Observed" : "Unverified",
      `plugin.json ${plugin.status}`,
    ),
  ];

  if (local && normalizePath(path).endsWith(`/${LOCAL_POWER_NAME}`)) {
    observations.push(
      powerObservation(
        LOCAL_POWER_REGISTRY_ID,
        "registryId: local",
        true,
        registryObservation ?? "registryId: local; registration is Unverified and does not establish loading",
        "Unverified",
        "registryId: local registration was not treated as a loading validation",
      ),
    );
  }

  return {
    path,
    manifestStatus: manifest.status,
    pluginStatus: plugin.status,
    mcpStatus: mcp.status,
    mcpEmpty: summary.empty,
    mcpSummary: summary.summary,
    observations,
  };
}

function discoverPowerPaths(root: string): RepositoryPath[] {
  const absoluteRoot = resolveInsideRoot(root, POWER_ROOT);
  if (!absoluteRoot) return [];
  try {
    return readdirSync(absoluteRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${POWER_ROOT}/${entry.name}` as RepositoryPath)
      .sort();
  } catch {
    return [];
  }
}

function defaultProvenance(
  locator: string,
  root: string,
  result: string,
  supplied?: EvidenceProvenance,
): EvidenceProvenance {
  if (supplied && nonEmpty(supplied.observer) && nonEmpty(supplied.commandOrPath)) {
    return {
      observer: redact(supplied.observer),
      cwdOrSurface: redact(supplied.cwdOrSurface),
      commandOrPath: redact(supplied.commandOrPath),
      result: redact(supplied.result),
      ...(supplied.integrityBasis ? { integrityBasis: redact(supplied.integrityBasis) } : {}),
    };
  }
  return {
    observer: POWER_OWNER,
    cwdOrSurface: root,
    commandOrPath: locator,
    result: redact(result),
  };
}

function decisionFor(
  decisions: readonly OwnerDecision[],
  decisionId: OwnerDecision["decisionId"],
): OwnerDecision | undefined {
  return decisions.find((decision) => decision.decisionId === decisionId);
}

function decisionApproved(decision: OwnerDecision | undefined): boolean {
  return decision !== undefined &&
    decision.selectedPolicy === "enable after validation" &&
    (decision.approvalStatus === "owner-approved" || decision.approvalStatus === "owner-approved-conditional") &&
    decision.unresolvedStatus !== "unresolved";
}

function decisionEvidenceRef(decision: OwnerDecision | undefined): string {
  return decision ? `owner-decision:${decision.decisionId}` : "none";
}

function validationRefs(
  refs: readonly Identifier[],
  validationRuns: readonly ValidationRun[],
  surfaces: readonly KiroSurface[],
  targetSurface: CapabilityEvaluatorInput["targetSurface"],
): Identifier[] {
  const requested = uniqueStrings(refs);
  if (requested.length === 0) return [];
  if (validationRuns.length === 0) return requested;

  return requested.filter((ref) => {
    const run = validationRuns.find((candidate) => candidate.validationId === ref);
    if (!run || run.result !== "pass" || run.blocker !== "none" || run.unverifiedItems.length > 0) return false;
    if (run.executionLayer !== "surface_validation") return false;
    if (targetSurface && (run.surface !== targetSurface.surface || run.version !== targetSurface.version)) return false;
    return surfaces.includes(run.surface);
  });
}

function surfaceVersions(surfaces: readonly KiroSurface[]): CapabilityEvaluatorResultSurface[] {
  return surfaces.flatMap((candidate) => {
    const match = REQUIRED_SURFACE_VERSIONS.find((record) => record.surface === candidate);
    return match ? [match] : [];
  });
}

type CapabilityEvaluatorResultSurface = (typeof REQUIRED_SURFACE_VERSIONS)[number];

function repositoryAnswerEvidence(root: string, supplied: readonly string[] | undefined, local: boolean): string[] {
  if (supplied && supplied.length > 0) return uniqueStrings(supplied).map(redact);
  if (local || pathExists(root, "AGENTS.md")) {
    return [
      "AGENTS.md",
      ".kiro/skills/repo-map/SKILL.md",
      "scripts/graph-impact.mjs",
    ];
  }
  return [];
}

export interface RepositoryAnswerRequest {
  readonly capabilityId: Identifier;
  readonly name: string;
  readonly kind: RepositoryAnswerCheck["kind"];
  readonly repositoryRoot?: RepositoryPath;
  readonly repositoryAnswer?: RepositoryAnswer;
  readonly repositoryAnswerEvidence?: readonly string[];
  readonly externalRoutingRequested?: boolean;
  readonly locator?: string;
}

export function checkRepositoryAnswer(input: RepositoryAnswerRequest): RepositoryAnswerCheck {
  const root = resolve(input.repositoryRoot ?? REPOSITORY_ROOT);
  const locator = input.locator ?? input.name;
  const local = normalizePath(locator).startsWith(`${POWER_ROOT}/`) || input.kind !== "MCP_Service" && input.kind !== "Kiro_Power";
  const evidence = repositoryAnswerEvidence(root, input.repositoryAnswerEvidence, local);
  const result = input.repositoryAnswer ?? (
    local ? "Answered" : evidence.length > 0 ? "Answered" : "Not_Testable"
  );
  const externalRoutingRequested = input.externalRoutingRequested === true || !local;
  return {
    checkId: `repository-answer:${slug(input.capabilityId)}`,
    capabilityId: input.capabilityId,
    name: input.name,
    kind: input.kind,
    result,
    question: `Can repository-local guidance and reviewed tools answer ${input.name} without external routing?`,
    repositoryEvidence: evidence,
    provenance: {
      observer: POWER_OWNER,
      cwdOrSurface: root,
      commandOrPath: input.locator ?? input.name,
      result: `repository-answer check classified as ${result} before external routing`,
    },
    evaluatedBeforeExternalRouting: true,
    externalRoutingRequested,
    externalRoutingAllowed: externalRoutingRequested && result === "Not_Answered",
    ...(result === "Not_Testable"
      ? { limitation: "the repository answer could not be tested from the supplied local evidence" }
      : {}),
  };
}

function makeGap(
  capabilityId: Identifier,
  spec: GapSpec,
  index: number,
): KnownGap {
  const suffix = slug(`${spec.title}-${index}`);
  return {
    gapId: `known-gap:${slug(capabilityId)}:${suffix}`,
    kind: spec.kind,
    title: spec.title,
    evidenceState: spec.kind === "missing_prerequisite" ? "Unverified" : spec.kind === "policy_conflict" ? "Unverified" : "Approval_Boundary",
    evidenceRefs: unique(spec.evidenceRefs),
    owner: POWER_OWNER,
    nextValidationRun: `${CAPABILITY_VALIDATION_PREFIX}:${slug(capabilityId)}:next`,
    blockedAction: spec.blockedAction,
    disposition: spec.disposition,
    status: "open",
    limitation: spec.limitation,
  };
}

function addGap(context: EvaluationContext, capabilityId: string, spec: GapSpec): string {
  const existing = context.knownGaps.find((gap) => gap.gapId.startsWith(`known-gap:${slug(capabilityId)}:${slug(spec.title)}`));
  if (existing) return existing.gapId;
  const gap = makeGap(capabilityId, spec, context.knownGaps.length);
  context.knownGaps.push(gap);
  return gap.gapId;
}

function approvalBoundaryFor(kind: "Kiro_Power" | ExtensionKind, external: boolean): string {
  if (!external) return "no_boundary";
  if (kind === "Kiro_Power") return "approval-boundary:OD-06";
  if (kind === "MCP_Service") return "approval-boundary:OD-06";
  return "approval-boundary:OD-07";
}

function configurationScopeFor(kind: "Kiro_Power" | ExtensionKind, external: boolean): ConfigurationScope {
  if (external || kind === "MCP_Service") return "external_service";
  if (kind === "Custom_Agent" || kind === "Subagent") return "agent";
  if (kind === "Tool_Surface") return "manual";
  return "project";
}

function targetValidationGap(
  capabilityId: string,
  validation: readonly Identifier[],
  context: EvaluationContext,
  evidenceRefs: readonly Identifier[],
): string | null {
  if (validation.length > 0) return null;
  return addGap(context, capabilityId, {
    kind: "unverified",
    title: "target-surface validation is missing",
    blockedAction: `activation of ${capabilityId}`,
    disposition: "defer",
    limitation: "a fresh exact target-surface Validation_Run is required before activation",
    evidenceRefs,
  });
}

function approvalGap(
  capabilityId: string,
  decisionId: OwnerDecision["decisionId"],
  approved: boolean,
  context: EvaluationContext,
  evidenceRefs: readonly Identifier[],
): string | null {
  if (approved) return null;
  return addGap(context, capabilityId, {
    kind: "missing_prerequisite",
    title: `owner approval ${decisionId} is missing or unresolved`,
    blockedAction: `activation of ${capabilityId}`,
    disposition: "defer",
    limitation: `the ${decisionId} owner decision must be approved for the exact capability scope`,
    evidenceRefs,
  });
}

function provenanceEvidence(
  capabilityId: string,
  kind: "Kiro_Power" | ExtensionKind,
  name: string,
  provenance: EvidenceProvenance,
  revisionOrVersion: string,
  licenseOrSource: string,
  trustDecision: TrustDecision,
  integrityResult: IntegrityResult,
  secrets: SecretBoundary,
  permissions: PermissionBoundary,
  serviceAndDataBoundary: string,
  resourceUris: readonly ResourceUri[],
  ownerApprovalRef: string,
  targetValidationRefs: readonly Identifier[],
  answer: RepositoryAnswerCheck,
  dagOrReviewGraph: string,
  maximumConcurrency: number,
  iterationCeiling: number,
  approvalBehavior: string,
  failureBehavior: string,
  rollbackPath: string,
): CapabilityEvidenceRecord {
  return {
    capabilityId,
    kind,
    name,
    provenance,
    revisionOrVersion: nonEmpty(revisionOrVersion) ? redact(revisionOrVersion) : "unavailable",
    licenseOrSource: nonEmpty(licenseOrSource) ? redact(licenseOrSource) : "unavailable",
    trustDecision,
    integrityResult,
    secrets,
    permissions,
    serviceAndDataBoundary: nonEmpty(serviceAndDataBoundary) ? redact(serviceAndDataBoundary) : "unavailable",
    resourceUris: resourceUris.length > 0 ? resourceUris : ["None"],
    ownerApprovalRef,
    targetValidationRefs,
    repositoryAnswer: answer.result,
    repositoryAnswerEvidence: answer.repositoryEvidence,
    dagOrReviewGraph: nonEmpty(dagOrReviewGraph) ? redact(dagOrReviewGraph) : "unavailable",
    maximumConcurrency,
    iterationCeiling,
    approvalBehavior: nonEmpty(approvalBehavior) ? approvalBehavior : "unknown",
    failureBehavior: nonEmpty(failureBehavior) ? failureBehavior : "unknown",
    rollbackPath: nonEmpty(rollbackPath) ? redact(rollbackPath) : "unavailable",
  };
}

function powerDispositionRecord(
  record: EvaluatedPowerRecord,
  knownGapRefs: readonly string[],
  reason: string,
): CapabilityDispositionRecord {
  const external = record.pathOrInstallation.startsWith("http://") || record.pathOrInstallation.startsWith("https://");
  return {
    capabilityId: record.capabilityId,
    kind: "Kiro_Power",
    name: record.name,
    disposition: record.disposition,
    configurationScope: configurationScopeFor("Kiro_Power", external),
    canonicalSource: record.pathOrInstallation,
    surfaceVersionApplicability: surfaceVersions(DEFAULT_POWER_SURFACES),
    activationCondition: "after repository-answer, provenance, owner approval, exact-surface loading validation, and rollback validation",
    owner: POWER_OWNER,
    approvalBoundaryRef: approvalBoundaryFor("Kiro_Power", external),
    evidenceRefs: unique([...record.evidence.surfaceValidationRefs, ...record.evidence.repositoryAnswerEvidence, ...knownGapRefs]),
    validationAction: "run a fresh exact Active_Surface power-loading Validation_Run without external side effects",
    expectedSideEffects: ["no external routing until the repository-answer check and named boundary pass"],
    rollbackPath: record.rollbackPath,
    reason: reason || "power disposition recorded",
    knownGapRefs: unique(knownGapRefs),
  };
}

function extensionDispositionRecord(
  record: EvaluatedExtensionRecord,
  canonicalSource: string,
  knownGapRefs: readonly string[],
  reason: string,
): CapabilityDispositionRecord {
  const external = record.kind === "MCP_Service" || nonEmpty(record.evidence.serviceAndDataBoundary) && record.kind !== "Tool_Surface";
  return {
    capabilityId: record.capabilityId,
    kind: record.kind,
    name: record.name,
    disposition: record.disposition,
    configurationScope: configurationScopeFor(record.kind, external),
    canonicalSource: canonicalSource || "unavailable",
    surfaceVersionApplicability: surfaceVersions(record.surfaceAvailability),
    activationCondition: "after configuration, repository-answer, owner approval, target-surface validation, bounded execution, and rollback validation",
    owner: record.owner,
    approvalBoundaryRef: approvalBoundaryFor(record.kind, external),
    evidenceRefs: unique([...record.evidence.targetValidationRefs, ...record.evidence.repositoryAnswerEvidence, ...knownGapRefs]),
    validationAction: "validate the exact selected surface/version, resource URIs, approval behavior, failure behavior, and rollback",
    expectedSideEffects: record.kind === "MCP_Service"
      ? ["external service access is prohibited until named service/data/secret/permission boundaries pass"]
      : ["activation remains bounded to the declared scope and concurrency"],
    rollbackPath: record.rollbackPath,
    reason: reason || "extension disposition recorded",
    knownGapRefs: unique(knownGapRefs),
  };
}

function extensionMetadata(input: ExtensionCandidateInput): CapabilityMetadataInput {
  const raw = input as Record<string, unknown>;
  return {
    capabilityId: asString(raw, "capabilityId"),
    name: asString(raw, "name"),
    canonicalSource: asString(raw, "canonicalSource"),
    revisionOrVersion: asString(raw, "revisionOrVersion"),
    licenseOrSource: asString(raw, "licenseOrSource"),
    trustDecision: raw.trustDecision === "trusted" || raw.trustDecision === "untrusted" || raw.trustDecision === "unresolved"
      ? raw.trustDecision
      : undefined,
    integrityResult: raw.integrityResult === "pass" || raw.integrityResult === "fail" || raw.integrityResult === "unverified"
      ? raw.integrityResult
      : undefined,
    repositoryAnswer: raw.repositoryAnswer === "Answered" || raw.repositoryAnswer === "Not_Answered" || raw.repositoryAnswer === "Not_Testable"
      ? raw.repositoryAnswer
      : undefined,
    repositoryAnswerEvidence: asStringArray(raw.repositoryAnswerEvidence),
    serviceAndDataBoundary: asString(raw, "serviceAndDataBoundary"),
    secretBoundary: asString(raw, "secretBoundary"),
    permissionBoundary: asString(raw, "permissionBoundary"),
    ownerApprovalRef: asString(raw, "ownerApprovalRef"),
    approvalBoundaryRef: asString(raw, "approvalBoundaryRef"),
    targetValidationRefs: asStringArray(raw.targetValidationRefs) as Identifier[],
    provenance: isRecord(raw.provenance) ? raw.provenance as EvidenceProvenance : undefined,
    expectedSideEffects: asStringArray(raw.expectedSideEffects),
    externalRoutingRequested: raw.externalRoutingRequested === true,
  };
}

function normalizeExtension(input: ExtensionCandidateInput, fallbackKind?: ExtensionKind, fallbackSource?: string): NormalizedExtension {
  const raw = input as Record<string, unknown>;
  const kinds: readonly ExtensionKind[] = ["MCP_Service", "Tool_Surface", "Custom_Agent", "Subagent"];
  const kind = kinds.includes(raw.kind as ExtensionKind)
    ? raw.kind as ExtensionKind
    : fallbackKind ?? "Tool_Surface";
  const metadata = extensionMetadata(input);
  const source = metadata.canonicalSource ?? fallbackSource ?? `${kind}`;
  const configuredName = metadata.name ?? asString(raw, "displayName");
  const name = configuredName ?? `${kind}:${source}`;
  const executionLayerValues: readonly ExecutionLayer[] = [
    "default_native_task",
    "reviewer_stage",
    "implementation_wave",
    "integration_gate",
    "surface_validation",
    "crew",
  ];
  const approvalValues = ["explicit", "prompted", "implicit", "unknown"] as const;
  const failureValues = ["stop", "preserve_state", "fail_closed", "unknown"] as const;
  const compatibilityValues = ["compatible", "incompatible", "Unverified"] as const;
  const executionLayer = executionLayerValues.includes(raw.executionLayer as ExecutionLayer)
    ? raw.executionLayer as ExecutionLayer
    : "default_native_task";
  const surfaceAvailability = surfacesFrom(raw.surfaceAvailability);
  const resourcesValueProvided = Array.isArray(raw.resourceUris);
  const resourceUris = resourcesValueProvided ? asResourceUris(raw.resourceUris) : [];
  const rawMaximum = raw.maximumConcurrency;
  const maximumConcurrency = typeof rawMaximum === "number" && Number.isInteger(rawMaximum) && rawMaximum >= 0 && rawMaximum <= 1
    ? rawMaximum as DefaultTaskConcurrency
    : 0;
  const rawIteration = raw.iterationCeiling;
  const iterationCeiling = typeof rawIteration === "number" && Number.isInteger(rawIteration) && rawIteration >= 0 && rawIteration <= 3
    ? rawIteration
    : 0;
  const missingFields: string[] = [];
  if (!nonEmpty(raw.configurationFormat)) missingFields.push("configuration format");
  if (surfaceAvailability.length === 0) missingFields.push("surface availability");
  if (!nonEmpty(raw.scope)) missingFields.push("scope");
  if (!nonEmpty(raw.activation)) missingFields.push("activation");
  if (!nonEmpty(raw.authorityRelationship)) missingFields.push("authority relationship");
  if (!resourcesValueProvided || resourceUris.length === 0) missingFields.push("resource URIs or explicit None");
  if (typeof rawMaximum !== "number" || rawMaximum < 0 || rawMaximum > 1 || !Number.isInteger(rawMaximum)) missingFields.push("maximum concurrency 0 or 1");
  if (typeof rawIteration !== "number" || rawIteration < 0 || rawIteration > 3 || !Number.isInteger(rawIteration)) missingFields.push("review iteration ceiling 0 through 3");
  if (!approvalValues.includes(raw.approvalBehavior as (typeof approvalValues)[number])) missingFields.push("approval behavior");
  if (!failureValues.includes(raw.failureBehavior as (typeof failureValues)[number])) missingFields.push("failure behavior");
  if (!compatibilityValues.includes(raw.repositoryCompatibility as (typeof compatibilityValues)[number])) missingFields.push("repository compatibility");
  if (!nonEmpty(raw.owner)) missingFields.push("owner");
  if (!nonEmpty(raw.rollbackPath)) missingFields.push("rollback path");
  if (kind === "Subagent" && !nonEmpty(raw.dagOrReviewGraph)) missingFields.push("DAG or review graph");
  if (kind === "MCP_Service") {
    if (!nonEmpty(raw.serviceAndDataBoundary)) missingFields.push("named service/data boundary");
    if (!nonEmpty(raw.secretBoundary)) missingFields.push("secret boundary");
    if (!nonEmpty(raw.permissionBoundary)) missingFields.push("permission boundary");
  }

  const record: ExtensionRecord = {
    kind,
    executionLayer,
    configurationFormat: asString(raw, "configurationFormat") ?? "unavailable",
    surfaceAvailability: surfaceAvailability.length > 0 ? surfaceAvailability : ["Local_Repository_Surface"],
    scope: asString(raw, "scope") ?? "unavailable",
    activation: asString(raw, "activation") ?? "unavailable",
    authorityRelationship: asString(raw, "authorityRelationship") ?? "unavailable",
    resourceUris: resourceUris.length > 0 ? resourceUris : ["None"],
    ...(nonEmpty(raw.serviceAndDataBoundary) ? { serviceAndDataBoundary: raw.serviceAndDataBoundary.trim() } : {}),
    ...(nonEmpty(raw.secretBoundary) ? { secretBoundary: raw.secretBoundary.trim() } : {}),
    ...(nonEmpty(raw.permissionBoundary) ? { permissionBoundary: raw.permissionBoundary.trim() } : {}),
    ...(nonEmpty(raw.dagOrReviewGraph) ? { dagOrReviewGraph: raw.dagOrReviewGraph.trim() } : {}),
    maximumConcurrency,
    iterationCeiling,
    approvalBehavior: approvalValues.includes(raw.approvalBehavior as (typeof approvalValues)[number])
      ? raw.approvalBehavior as (typeof approvalValues)[number]
      : "unknown",
    failureBehavior: failureValues.includes(raw.failureBehavior as (typeof failureValues)[number])
      ? raw.failureBehavior as FailureBehavior
      : "unknown",
    repositoryCompatibility: compatibilityValues.includes(raw.repositoryCompatibility as (typeof compatibilityValues)[number])
      ? raw.repositoryCompatibility as RepositoryCompatibility
      : "Unverified",
    validationRunRefs: asStringArray(raw.validationRunRefs) as Identifier[],
    owner: asString(raw, "owner") ?? "unassigned",
    disposition: "defer",
    rollbackPath: asString(raw, "rollbackPath") ?? "",
  };

  return {
    record,
    name,
    canonicalSource: source,
    metadata,
    missingFields: unique(missingFields),
    resourceUrisWereExplicit: resourcesValueProvided && resourceUris.length > 0,
  };
}

function defaultExtensionCandidate(
  kind: ExtensionKind,
  source: RepositoryPath,
  name: string,
  overrides: Record<string, unknown> = {},
): ExtensionCandidateInput {
  return {
    kind,
    name,
    canonicalSource: source,
    configurationFormat: `${kind} configuration`,
    surfaceAvailability: [...DEFAULT_EXTENSION_SURFACES],
    scope: "repository-local project configuration",
    activation: "after explicit owner approval and exact target-surface validation",
    authorityRelationship: "repository-local configuration is authoritative only for its declared scope",
    resourceUris: ["None"],
    dagOrReviewGraph: kind === "Subagent" ? undefined : "not applicable",
    maximumConcurrency: 0,
    iterationCeiling: 0,
    approvalBehavior: "explicit",
    failureBehavior: "fail_closed",
    repositoryCompatibility: "Unverified",
    validationRunRefs: [],
    owner: POWER_OWNER,
    rollbackPath: `${CAPABILITY_ROLLBACK_PREFIX}:${slug(name)}:disable and restore configuration`,
    ...overrides,
  };
}

function discoverMcpExtensions(root: string, artifact: ArtifactInventoryRecord): ExtensionCandidateInput[] {
  const read = readRepositoryFile(root, artifact.path);
  const parsed = parseJson(read.text);
  if (!isRecord(parsed)) return [];
  const servers = isRecord(parsed.mcpServers) ? parsed.mcpServers : parsed;
  const entries = Object.entries(servers).filter(([key, value]) => key !== "mcpServers" && isRecord(value));
  return entries.map(([name, value]) => {
    const config = value as Record<string, unknown>;
    const resourceUris = [asString(config, "url"), asString(config, "serverUrl"), asString(config, "endpoint")].filter(
      (item): item is string => item !== undefined,
    );
    return defaultExtensionCandidate("MCP_Service", artifact.path, `mcp:${name}`, {
      resourceUris: resourceUris.length > 0 ? resourceUris : ["None"],
      serviceAndDataBoundary: `MCP service ${name}; data boundary requires explicit owner approval`,
      secretBoundary: "named boundary required before connection",
      permissionBoundary: "named boundary required before tool use",
      repositoryAnswer: "Not_Testable",
      externalRoutingRequested: true,
    });
  });
}

function discoverAgentExtensions(root: string, artifact: ArtifactInventoryRecord): ExtensionCandidateInput[] {
  const read = readRepositoryFile(root, artifact.path);
  const parsed = parseJson(read.text);
  if (!isRecord(parsed)) return [];
  const configuredAgents = Array.isArray(parsed.agents)
    ? parsed.agents.filter(isRecord)
    : isRecord(parsed.agents)
      ? Object.entries(parsed.agents).filter((entry): entry is [string, Record<string, unknown>] => isRecord(entry[1])).map(([name, value]) => ({ ...value, name }))
      : [parsed];
  return configuredAgents.map((agent, index) => {
    const name = asString(agent, "name") ?? `custom-agent:${index + 1}`;
    const resources = asStringArray(agent.resourceUris ?? agent.resources ?? agent.resource);
    return defaultExtensionCandidate("Custom_Agent", artifact.path, name, {
      resourceUris: resources.length > 0 ? resources : [],
      configurationFormat: "custom-agent configuration",
      scope: asString(agent, "scope") ?? "agent-scoped configuration",
      activation: asString(agent, "activation") ?? "explicit custom-agent activation after validation",
      authorityRelationship: asString(agent, "authorityRelationship") ?? "custom agent is subordinate to repository authority",
      dagOrReviewGraph: "not applicable",
    });
  });
}

function discoverArtifactExtensions(root: string, artifacts: readonly ArtifactInventoryRecord[]): ExtensionCandidateInput[] {
  const discovered: ExtensionCandidateInput[] = [];
  for (const artifact of artifacts) {
    if (artifact.kind === "MCP_Service") discovered.push(...discoverMcpExtensions(root, artifact));
    if (artifact.kind === "Custom_Agent") discovered.push(...discoverAgentExtensions(root, artifact));
    if (artifact.kind === "Tool_Surface") {
      discovered.push(defaultExtensionCandidate("Tool_Surface", artifact.path, `tool:${artifact.path}`, {
        configurationFormat: "built-in tool surface",
        scope: artifact.configurationScope,
        activation: artifact.activationCondition,
        repositoryCompatibility: "Unverified",
      }));
    }
    if (artifact.kind === "Subagent") {
      discovered.push(defaultExtensionCandidate("Subagent", artifact.path, `subagent:${artifact.path}`, {
        dagOrReviewGraph: undefined,
        configurationFormat: "subagent configuration",
      }));
    }
  }
  return discovered;
}

function externalForExtension(record: ExtensionRecord, metadata: CapabilityMetadataInput): boolean {
  return record.kind === "MCP_Service" || metadata.externalRoutingRequested === true || nonEmpty(record.serviceAndDataBoundary);
}

function evaluatePower(
  candidate: PowerCandidateInput,
  context: EvaluationContext,
  index: number,
): { readonly record: EvaluatedPowerRecord; readonly disposition: CapabilityDispositionRecord; readonly answer: RepositoryAnswerCheck; readonly evidence: CapabilityEvidenceRecord } {
  const root = context.repositoryRoot;
  const locator = normalizeLocator(candidate.pathOrInstallation);
  const local = normalizePath(locator).startsWith(`${POWER_ROOT}/`);
  const inspection = local ? inspectPower(root, locator, candidate.registryObservation) : undefined;
  const powerManifestPresent = candidate.powerManifestPresent ?? inspection?.manifestStatus !== "absent";
  const pluginManifestPresent = candidate.pluginManifestPresent ?? inspection?.pluginStatus !== "absent";
  const format = classifyPowerFormat(powerManifestPresent, pluginManifestPresent);
  const capabilityId = candidate.capabilityId ?? `capability:power:${slug(locator)}`;
  const name = candidate.name ?? (local ? normalizePath(locator).slice(`${POWER_ROOT}/`.length) : locator);
  const answer = checkRepositoryAnswer({
    capabilityId,
    name,
    kind: "Kiro_Power",
    repositoryRoot: root,
    repositoryAnswer: candidate.repositoryAnswer,
    repositoryAnswerEvidence: candidate.repositoryAnswerEvidence,
    externalRoutingRequested: candidate.externalRoutingRequested ?? !local,
    locator,
  });
  const decision = decisionFor(context.ownerDecisions, OD05_DECISION_ID);
  const ownerApproved = decisionApproved(decision);
  const suppliedValidationRefs = candidate.surfaceValidationRefs ?? candidate.targetValidationRefs ?? [];
  const targetValidationRefs = validationRefs(suppliedValidationRefs, context.validationRuns, DEFAULT_POWER_SURFACES, context.targetSurface);
  const trustDecision: TrustDecision = candidate.trustDecision ?? (local ? "trusted" : "unresolved");
  const integrityResult: IntegrityResult = candidate.integrityResult ?? (local && powerManifestPresent ? "pass" : "unverified");
  const secrets: SecretBoundary = candidate.secrets ?? "none_declared";
  const permissions: PermissionBoundary = candidate.permissions ?? "none_declared";
  const external = !local;
  const serviceBoundary = candidate.serviceAndDataBoundary ?? (local ? "repository-local power; no external service" : "");
  const rollbackPath = candidate.rollbackPath ?? `${CAPABILITY_ROLLBACK_PREFIX}:${slug(name)}:remove activation or restore prior registration`;
  const migration = candidate.migrationOrRetainPath ?? (
    format === "Legacy_POWER"
      ? "retain legacy POWER.md until a validated Agent Plugin migration is approved"
      : "retain only after exact-surface loading and rollback validation"
  );
  const revision = candidate.revisionOrVersion ?? "unavailable";
  const license = candidate.licenseOrSource ?? "unavailable";
  const provenance = defaultProvenance(
    locator,
    root,
    inspection
      ? inspection.observations.map((observation) => `${observation.component}: ${observation.value}`).join("; ")
      : "installed power metadata supplied without local file inspection",
    candidate.provenance,
  );
  const evidenceRefs = [`evidence:${capabilityId}:provenance`, answer.checkId];
  const evidence = provenanceEvidence(
    capabilityId,
    "Kiro_Power",
    name,
    provenance,
    revision,
    license,
    trustDecision,
    integrityResult,
    secrets,
    permissions,
    serviceBoundary,
    ["None"],
    decisionEvidenceRef(decision),
    targetValidationRefs,
    answer,
    "not applicable to power loading",
    0,
    0,
    "explicit",
    "fail_closed",
    rollbackPath,
  );
  const blockers: string[] = [];
  const gapRefs: string[] = [];
  if (format === "Neither") blockers.push("power has neither POWER.md nor plugin.json and cannot be adopted");
  if (inspection?.manifestStatus === "present but unreadable" || inspection?.pluginStatus === "present but unreadable") {
    blockers.push("power manifest state is unreadable");
  }
  if (trustDecision !== "trusted") blockers.push(`power trust decision is ${trustDecision}`);
  if (integrityResult !== "pass") blockers.push(`power integrity result is ${integrityResult}`);
  if (external && answer.result !== "Not_Answered") {
    blockers.push(`external power routing is blocked because repository-answer result is ${answer.result}`);
    gapRefs.push(addGap(context, capabilityId, {
      kind: answer.result === "Not_Testable" ? "unverified" : "policy_conflict",
      title: `repository-answer check returned ${answer.result}`,
      blockedAction: `external routing for ${name}`,
      disposition: "defer",
      limitation: answer.limitation ?? "repository-local answers must be exhausted before external routing",
      evidenceRefs: [answer.checkId],
    }));
  }
  if (external && !nonEmpty(serviceBoundary)) {
    blockers.push("external power requires a named service and data boundary");
    gapRefs.push(addGap(context, capabilityId, {
      kind: "missing_prerequisite",
      title: "named external service/data boundary is missing",
      blockedAction: `external routing for ${name}`,
      disposition: "defer",
      limitation: "record the exact service, data boundary, secret boundary, and permission boundary before routing",
      evidenceRefs,
    }));
  }
  if (!ownerApproved) {
    blockers.push(`owner approval ${OD05_DECISION_ID} is missing or unresolved`);
    const gap = approvalGap(capabilityId, OD05_DECISION_ID, ownerApproved, context, evidenceRefs);
    if (gap) gapRefs.push(gap);
  }
  const validationGap = targetValidationGap(capabilityId, targetValidationRefs, context, evidenceRefs);
  if (validationGap) {
    blockers.push("fresh exact target-surface power validation is missing");
    gapRefs.push(validationGap);
  }
  if (secrets === "named_boundary" && !external) blockers.push("local power declares an unnecessary secret boundary");
  if (!nonEmpty(rollbackPath)) {
    blockers.push("power rollback path is missing");
    gapRefs.push(addGap(context, capabilityId, {
      kind: "missing_prerequisite",
      title: "rollback path is missing",
      blockedAction: `activation of ${name}`,
      disposition: "defer",
      limitation: "record a concrete disable or restoration action before activation",
      evidenceRefs,
    }));
  }

  const unsafe = integrityResult === "fail" || trustDecision === "untrusted" || format === "Neither";
  const disposition: CapabilityDisposition = unsafe ? "disable" : external ? "defer" : blockers.length > 0 ? "observe" : "retain";
  const record: EvaluatedPowerRecord = {
    pathOrInstallation: locator,
    format,
    powerManifestPresent,
    pluginManifestPresent,
    mcpConfigSummary: candidate.mcpConfigSummary ?? inspection?.mcpSummary ?? "unavailable",
    ...(candidate.registryObservation || inspection?.observations.some((observation) => observation.component === "registryId: local")
      ? { registryObservation: candidate.registryObservation ?? "registryId: local; loading remains Unverified" }
      : {}),
    repositoryAnswer: answer.result,
    migrationOrRetainPath: migration,
    provenance,
    secrets,
    permissions,
    surfaceValidationRefs: targetValidationRefs,
    ...(ownerApproved ? { ownerApprovalRef: candidate.ownerApprovalRef ?? decisionEvidenceRef(decision) } : {}),
    disposition,
    rollbackPath,
    capabilityId,
    name,
    observations: inspection?.observations ?? [],
    evidence,
    blockers: unique(blockers),
    externalRoutingAllowed: answer.externalRoutingAllowed && blockers.length === 0,
  };
  const dispositionRecord = powerDispositionRecord(record, gapRefs, blockers.join("; ") || migration);
  return { record, disposition: dispositionRecord, answer, evidence };
}

function evaluateExtension(
  candidate: ExtensionCandidateInput,
  context: EvaluationContext,
  index: number,
): { readonly record: EvaluatedExtensionRecord; readonly disposition: CapabilityDispositionRecord; readonly answer: RepositoryAnswerCheck; readonly evidence: CapabilityEvidenceRecord } {
  const normalized = normalizeExtension(candidate);
  const { record: base, metadata } = normalized;
  const capabilityId = metadata.capabilityId ?? `capability:${base.kind.toLowerCase()}:${slug(normalized.name)}${index > 0 ? `-${index}` : ""}`;
  const answer = checkRepositoryAnswer({
    capabilityId,
    name: normalized.name,
    kind: base.kind,
    repositoryRoot: context.repositoryRoot,
    repositoryAnswer: metadata.repositoryAnswer,
    repositoryAnswerEvidence: metadata.repositoryAnswerEvidence,
    externalRoutingRequested: metadata.externalRoutingRequested ?? externalForExtension(base, metadata),
    locator: normalized.canonicalSource,
  });
  const decisionId = base.kind === "MCP_Service" ? OD06_DECISION_ID : OD07_DECISION_ID;
  const decision = decisionFor(context.ownerDecisions, decisionId);
  const ownerApproved = decisionApproved(decision);
  const targetValidationRefs = validationRefs(base.validationRunRefs, context.validationRuns, base.surfaceAvailability, context.targetSurface);
  const trustDecision: TrustDecision = metadata.trustDecision ?? "unresolved";
  const integrityResult: IntegrityResult = metadata.integrityResult ?? "unverified";
  const external = externalForExtension(base, metadata);
  const serviceBoundary = metadata.serviceAndDataBoundary ?? base.serviceAndDataBoundary ?? (base.kind === "MCP_Service" ? "" : "repository-local extension scope");
  const secretBoundary = metadata.secretBoundary ?? base.secretBoundary ?? "";
  const permissionBoundary = metadata.permissionBoundary ?? base.permissionBoundary ?? "";
  const rollbackPath = base.rollbackPath;
  const evidenceRefs = [`evidence:${capabilityId}:provenance`, answer.checkId];
  const evidence = provenanceEvidence(
    capabilityId,
    base.kind,
    normalized.name,
    defaultProvenance(normalized.canonicalSource, context.repositoryRoot, "extension metadata inspected without activation", metadata.provenance),
    metadata.revisionOrVersion ?? "unavailable",
    metadata.licenseOrSource ?? "unavailable",
    trustDecision,
    integrityResult,
    base.kind === "MCP_Service" ? "named_boundary" : "none_declared",
    base.kind === "MCP_Service" ? "named_boundary" : "none_declared",
    serviceBoundary,
    base.resourceUris,
    decisionEvidenceRef(decision),
    targetValidationRefs,
    answer,
    base.dagOrReviewGraph ?? "not applicable",
    base.maximumConcurrency,
    base.iterationCeiling,
    base.approvalBehavior,
    base.failureBehavior,
    rollbackPath,
  );
  const blockers: string[] = [];
  const gapRefs: string[] = [];
  if (normalized.missingFields.length > 0) {
    blockers.push(...normalized.missingFields.map((field) => `${field} is missing or invalid`));
    gapRefs.push(addGap(context, capabilityId, {
      kind: "missing_prerequisite",
      title: "required extension capability fields are incomplete",
      blockedAction: `activation of ${normalized.name}`,
      disposition: "defer",
      limitation: normalized.missingFields.join(", "),
      evidenceRefs,
    }));
  }
  if (base.kind === "Custom_Agent" && !normalized.resourceUrisWereExplicit) {
    blockers.push("custom agent must record every applicable resource URI or an explicit None value");
  }
  if (base.kind === "Subagent" && !nonEmpty(base.dagOrReviewGraph)) {
    blockers.push("subagent adoption requires a DAG or review-loop graph");
  }
  if (base.maximumConcurrency > 1) {
    blockers.push("default/native extension and reviewer stages may not exceed maximum concurrency one");
    context.policyViolations.push(`${normalized.name}: maximum concurrency exceeds one`);
  }
  if (base.executionLayer === "reviewer_stage" && (base.maximumConcurrency !== 1 || base.iterationCeiling > 3)) {
    blockers.push("reviewer-stage concurrency must be one and iteration ceiling must be between zero and three");
  }
  if (base.executionLayer === "crew") {
    blockers.push("Crew execution is not repository-compatible for this local capability evaluator");
    context.policyViolations.push(`${normalized.name}: Crew execution is deferred or excluded until separately approved and validated`);
  }
  if (base.repositoryCompatibility === "incompatible") {
    blockers.push("extension is marked repository-incompatible");
    context.policyViolations.push(`${normalized.name}: repository compatibility is incompatible`);
  } else if (base.repositoryCompatibility === "Unverified") {
    gapRefs.push(addGap(context, capabilityId, {
      kind: "unverified",
      title: "repository compatibility is Unverified",
      blockedAction: `activation of ${normalized.name}`,
      disposition: "defer",
      limitation: "documented or registered capability evidence does not establish local compatibility",
      evidenceRefs,
    }));
  }
  if (trustDecision !== "trusted") blockers.push(`extension trust decision is ${trustDecision}`);
  if (integrityResult !== "pass") blockers.push(`extension integrity result is ${integrityResult}`);
  if (external && answer.result !== "Not_Answered") {
    blockers.push(`external routing is blocked because repository-answer result is ${answer.result}`);
    gapRefs.push(addGap(context, capabilityId, {
      kind: answer.result === "Not_Testable" ? "unverified" : "policy_conflict",
      title: `repository-answer check returned ${answer.result}`,
      blockedAction: `external routing for ${normalized.name}`,
      disposition: "defer",
      limitation: answer.limitation ?? "external routing must wait until repository-local answers are ruled out",
      evidenceRefs: [answer.checkId],
    }));
  }
  if (base.kind === "MCP_Service") {
    if (!nonEmpty(serviceBoundary)) blockers.push("MCP service requires a named service and data boundary");
    if (!nonEmpty(secretBoundary)) blockers.push("MCP service requires a named secret boundary or explicit none-declared record");
    if (!nonEmpty(permissionBoundary)) blockers.push("MCP service requires a named permission boundary or explicit none-declared record");
    if (blockers.some((blocker) => blocker.includes("boundary"))) {
      gapRefs.push(addGap(context, capabilityId, {
        kind: "missing_prerequisite",
        title: "MCP service boundary record is incomplete",
        blockedAction: `routing to ${normalized.name}`,
        disposition: "defer",
        limitation: "service/data, secret, permission, owner, target validation, and revocation records are required",
        evidenceRefs,
      }));
    }
  }
  const approvalGapRef = approvalGap(capabilityId, decisionId, ownerApproved, context, evidenceRefs);
  if (approvalGapRef) {
    blockers.push(`owner approval ${decisionId} is missing or unresolved`);
    gapRefs.push(approvalGapRef);
  }
  const validationGapRef = targetValidationGap(capabilityId, targetValidationRefs, context, evidenceRefs);
  if (validationGapRef) {
    blockers.push("fresh exact target-surface extension validation is missing");
    gapRefs.push(validationGapRef);
  }
  if (!nonEmpty(rollbackPath)) {
    blockers.push("extension rollback path is missing");
    gapRefs.push(addGap(context, capabilityId, {
      kind: "missing_prerequisite",
      title: "extension rollback path is missing",
      blockedAction: `activation of ${normalized.name}`,
      disposition: "defer",
      limitation: "record a concrete disable or restore action before adoption",
      evidenceRefs,
    }));
  }
  if (base.approvalBehavior === "implicit" || base.approvalBehavior === "unknown") blockers.push("extension approval behavior is not explicit");
  if (base.failureBehavior === "unknown") blockers.push("extension failure behavior is not recorded");
  if (base.resourceUris.length === 0) blockers.push("extension resource URI record is empty; use None when no URI applies");

  const unsafe = integrityResult === "fail" || trustDecision === "untrusted" || base.repositoryCompatibility === "incompatible";
  const incomplete = blockers.length > 0 || gapRefs.length > 0;
  const disposition: CapabilityDisposition = unsafe ? "disable" : incomplete ? "defer" : "retain";
  const record: EvaluatedExtensionRecord = {
    ...base,
    capabilityId,
    name: normalized.name,
    disposition,
    evidence,
    repositoryAnswerCheck: answer,
    blockers: unique(blockers),
    externalRoutingAllowed: answer.externalRoutingAllowed && !incomplete,
  };
  const dispositionRecord = extensionDispositionRecord(record, normalized.canonicalSource, gapRefs, blockers.join("; ") || "extension metadata and bounded execution record are complete");
  return { record, disposition: dispositionRecord, answer, evidence };
}

function artifactDisposition(
  artifact: ArtifactInventoryRecord,
  knownGapRefs: readonly string[] = [],
): CapabilityDispositionRecord {
  const capabilityId = `artifact:${slug(artifact.kind)}:${slug(artifact.path)}`;
  return {
    capabilityId,
    kind: artifact.kind,
    name: artifact.path,
    disposition: artifact.disposition,
    configurationScope: artifact.configurationScope,
    canonicalSource: artifact.canonicalSource,
    surfaceVersionApplicability: surfaceVersions(["Local_Repository_Surface"]),
    activationCondition: artifact.activationCondition,
    owner: artifact.owner,
    approvalBoundaryRef: "no_boundary",
    evidenceRefs: artifact.evidenceRefs,
    validationAction: "inspect the artifact on the selected Active_Surface before activation",
    expectedSideEffects: ["no capability activation or external routing from static inventory"],
    rollbackPath: artifact.rollbackPath,
    reason: `inventory status: ${artifact.inventoryStatus}`,
    knownGapRefs,
  };
}

function collectPowerCandidates(input: CapabilityEvaluatorInput, root: string): PowerCandidateInput[] {
  const candidates: PowerCandidateInput[] = [
    ...(input.powers ?? []),
    ...(input.installedPowers ?? []),
  ];
  const paths = [
    ...(input.powerPaths ?? []),
    ...(input.artifacts ?? [])
      .filter((artifact) => artifact.kind === "Kiro_Power")
      .map((artifact) => artifact.path),
    ...discoverPowerPaths(root),
  ];
  const seen = new Set(candidates.map((candidate) => normalizeLocator(candidate.pathOrInstallation)));
  for (const path of paths) {
    const normalized = normalizeLocator(path);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    candidates.push({ pathOrInstallation: normalized });
  }
  return candidates;
}

function collectExtensionCandidates(input: CapabilityEvaluatorInput, root: string): ExtensionCandidateInput[] {
  const explicit: ExtensionCandidateInput[] = [
    ...(input.extensions ?? []),
    ...(input.mcpServices ?? []),
    ...(input.tools ?? []),
    ...(input.customAgents ?? []),
    ...(input.subagents ?? []),
  ];
  const discovered = discoverArtifactExtensions(root, input.artifacts ?? []);
  const all = [...explicit, ...discovered];
  const seen = new Set<string>();
  return all.filter((candidate) => {
    const raw = candidate as Record<string, unknown>;
    const key = `${String(raw.kind ?? "Tool_Surface")}::${String(raw.name ?? raw.canonicalSource ?? raw.configurationFormat ?? "unnamed")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function evaluateCapabilitiesInternal(input: CapabilityEvaluatorInput = {}): StageResult<CapabilityEvaluationResult> {
  const root = resolve(input.repositoryRoot ?? REPOSITORY_ROOT);
  const context: EvaluationContext = {
    repositoryRoot: root,
    ownerDecisions: input.ownerDecisions ?? [],
    validationRuns: input.validationRuns ?? [],
    targetSurface: input.targetSurface,
    knownGaps: [],
    policyViolations: [],
    blockers: [],
  };
  const powers: EvaluatedPowerRecord[] = [];
  const extensions: EvaluatedExtensionRecord[] = [];
  const dispositions: CapabilityDispositionRecord[] = [];
  const answers: RepositoryAnswerCheck[] = [];
  const evidence: CapabilityEvidenceRecord[] = [];
  const observations: PowerObservation[] = [];
  const seenDispositionIds = new Set<string>();

  collectPowerCandidates(input, root).forEach((candidate, index) => {
    const assessment = evaluatePower(candidate, context, index);
    powers.push(assessment.record);
    answers.push(assessment.answer);
    evidence.push(assessment.evidence);
    observations.push(...assessment.record.observations);
    dispositions.push(assessment.disposition);
    context.blockers.push(...assessment.record.blockers.map((blocker) => `${assessment.record.name}: ${blocker}`));
    seenDispositionIds.add(assessment.disposition.capabilityId);
  });

  collectExtensionCandidates(input, root).forEach((candidate, index) => {
    const assessment = evaluateExtension(candidate, context, index);
    extensions.push(assessment.record);
    answers.push(assessment.answer);
    evidence.push(assessment.evidence);
    dispositions.push(assessment.disposition);
    context.blockers.push(...assessment.record.blockers.map((blocker) => `${assessment.record.name}: ${blocker}`));
    seenDispositionIds.add(assessment.disposition.capabilityId);
  });

  for (const artifact of input.artifacts ?? []) {
    if (!(["MCP_Service", "Tool_Surface", "Custom_Agent", "Subagent"] as readonly ArtifactKind[]).includes(artifact.kind)) continue;
    const artifactId = `artifact:${slug(artifact.kind)}:${slug(artifact.path)}`;
    if (seenDispositionIds.has(artifactId)) continue;
    dispositions.push(artifactDisposition(artifact));
    seenDispositionIds.add(artifactId);
  }

  const output: CapabilityEvaluationResult = {
    dispositions,
    knownGaps: context.knownGaps,
    policyViolations: uniqueStrings(context.policyViolations),
    powers,
    powerRecords: powers,
    extensions,
    extensionRecords: extensions,
    observations,
    repositoryAnswerChecks: answers,
    evidence,
    externalRoutingAttempted: false,
    blockers: uniqueStrings(context.blockers),
  };

  const allBlockers = uniqueStrings([...context.blockers, ...context.policyViolations]);
  if (allBlockers.length === 0) {
    return { status: "pass", output, blockers: [], evidenceRefs: evidence.map((item) => item.capabilityId) };
  }
  if (powers.length === 0 && extensions.length === 0 && (input.artifacts ?? []).length === 0) {
    return { status: "pass", output, blockers: [], evidenceRefs: [] };
  }
  return {
    status: "partial",
    output,
    blockers: allBlockers,
    evidenceRefs: unique([
      ...evidence.map((item) => item.capabilityId),
      ...answers.map((answer) => answer.checkId),
      ...context.knownGaps.flatMap((gap) => gap.evidenceRefs),
    ]),
  };
}

export function evaluateCapabilities(input: CapabilityEvaluatorInput = {}): StageResult<CapabilityEvaluationResult> {
  return evaluateCapabilitiesInternal(input);
}

export class CapabilityEvaluator {
  evaluate(input: CapabilityEvaluatorInput = {}): StageResult<CapabilityEvaluationResult> {
    return evaluateCapabilitiesInternal(input);
  }
}

export const capabilityEvaluator = new CapabilityEvaluator();
export const assessCapabilities = evaluateCapabilities;
export const evaluatePowerCapabilities = evaluateCapabilities;
export default capabilityEvaluator;

export const POWER_FORMATS: readonly PowerFormat[] = ["Legacy_POWER", "Agent_Plugin", "Both", "Neither"];
export const CAPABILITY_EXTENSION_KINDS: readonly ExtensionKind[] = ["MCP_Service", "Tool_Surface", "Custom_Agent", "Subagent"];
export const CAPABILITY_DEFAULT_CONCURRENCY: DefaultTaskConcurrency = 0;
export const CAPABILITY_REPOSITORY_GUIDANCE_SOURCES = [
  "AGENTS.md",
  ".kiro/skills/repo-map/SKILL.md",
  "scripts/graph-impact.mjs",
] as const;
export const CAPABILITY_INITIAL_SKILL_SET = INITIAL_SKILL_CANDIDATES;
