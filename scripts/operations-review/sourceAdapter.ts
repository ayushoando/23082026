import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { SourceReference } from "./models";

/**
 * The only repository sources this review may read. The adapter has no API for
 * writing outputs, reading environment files, or accessing provider clients.
 */
export const REPOSITORY_SOURCE_ALLOWLIST = [
  "vercel.json",
  "package.json",
  "OPERATIONS_RUNBOOK.md",
  "scripts/run-ops.mjs",
  "workers/oando-worker-proxy/wrangler.toml",
  "workers/oando-worker-proxy/package.json",
  "workers/oando-worker-proxy/src/index.js",
  "docs/database/ops.md",
  ".github/workflows/supabase-backup-r2.yml",
  "site/instrumentation.ts",
  "site/lib/observability/metrics.ts",
] as const;

/** Approved source roots whose text files may be read by future extractors. */
export const REPOSITORY_SOURCE_DIRECTORY_ALLOWLIST = [
  "site/platform/supabase/migrations",
  "site/platform/supabase/migrations.admin",
  "config/observability",
] as const;

export type AllowedRepositorySource =
  | (typeof REPOSITORY_SOURCE_ALLOWLIST)[number]
  | `${(typeof REPOSITORY_SOURCE_DIRECTORY_ALLOWLIST)[number]}/${string}`;

export interface RepositorySource {
  readonly content: string;
  readonly source: SourceReference;
}

export class RepositorySourceAccessError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "RepositorySourceAccessError";
  }
}

/**
 * Read-only source boundary for the review tool. It deliberately imports only
 * Node filesystem, path, and crypto primitives; no environment, process,
 * network, child-process, SDK, or output-writing capability is available.
 */
export class RepositorySourceAdapter {
  private readonly rootDirectory: string;

  public constructor(repositoryRoot: string) {
    this.rootDirectory = path.resolve(repositoryRoot);
  }

  public async readSource(
    requestedPath: AllowedRepositorySource,
    locator: string,
    observedAt = new Date().toISOString(),
  ): Promise<RepositorySource> {
    const sourcePath = this.normalizeAndAssertAllowed(requestedPath);
    const normalizedLocator = locator.trim();

    if (!normalizedLocator) {
      throw new RepositorySourceAccessError(
        "A repository observation requires a non-empty source locator.",
      );
    }

    const absolutePath = path.resolve(this.rootDirectory, sourcePath);
    this.assertInsideRepository(absolutePath);

    const content = await readFile(absolutePath, "utf8");
    return {
      content,
      source: {
        path: sourcePath,
        locator: normalizedLocator,
        observedAt,
        contentDigest: createHash("sha256").update(content, "utf8").digest("hex"),
      },
    };
  }

  private normalizeAndAssertAllowed(requestedPath: string): AllowedRepositorySource {
    const normalizedPath = requestedPath.replaceAll("\\", "/").replace(/^\.\//, "");

    if (path.isAbsolute(requestedPath) || normalizedPath.includes("..")) {
      throw new RepositorySourceAccessError(
        `Repository source path must be a relative allowlisted path: ${requestedPath}`,
      );
    }

    const isExactAllowlistedFile = REPOSITORY_SOURCE_ALLOWLIST.includes(
      normalizedPath as (typeof REPOSITORY_SOURCE_ALLOWLIST)[number],
    );
    const isWithinAllowlistedDirectory = REPOSITORY_SOURCE_DIRECTORY_ALLOWLIST.some(
      (directory) => normalizedPath.startsWith(`${directory}/`),
    );

    if (!isExactAllowlistedFile && !isWithinAllowlistedDirectory) {
      throw new RepositorySourceAccessError(
        `Repository source is not approved for this review: ${normalizedPath}`,
      );
    }

    return normalizedPath as AllowedRepositorySource;
  }

  private assertInsideRepository(candidatePath: string): void {
    const relativePath = path.relative(this.rootDirectory, candidatePath);
    const escapesRoot =
      relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath);

    if (escapesRoot) {
      throw new RepositorySourceAccessError("Repository source path escapes the repository root.");
    }
  }
}
