import path from "node:path";

import type { AuditRunConfiguration } from "./config";

export type ApprovedArtifactClass =
  | "audit-tooling"
  | "generated-evidence"
  | "authored-audit-work";

export interface ApprovedArtifactPath {
  readonly artifactClass: ApprovedArtifactClass;
  readonly absolutePath: string;
  readonly relativePath: string;
}

export class AuditArtifactPathError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AuditArtifactPathError";
  }
}

const RUN_ID_PATTERN = /^\d{8}T\d{9}Z-[a-f0-9]{12}-[a-f0-9]{12}$/;
const SAFE_SEGMENT_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

function normalizeRelativePath(requestedPath: string): string {
  if (!requestedPath.trim() || path.isAbsolute(requestedPath)) {
    throw new AuditArtifactPathError(
      "Audit artifact path must be a non-empty repository-relative path.",
    );
  }
  const normalized = requestedPath.replaceAll("\\", "/").replace(/^\.\//, "");
  const segments = normalized.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new AuditArtifactPathError(
      `Audit artifact path contains an unsafe segment: ${requestedPath}`,
    );
  }
  return normalized;
}

function isWithin(relativePath: string, root: string): boolean {
  return relativePath === root || relativePath.startsWith(`${root}/`);
}

function classifyApprovedPath(
  relativePath: string,
  config: AuditRunConfiguration,
  expectedRunId?: string,
): ApprovedArtifactClass {
  const { toolingRoot, generatedRoot, authoredRoot } = config.artifactPaths;

  if (isWithin(relativePath, toolingRoot)) {
    return "audit-tooling";
  }

  if (isWithin(relativePath, generatedRoot)) {
    const suffix = relativePath.slice(generatedRoot.length + 1).split("/");
    const [runId, purpose, ...artifactSegments] = suffix;
    if (
      !runId ||
      !RUN_ID_PATTERN.test(runId) ||
      (expectedRunId !== undefined && runId !== expectedRunId) ||
      !purpose ||
      !config.artifactPaths.generatedPurposes.includes(purpose) ||
      artifactSegments.length === 0
    ) {
      throw new AuditArtifactPathError(
        "Generated evidence must be partitioned by the current run ID and an approved purpose.",
      );
    }
    return "generated-evidence";
  }

  if (isWithin(relativePath, authoredRoot)) {
    const suffix = relativePath.slice(authoredRoot.length + 1).split("/");
    const [reportType, ...artifactSegments] = suffix;
    if (
      !reportType ||
      !config.artifactPaths.authoredReportTypes.includes(reportType) ||
      artifactSegments.length === 0
    ) {
      throw new AuditArtifactPathError(
        "Authored audit work must use an approved report-type subfolder.",
      );
    }
    return "authored-audit-work";
  }

  throw new AuditArtifactPathError(
    `Audit writes are prohibited outside approved non-product paths: ${relativePath}`,
  );
}

export function resolveApprovedArtifactPath(
  repositoryRoot: string,
  requestedPath: string,
  config: AuditRunConfiguration,
  expectedRunId?: string,
): ApprovedArtifactPath {
  const relativePath = normalizeRelativePath(requestedPath);
  const artifactClass = classifyApprovedPath(
    relativePath,
    config,
    expectedRunId,
  );
  const absoluteRoot = path.resolve(repositoryRoot);
  const absolutePath = path.resolve(absoluteRoot, relativePath);
  const rootRelative = path.relative(absoluteRoot, absolutePath);
  if (
    rootRelative === ".." ||
    rootRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(rootRelative)
  ) {
    throw new AuditArtifactPathError(
      "Audit artifact path escapes the repository root.",
    );
  }

  return Object.freeze({ artifactClass, absolutePath, relativePath });
}

export function createGeneratedArtifactPath(
  runId: string,
  purpose: string,
  artifactPath: string,
  config: AuditRunConfiguration,
): string {
  return [
    config.artifactPaths.generatedRoot,
    runId,
    purpose,
    normalizeRelativePath(artifactPath),
  ].join("/");
}

export function createSurfacePartitionArtifactPath(
  runId: string,
  purpose: string,
  surface: keyof AuditRunConfiguration["surfacePartitions"],
  artifactPath: string,
  config: AuditRunConfiguration,
): string {
  const partition = config.surfacePartitions[surface];
  if (!partition || !SAFE_SEGMENT_PATTERN.test(partition)) {
    throw new AuditArtifactPathError(
      `Unknown or unsafe surface partition: ${String(surface)}`,
    );
  }
  return createGeneratedArtifactPath(
    runId,
    purpose,
    `${partition}/${normalizeRelativePath(artifactPath)}`,
    config,
  );
}

export function verifyFailClosedArtifactPolicy(
  repositoryRoot: string,
  config: AuditRunConfiguration,
): void {
  const prohibitedPaths = [
    "site/app/page.tsx",
    "site/components/AuditReport.tsx",
    "results/audit.json",
    "results/site-ui-content-links-audit/report.json",
    "audit-report.md",
    "site/platform/supabase/migrations/audit.sql",
    "vercel.json",
  ];

  for (const prohibitedPath of prohibitedPaths) {
    try {
      resolveApprovedArtifactPath(repositoryRoot, prohibitedPath, config);
    } catch (error) {
      if (error instanceof AuditArtifactPathError) {
        continue;
      }
      throw error;
    }
    throw new AuditArtifactPathError(
      `Fail-closed policy unexpectedly accepted prohibited path: ${prohibitedPath}`,
    );
  }
}
