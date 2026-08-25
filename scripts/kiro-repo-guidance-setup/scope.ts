import type {
  ApprovalBoundary,
  ApprovalBoundaryStatus,
  ConfigurationScope,
  KiroSurface,
  PermissionProbe,
  PermissionProbeOutcome,
  StageResult,
} from "./contracts";

const CONFIGURATION_SCOPES = new Set<ConfigurationScope>([
  "global",
  "project",
  "agent",
  "file_match",
  "manual",
  "workspace_root_permission",
  "user_permission",
  "external_service",
]);

const KIRO_SURFACES = new Set<KiroSurface>([
  "IDE",
  "CLI 2.x",
  "CLI 3.x",
  "Web",
  "Mobile",
  "Cloud/Crew",
  "Local_Repository_Surface",
]);

const APPROVAL_STATUSES = new Set<ApprovalBoundaryStatus>([
  "pending",
  "approved",
  "rejected",
  "expired",
]);

const PERMISSION_PROBE_OUTCOMES = new Set<PermissionProbeOutcome>([
  "allowed",
  "denied",
  "prompted",
  "restricted",
]);

const SECRET_VALUE_PATTERN = /(?:api[_-]?key|authorization|bearer|secret|token)\s*(?:[:=]|\s)\s*[^\s<>{}[\]]+/i;

export interface ApprovalBoundaryOperationInput {
  readonly boundary: ApprovalBoundary;
  readonly permissionProbes?: readonly PermissionProbe[];
  readonly requiredProbeOutcomes?: readonly PermissionProbeOutcome[];
}

export interface ApprovalBoundaryAssessment {
  readonly boundary: ApprovalBoundary;
  readonly permissionProbes: readonly PermissionProbe[];
  readonly requiredProbeOutcomes: readonly PermissionProbeOutcome[];
  readonly canProceed: boolean;
  readonly preservedPriorState: true;
  readonly blockers: readonly string[];
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function hasValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isKnownScope(value: unknown): value is ConfigurationScope {
  return typeof value === "string" && CONFIGURATION_SCOPES.has(value as ConfigurationScope);
}

function isKnownSurface(value: unknown): value is KiroSurface {
  return typeof value === "string" && KIRO_SURFACES.has(value as KiroSurface);
}

function isKnownApprovalStatus(value: unknown): value is ApprovalBoundaryStatus {
  return typeof value === "string" && APPROVAL_STATUSES.has(value as ApprovalBoundaryStatus);
}

function isKnownProbeOutcome(value: unknown): value is PermissionProbeOutcome {
  return typeof value === "string" && PERMISSION_PROBE_OUTCOMES.has(value as PermissionProbeOutcome);
}

function isIsoDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}(?:T.*Z)?$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function containsSecretValue(value: string): boolean {
  return SECRET_VALUE_PATTERN.test(value);
}

function boundaryBlockers(boundary: ApprovalBoundary): string[] {
  const blockers: string[] = [];

  if (!hasValue(boundary?.boundaryId)) blockers.push("approval boundary requires a stable boundaryId");
  if (!isKnownScope(boundary?.scope)) blockers.push("approval boundary requires a known configuration scope");
  if (!hasValue(boundary?.requestedChange)) blockers.push("approval boundary requires a requested change");
  if (!isKnownSurface(boundary?.targetSurface)) blockers.push("approval boundary requires a known target surface");
  if (!hasValue(boundary?.owner)) blockers.push("approval boundary requires an owner");
  if (!isKnownApprovalStatus(boundary?.approvalStatus)) {
    blockers.push("approval boundary requires a known approval status");
  }
  if (!hasValue(boundary?.preChangeStateRef)) blockers.push("approval boundary requires pre-change state");
  if (!hasValue(boundary?.securityBoundary)) blockers.push("approval boundary requires a security or data boundary");
  if (!Array.isArray(boundary?.expectedSideEffects) || boundary.expectedSideEffects.length === 0 || !boundary.expectedSideEffects.every(hasValue)) {
    blockers.push("approval boundary requires expected side effects");
  }
  if (!hasValue(boundary?.rollbackPathRef)) blockers.push("approval boundary requires a rollback path");

  if (hasValue(boundary?.requestedChange) && containsSecretValue(boundary.requestedChange)) {
    blockers.push("approval boundary requested change must name a credential boundary without recording a credential value");
  }
  if (hasValue(boundary?.securityBoundary) && containsSecretValue(boundary.securityBoundary)) {
    blockers.push("approval boundary security boundary must not contain a secret value");
  }

  if (boundary?.approvalStatus === "approved") {
    if (!isIsoDate(boundary.approvalDate)) {
      blockers.push("an approved approval boundary requires an ISO approval date");
    }
  } else {
    blockers.push(`approval boundary is ${String(boundary?.approvalStatus)} and blocks the operation`);
  }

  return blockers;
}

function probeBlockers(probes: readonly PermissionProbe[], requiredOutcomes: readonly PermissionProbeOutcome[]): string[] {
  const blockers: string[] = [];
  const seenProbeIds = new Set<string>();

  for (const probe of probes) {
    if (!hasValue(probe?.probeId)) {
      blockers.push("permission probe requires a stable probeId");
      continue;
    }
    if (seenProbeIds.has(probe.probeId)) {
      blockers.push(`permission probe ${probe.probeId} is duplicated`);
    }
    seenProbeIds.add(probe.probeId);

    if (!isKnownSurface(probe.surface)) blockers.push(`permission probe ${probe.probeId} has an unknown surface`);
    if (!hasValue(probe.action)) blockers.push(`permission probe ${probe.probeId} requires an action`);
    if (!isKnownProbeOutcome(probe.outcome)) blockers.push(`permission probe ${probe.probeId} has an unknown outcome`);
    if (!hasValue(probe.evidenceRef)) blockers.push(`permission probe ${probe.probeId} requires evidence`);
  }

  for (const outcome of requiredOutcomes) {
    if (!isKnownProbeOutcome(outcome)) {
      blockers.push(`required permission probe outcome ${String(outcome)} is unknown`);
      continue;
    }
    if (!probes.some((probe) => probe.outcome === outcome)) {
      blockers.push(`required permission probe outcome ${outcome} was not recorded`);
    }
  }

  return blockers;
}

/**
 * Assesses an approval-boundary operation without invoking tools, changing
 * settings, or broadening permissions. A caller may proceed only after this
 * pure check returns pass; pending or incomplete boundaries fail closed.
 */
export function assessApprovalBoundaryOperation(
  input: ApprovalBoundaryOperationInput,
): StageResult<ApprovalBoundaryAssessment> {
  const probes = input.permissionProbes ?? [];
  const requiredProbeOutcomes = input.requiredProbeOutcomes ?? [];
  const blockers = unique([
    ...boundaryBlockers(input.boundary),
    ...probeBlockers(probes, requiredProbeOutcomes),
  ]);
  const output: ApprovalBoundaryAssessment = {
    boundary: input.boundary,
    permissionProbes: probes,
    requiredProbeOutcomes,
    canProceed: blockers.length === 0,
    preservedPriorState: true,
    blockers,
  };
  const evidenceRefs = unique([
    input.boundary?.preChangeStateRef ?? "",
    input.boundary?.rollbackPathRef ?? "",
    ...probes.map((probe) => probe.evidenceRef),
  ]);

  if (blockers.length > 0) {
    return { status: "blocked", output, blockers, evidenceRefs };
  }

  return { status: "pass", output, blockers: [], evidenceRefs };
}

export const assessApprovalBoundary = assessApprovalBoundaryOperation;
